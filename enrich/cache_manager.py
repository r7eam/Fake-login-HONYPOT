#!/usr/bin/env python3
"""
Cache Manager for Enrichment Worker

Provides TTL-based caching for expensive operations:
- GeoIP lookups (MaxMind database queries)
- ASN lookups (MaxMind ASN queries)
- Reverse DNS lookups (network I/O)

Features:
- In-memory LRU cache with TTL
- Optional disk persistence
- Thread-safe operations
- Configurable cache sizes and TTLs
"""

import json
import logging
import hashlib
import time
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from threading import Lock
from collections import OrderedDict
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class TTLCache:
    """
    Thread-safe LRU cache with TTL (Time-To-Live).
    
    Features:
    - Automatic expiration of stale entries
    - LRU eviction when size limit reached
    - Thread-safe operations
    """
    
    def __init__(self, max_size: int = 10000, default_ttl: int = 3600):
        """
        Initialize TTL cache.
        
        Args:
            max_size: Maximum number of entries
            default_ttl: Default TTL in seconds (1 hour)
        """
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._cache: OrderedDict[str, Tuple[Any, float]] = OrderedDict()
        self._lock = Lock()
        self._hits = 0
        self._misses = 0
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache if not expired.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if expired/not found
        """
        with self._lock:
            if key not in self._cache:
                self._misses += 1
                return None
            
            value, expiry = self._cache[key]
            
            # Check if expired
            if time.time() > expiry:
                del self._cache[key]
                self._misses += 1
                return None
            
            # Move to end (LRU)
            self._cache.move_to_end(key)
            self._hits += 1
            return value
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """
        Set value in cache with TTL.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: TTL in seconds (uses default if None)
        """
        ttl = ttl or self.default_ttl
        expiry = time.time() + ttl
        
        with self._lock:
            # Update existing or add new
            if key in self._cache:
                del self._cache[key]
            
            self._cache[key] = (value, expiry)
            
            # Evict oldest if over size limit
            if len(self._cache) > self.max_size:
                # Pop first (oldest) item
                self._cache.popitem(last=False)
    
    def clear(self):
        """Clear all cache entries."""
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0
    
    def stats(self) -> Dict[str, int]:
        """
        Get cache statistics.
        
        Returns:
            Dict with size, hits, misses, hit_rate
        """
        with self._lock:
            total = self._hits + self._misses
            hit_rate = (self._hits / total * 100) if total > 0 else 0.0
            
            return {
                'size': len(self._cache),
                'max_size': self.max_size,
                'hits': self._hits,
                'misses': self._misses,
                'hit_rate': round(hit_rate, 2)
            }


class CacheManager:
    """
    Manages caches for different enrichment data types.
    
    Provides separate caches for:
    - GeoIP data (country, city, coordinates)
    - ASN data (ASN number, organization)
    - Reverse DNS (hostname lookups)
    
    Supports optional disk persistence for cache survival across restarts.
    """
    
    def __init__(
        self,
        cache_dir: Optional[Path] = None,
        geoip_ttl: int = 86400,      # 24 hours
        asn_ttl: int = 86400,         # 24 hours
        rdns_ttl: int = 3600,         # 1 hour
        max_size: int = 10000
    ):
        """
        Initialize cache manager.
        
        Args:
            cache_dir: Directory for persistent cache (None = memory only)
            geoip_ttl: TTL for GeoIP entries in seconds
            asn_ttl: TTL for ASN entries in seconds
            rdns_ttl: TTL for reverse DNS entries in seconds
            max_size: Maximum entries per cache
        """
        self.cache_dir = Path(cache_dir) if cache_dir else None
        
        # Create separate caches for each data type
        self.geoip_cache = TTLCache(max_size=max_size, default_ttl=geoip_ttl)
        self.asn_cache = TTLCache(max_size=max_size, default_ttl=asn_ttl)
        self.rdns_cache = TTLCache(max_size=max_size, default_ttl=rdns_ttl)
        
        # Load from disk if persistence enabled
        if self.cache_dir:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            self._load_from_disk()
        
        logger.info(f"Cache manager initialized (GeoIP TTL={geoip_ttl}s, ASN TTL={asn_ttl}s, rDNS TTL={rdns_ttl}s)")
    
    def get_geoip(self, ip: str) -> Optional[Dict[str, Any]]:
        """Get cached GeoIP data for IP address."""
        return self.geoip_cache.get(ip)
    
    def set_geoip(self, ip: str, data: Dict[str, Any]):
        """Cache GeoIP data for IP address."""
        self.geoip_cache.set(ip, data)
    
    def get_asn(self, ip: str) -> Optional[Dict[str, Any]]:
        """Get cached ASN data for IP address."""
        return self.asn_cache.get(ip)
    
    def set_asn(self, ip: str, data: Dict[str, Any]):
        """Cache ASN data for IP address."""
        self.asn_cache.set(ip, data)
    
    def get_rdns(self, ip: str) -> Optional[str]:
        """Get cached reverse DNS for IP address."""
        return self.rdns_cache.get(ip)
    
    def set_rdns(self, ip: str, hostname: str):
        """Cache reverse DNS for IP address."""
        self.rdns_cache.set(ip, hostname)
    
    def _load_from_disk(self):
        """Load caches from disk (if persistence enabled)."""
        if not self.cache_dir:
            return
        
        cache_files = {
            'geoip': self.cache_dir / 'geoip_cache.json',
            'asn': self.cache_dir / 'asn_cache.json',
            'rdns': self.cache_dir / 'rdns_cache.json'
        }
        
        for cache_type, cache_file in cache_files.items():
            if not cache_file.exists():
                continue
            
            try:
                with open(cache_file, 'r') as f:
                    data = json.load(f)
                
                cache = getattr(self, f'{cache_type}_cache')
                loaded = 0
                
                for key, value in data.items():
                    # Set with default TTL (expiry will be recalculated)
                    cache.set(key, value)
                    loaded += 1
                
                logger.info(f"Loaded {loaded} {cache_type} entries from disk")
                
            except Exception as e:
                logger.warning(f"Failed to load {cache_type} cache from disk: {e}")
    
    def save_to_disk(self):
        """Save caches to disk (if persistence enabled)."""
        if not self.cache_dir:
            return
        
        caches = {
            'geoip': self.geoip_cache,
            'asn': self.asn_cache,
            'rdns': self.rdns_cache
        }
        
        for cache_type, cache in caches.items():
            cache_file = self.cache_dir / f'{cache_type}_cache.json'
            
            try:
                # Extract non-expired entries
                data = {}
                with cache._lock:
                    current_time = time.time()
                    for key, (value, expiry) in cache._cache.items():
                        if current_time < expiry:
                            data[key] = value
                
                # Write atomically (temp file + rename)
                temp_file = cache_file.with_suffix('.tmp')
                with open(temp_file, 'w') as f:
                    json.dump(data, f, indent=2)
                
                temp_file.replace(cache_file)
                logger.debug(f"Saved {len(data)} {cache_type} entries to disk")
                
            except Exception as e:
                logger.warning(f"Failed to save {cache_type} cache to disk: {e}")
    
    def stats(self) -> Dict[str, Dict[str, int]]:
        """
        Get statistics for all caches.
        
        Returns:
            Dict with stats for geoip, asn, rdns caches
        """
        return {
            'geoip': self.geoip_cache.stats(),
            'asn': self.asn_cache.stats(),
            'rdns': self.rdns_cache.stats()
        }
    
    def clear_all(self):
        """Clear all caches."""
        self.geoip_cache.clear()
        self.asn_cache.clear()
        self.rdns_cache.clear()
        logger.info("All caches cleared")
