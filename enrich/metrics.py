#!/usr/bin/env python3
"""
Metrics Collector for Enrichment Worker

Provides Prometheus-compatible metrics:
- Counter: processed_events_total, error_events_total
- Gauge: processing_queue_size, cache_size
- Histogram: processing_latency_seconds
- Summary: cache_hit_rate

Exposes /metrics HTTP endpoint for Prometheus scraping.
"""

import logging
import time
from typing import Dict, Any, List
from threading import Lock
from collections import defaultdict
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class MetricsCollector:
    """
    Collects and exposes Prometheus metrics.
    
    Metrics tracked:
    - processed_events_total: Counter of successfully enriched events
    - error_events_total: Counter of errors by type
    - processing_latency_seconds: Histogram of enrichment duration
    - cache_hit_rate: Gauge for cache effectiveness
    - queue_size: Gauge for backpressure monitoring
    """
    
    def __init__(self):
        """Initialize metrics collector."""
        self._lock = Lock()
        
        # Counters
        self._processed_total = 0
        self._errors_total = defaultdict(int)  # {error_type: count}
        
        # Latency tracking (for histogram)
        self._latencies: List[float] = []
        self._max_latency_samples = 10000  # Keep last 10k samples
        
        # Gauge values
        self._queue_size = 0
        self._cache_stats = {}
        
        # Start time
        self._start_time = time.time()
        
        logger.info("Metrics collector initialized")
    
    def increment_processed(self, count: int = 1):
        """
        Increment processed events counter.
        
        Args:
            count: Number of events processed
        """
        with self._lock:
            self._processed_total += count
    
    def increment_errors(self, error_type: str, count: int = 1):
        """
        Increment error counter for specific error type.
        
        Args:
            error_type: Type of error (e.g., 'geoip_lookup', 'parse_error')
            count: Number of errors
        """
        with self._lock:
            self._errors_total[error_type] += count
    
    def observe_latency(self, duration_seconds: float):
        """
        Record processing latency.
        
        Args:
            duration_seconds: Time taken to process event
        """
        with self._lock:
            self._latencies.append(duration_seconds)
            
            # Keep only recent samples
            if len(self._latencies) > self._max_latency_samples:
                self._latencies = self._latencies[-self._max_latency_samples:]
    
    def set_queue_size(self, size: int):
        """
        Update queue size gauge.
        
        Args:
            size: Current queue size
        """
        with self._lock:
            self._queue_size = size
    
    def update_cache_stats(self, cache_stats: Dict[str, Dict[str, Any]]):
        """
        Update cache statistics.
        
        Args:
            cache_stats: Dict from CacheManager.stats()
        """
        with self._lock:
            self._cache_stats = cache_stats
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get all metrics as dict (for JSON API).
        
        Returns:
            Dict with all current metric values
        """
        with self._lock:
            # Calculate latency percentiles
            latency_stats = self._calculate_latency_stats()
            
            # Calculate cache hit rate (weighted average)
            cache_hit_rate = self._calculate_cache_hit_rate()
            
            # Uptime
            uptime_seconds = time.time() - self._start_time
            
            return {
                'counters': {
                    'processed_events_total': self._processed_total,
                    'error_events_total': sum(self._errors_total.values()),
                    'errors_by_type': dict(self._errors_total)
                },
                'gauges': {
                    'processing_queue_size': self._queue_size,
                    'cache_hit_rate_percent': cache_hit_rate,
                    'uptime_seconds': round(uptime_seconds, 2)
                },
                'latency': latency_stats,
                'cache': self._cache_stats,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    def get_prometheus_metrics(self) -> str:
        """
        Get metrics in Prometheus text format.
        
        Returns:
            Prometheus-formatted metrics string
        """
        metrics = self.get_metrics()
        
        lines = [
            "# HELP processed_events_total Total number of successfully enriched events",
            "# TYPE processed_events_total counter",
            f"processed_events_total {metrics['counters']['processed_events_total']}",
            "",
            "# HELP error_events_total Total number of errors during enrichment",
            "# TYPE error_events_total counter",
            f"error_events_total {metrics['counters']['error_events_total']}",
            ""
        ]
        
        # Errors by type
        if metrics['counters']['errors_by_type']:
            lines.extend([
                "# HELP error_events_by_type Number of errors by error type",
                "# TYPE error_events_by_type counter"
            ])
            for error_type, count in metrics['counters']['errors_by_type'].items():
                lines.append(f'error_events_by_type{{type="{error_type}"}} {count}')
            lines.append("")
        
        # Queue size
        lines.extend([
            "# HELP processing_queue_size Current number of events in processing queue",
            "# TYPE processing_queue_size gauge",
            f"processing_queue_size {metrics['gauges']['processing_queue_size']}",
            ""
        ])
        
        # Cache hit rate
        lines.extend([
            "# HELP cache_hit_rate_percent Cache hit rate as percentage",
            "# TYPE cache_hit_rate_percent gauge",
            f"cache_hit_rate_percent {metrics['gauges']['cache_hit_rate_percent']}",
            ""
        ])
        
        # Uptime
        lines.extend([
            "# HELP uptime_seconds Worker uptime in seconds",
            "# TYPE uptime_seconds gauge",
            f"uptime_seconds {metrics['gauges']['uptime_seconds']}",
            ""
        ])
        
        # Latency histogram
        if metrics['latency']['count'] > 0:
            lines.extend([
                "# HELP processing_latency_seconds Event processing latency",
                "# TYPE processing_latency_seconds summary",
                f"processing_latency_seconds{{quantile=\"0.5\"}} {metrics['latency']['p50']}",
                f"processing_latency_seconds{{quantile=\"0.9\"}} {metrics['latency']['p90']}",
                f"processing_latency_seconds{{quantile=\"0.99\"}} {metrics['latency']['p99']}",
                f"processing_latency_seconds_sum {metrics['latency']['sum']}",
                f"processing_latency_seconds_count {metrics['latency']['count']}",
                ""
            ])
        
        # Cache sizes
        for cache_name, cache_stats in metrics.get('cache', {}).items():
            lines.extend([
                f"# HELP cache_size_{cache_name} Current {cache_name} cache size",
                f"# TYPE cache_size_{cache_name} gauge",
                f"cache_size_{cache_name} {cache_stats.get('size', 0)}",
                ""
            ])
        
        return '\n'.join(lines)
    
    def _calculate_latency_stats(self) -> Dict[str, float]:
        """
        Calculate latency statistics from samples.
        
        Returns:
            Dict with count, sum, mean, p50, p90, p99, max
        """
        if not self._latencies:
            return {
                'count': 0,
                'sum': 0.0,
                'mean': 0.0,
                'p50': 0.0,
                'p90': 0.0,
                'p99': 0.0,
                'max': 0.0
            }
        
        sorted_latencies = sorted(self._latencies)
        count = len(sorted_latencies)
        total = sum(sorted_latencies)
        
        def percentile(p: float) -> float:
            k = (count - 1) * p
            f = int(k)
            c = f + 1
            if c >= count:
                return sorted_latencies[-1]
            d0 = sorted_latencies[f]
            d1 = sorted_latencies[c]
            return d0 + (d1 - d0) * (k - f)
        
        return {
            'count': count,
            'sum': round(total, 4),
            'mean': round(total / count, 4),
            'p50': round(percentile(0.50), 4),
            'p90': round(percentile(0.90), 4),
            'p99': round(percentile(0.99), 4),
            'max': round(sorted_latencies[-1], 4)
        }
    
    def _calculate_cache_hit_rate(self) -> float:
        """
        Calculate weighted average cache hit rate.
        
        Returns:
            Hit rate as percentage (0-100)
        """
        if not self._cache_stats:
            return 0.0
        
        total_hits = 0
        total_requests = 0
        
        for cache_stats in self._cache_stats.values():
            hits = cache_stats.get('hits', 0)
            misses = cache_stats.get('misses', 0)
            total_hits += hits
            total_requests += hits + misses
        
        if total_requests == 0:
            return 0.0
        
        return round((total_hits / total_requests) * 100, 2)
    
    def reset(self):
        """Reset all metrics (for testing)."""
        with self._lock:
            self._processed_total = 0
            self._errors_total.clear()
            self._latencies.clear()
            self._queue_size = 0
            self._cache_stats.clear()
            self._start_time = time.time()


class MetricsServer:
    """
    Simple HTTP server for /metrics endpoint.
    
    Runs in background thread, serves Prometheus metrics.
    """
    
    def __init__(self, metrics_collector: MetricsCollector, port: int = 9090):
        """
        Initialize metrics server.
        
        Args:
            metrics_collector: MetricsCollector instance
            port: HTTP port for /metrics endpoint
        """
        self.metrics_collector = metrics_collector
        self.port = port
        self._server = None
        self._thread = None
        
        logger.info(f"Metrics server will listen on port {port}")
    
    def start(self):
        """Start metrics HTTP server in background thread."""
        try:
            from http.server import HTTPServer, BaseHTTPRequestHandler
            from threading import Thread
            
            collector = self.metrics_collector
            
            class MetricsHandler(BaseHTTPRequestHandler):
                def do_GET(self):
                    if self.path == '/metrics':
                        # Prometheus format
                        metrics_text = collector.get_prometheus_metrics()
                        self.send_response(200)
                        self.send_header('Content-Type', 'text/plain; version=0.0.4')
                        self.end_headers()
                        self.wfile.write(metrics_text.encode('utf-8'))
                    
                    elif self.path == '/metrics/json':
                        # JSON format (for debugging)
                        import json
                        metrics_dict = collector.get_metrics()
                        self.send_response(200)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps(metrics_dict, indent=2).encode('utf-8'))
                    
                    elif self.path == '/health':
                        # Health check
                        self.send_response(200)
                        self.send_header('Content-Type', 'text/plain')
                        self.end_headers()
                        self.wfile.write(b'OK')
                    
                    else:
                        self.send_response(404)
                        self.end_headers()
                
                def log_message(self, format, *args):
                    # Suppress request logs
                    pass
            
            self._server = HTTPServer(('0.0.0.0', self.port), MetricsHandler)
            
            def serve():
                logger.info(f"Metrics server started on http://0.0.0.0:{self.port}/metrics")
                self._server.serve_forever()
            
            self._thread = Thread(target=serve, daemon=True)
            self._thread.start()
            
        except Exception as e:
            logger.error(f"Failed to start metrics server: {e}")
    
    def stop(self):
        """Stop metrics server."""
        if self._server:
            self._server.shutdown()
            logger.info("Metrics server stopped")
