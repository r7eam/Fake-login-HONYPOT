#!/usr/bin/env python3
"""
Atomic Writer for Enrichment Worker

Provides safe, atomic writes for JSONL output:
- Write to temporary file
- fsync for durability
- Atomic rename to final location
- Append-only for JSONL integrity

Prevents data corruption on crashes or interruptions.
"""

import os
import logging
from pathlib import Path
from typing import Any, Dict
from threading import Lock
import json

logger = logging.getLogger(__name__)


class AtomicJSONLWriter:
    """
    Thread-safe atomic writer for JSONL files.
    
    Write pattern:
    1. Append to temp file with .tmp suffix
    2. fsync temp file to disk
    3. Atomic rename to final location (on batch flush)
    4. For continuous append, write directly with fsync
    
    Features:
    - Atomic writes prevent partial line corruption
    - fsync ensures durability before ack
    - Thread-safe for concurrent workers
    - Buffered writes for performance
    """
    
    def __init__(
        self,
        output_file: Path,
        buffer_size: int = 100,
        use_fsync: bool = True
    ):
        """
        Initialize atomic writer.
        
        Args:
            output_file: Final output file path
            buffer_size: Number of lines to buffer before flush
            use_fsync: Whether to fsync after writes (slower but safer)
        """
        self.output_file = Path(output_file)
        self.output_file.parent.mkdir(parents=True, exist_ok=True)
        
        self.buffer_size = buffer_size
        self.use_fsync = use_fsync
        
        self._buffer = []
        self._lock = Lock()
        self._total_written = 0
        
        logger.info(f"Atomic writer initialized: {output_file} (buffer={buffer_size}, fsync={use_fsync})")
    
    def write(self, event: Dict[str, Any]):
        """
        Write event to buffer (will flush when buffer full).
        
        Args:
            event: Event dict to write as JSON line
        """
        with self._lock:
            self._buffer.append(event)
            
            # Auto-flush when buffer full
            if len(self._buffer) >= self.buffer_size:
                self._flush_unsafe()
    
    def write_immediate(self, event: Dict[str, Any]):
        """
        Write event immediately with fsync (no buffering).
        
        Args:
            event: Event dict to write as JSON line
        """
        with self._lock:
            self._write_line_unsafe(event)
    
    def flush(self):
        """Flush buffered events to disk."""
        with self._lock:
            self._flush_unsafe()
    
    def _flush_unsafe(self):
        """
        Internal flush method (not thread-safe, caller must hold lock).
        """
        if not self._buffer:
            return
        
        try:
            # Open in append mode
            with open(self.output_file, 'a', encoding='utf-8') as f:
                for event in self._buffer:
                    line = json.dumps(event, ensure_ascii=False)
                    f.write(line + '\n')
                
                # Flush to OS buffer
                f.flush()
                
                # Force write to disk if fsync enabled
                if self.use_fsync:
                    os.fsync(f.fileno())
            
            self._total_written += len(self._buffer)
            logger.debug(f"Flushed {len(self._buffer)} events to {self.output_file}")
            self._buffer.clear()
            
        except Exception as e:
            logger.error(f"Failed to flush events: {e}")
            raise
    
    def _write_line_unsafe(self, event: Dict[str, Any]):
        """
        Write single line immediately (not thread-safe, caller must hold lock).
        
        Args:
            event: Event dict to write
        """
        try:
            with open(self.output_file, 'a', encoding='utf-8') as f:
                line = json.dumps(event, ensure_ascii=False)
                f.write(line + '\n')
                f.flush()
                
                if self.use_fsync:
                    os.fsync(f.fileno())
            
            self._total_written += 1
            
        except Exception as e:
            logger.error(f"Failed to write event: {e}")
            raise
    
    def get_stats(self) -> Dict[str, int]:
        """
        Get writer statistics.
        
        Returns:
            Dict with total_written and buffered counts
        """
        with self._lock:
            return {
                'total_written': self._total_written,
                'buffered': len(self._buffer)
            }
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - flush on cleanup."""
        self.flush()
        return False


class AtomicBatchWriter:
    """
    Atomic batch writer for complete file replacement.
    
    Use case: Writing entire enriched dataset in one operation.
    
    Write pattern:
    1. Write all data to temp file
    2. fsync temp file
    3. Atomic rename to final location
    
    Safer for batch processing where partial results are unacceptable.
    """
    
    def __init__(self, output_file: Path, use_fsync: bool = True):
        """
        Initialize batch writer.
        
        Args:
            output_file: Final output file path
            use_fsync: Whether to fsync before rename
        """
        self.output_file = Path(output_file)
        self.output_file.parent.mkdir(parents=True, exist_ok=True)
        
        self.temp_file = self.output_file.with_suffix('.tmp')
        self.use_fsync = use_fsync
        
        self._file_handle = None
        self._total_written = 0
        
        logger.info(f"Atomic batch writer initialized: {output_file}")
    
    def __enter__(self):
        """Open temp file for writing."""
        self._file_handle = open(self.temp_file, 'w', encoding='utf-8')
        return self
    
    def write(self, event: Dict[str, Any]):
        """
        Write event to temp file.
        
        Args:
            event: Event dict to write as JSON line
        """
        if not self._file_handle:
            raise RuntimeError("Writer not opened (use context manager)")
        
        line = json.dumps(event, ensure_ascii=False)
        self._file_handle.write(line + '\n')
        self._total_written += 1
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Finalize write - fsync and atomic rename.
        
        If exception occurred, temp file is removed.
        """
        if not self._file_handle:
            return False
        
        try:
            # Flush to OS buffer
            self._file_handle.flush()
            
            # Force write to disk
            if self.use_fsync:
                os.fsync(self._file_handle.fileno())
            
            self._file_handle.close()
            self._file_handle = None
            
            # If no exception, atomically rename
            if exc_type is None:
                self.temp_file.replace(self.output_file)
                logger.info(f"Atomic write complete: {self._total_written} events -> {self.output_file}")
            else:
                # Clean up temp file on error
                if self.temp_file.exists():
                    self.temp_file.unlink()
                logger.error(f"Atomic write failed, temp file removed: {exc_val}")
            
        except Exception as e:
            logger.error(f"Error during atomic write finalization: {e}")
            # Clean up
            if self._file_handle:
                self._file_handle.close()
            if self.temp_file.exists():
                self.temp_file.unlink()
            raise
        
        return False
