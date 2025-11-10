#!/usr/bin/env python3
"""
State Manager for Enrichment Worker

Provides idempotent processing by tracking:
- File offsets (last processed position)
- Processed event IDs
- Processing statistics

Uses SQLite for persistence across restarts.
"""

import sqlite3
import logging
from pathlib import Path
from typing import Set, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from contextlib import contextmanager

logger = logging.getLogger(__name__)


class StateManager:
    """
    Manages processing state for idempotent enrichment.
    
    Tracks:
    - File offset in input JSONL
    - Set of processed event IDs
    - Processing statistics (count, errors, last run)
    """
    
    def __init__(self, state_db_path: Path = Path("/data/enrich_state.db")):
        """
        Initialize state manager.
        
        Args:
            state_db_path: Path to SQLite database for state persistence
        """
        self.state_db_path = Path(state_db_path)
        self.state_db_path.parent.mkdir(parents=True, exist_ok=True)
        
        self._init_database()
        logger.info(f"State manager initialized: {self.state_db_path}")
    
    def _init_database(self):
        """Create database schema if not exists."""
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS processing_state (
                    input_file TEXT PRIMARY KEY,
                    file_offset INTEGER NOT NULL DEFAULT 0,
                    last_processed_at TEXT,
                    total_processed INTEGER NOT NULL DEFAULT 0,
                    total_errors INTEGER NOT NULL DEFAULT 0
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS processed_events (
                    event_id TEXT PRIMARY KEY,
                    processed_at TEXT NOT NULL,
                    input_file TEXT NOT NULL
                )
            """)
            
            # Index for fast lookups
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_processed_events_file 
                ON processed_events(input_file)
            """)
            
            conn.commit()
    
    @contextmanager
    def _get_connection(self):
        """Get database connection with proper cleanup."""
        conn = sqlite3.connect(str(self.state_db_path))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
    
    def get_file_offset(self, input_file: str) -> int:
        """
        Get last processed offset for input file.
        
        Args:
            input_file: Path to input JSONL file
            
        Returns:
            Byte offset to resume from (0 if never processed)
        """
        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT file_offset FROM processing_state WHERE input_file = ?",
                (input_file,)
            )
            row = cursor.fetchone()
            offset = row['file_offset'] if row else 0
            logger.debug(f"File offset for {input_file}: {offset}")
            return offset
    
    def update_file_offset(self, input_file: str, offset: int):
        """
        Update file offset after processing.
        
        Args:
            input_file: Path to input JSONL file
            offset: New byte offset
        """
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO processing_state (input_file, file_offset, last_processed_at)
                VALUES (?, ?, ?)
                ON CONFLICT(input_file) DO UPDATE SET
                    file_offset = excluded.file_offset,
                    last_processed_at = excluded.last_processed_at
            """, (input_file, offset, datetime.now(timezone.utc).isoformat()))
            conn.commit()
        
        logger.debug(f"Updated file offset: {input_file} -> {offset}")
    
    def is_processed(self, event_id: str, input_file: str) -> bool:
        """
        Check if event ID has been processed.
        
        Args:
            event_id: Unique event identifier
            input_file: Source file path
            
        Returns:
            True if already processed
        """
        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT 1 FROM processed_events WHERE event_id = ? AND input_file = ?",
                (event_id, input_file)
            )
            return cursor.fetchone() is not None
    
    def mark_processed(self, event_id: str, input_file: str):
        """
        Mark event as processed.
        
        Args:
            event_id: Unique event identifier
            input_file: Source file path
        """
        with self._get_connection() as conn:
            try:
                conn.execute("""
                    INSERT INTO processed_events (event_id, processed_at, input_file)
                    VALUES (?, ?, ?)
                """, (event_id, datetime.now(timezone.utc).isoformat(), input_file))
                conn.commit()
            except sqlite3.IntegrityError:
                # Already processed (race condition)
                pass
    
    def increment_stats(self, input_file: str, processed: int = 0, errors: int = 0):
        """
        Increment processing statistics.
        
        Args:
            input_file: Source file path
            processed: Number of events processed
            errors: Number of errors encountered
        """
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO processing_state (input_file, total_processed, total_errors, last_processed_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(input_file) DO UPDATE SET
                    total_processed = total_processed + excluded.total_processed,
                    total_errors = total_errors + excluded.total_errors,
                    last_processed_at = excluded.last_processed_at
            """, (input_file, processed, errors, datetime.now(timezone.utc).isoformat()))
            conn.commit()
    
    def get_stats(self, input_file: str) -> Dict[str, Any]:
        """
        Get processing statistics.
        
        Args:
            input_file: Source file path
            
        Returns:
            Dict with total_processed, total_errors, last_processed_at
        """
        with self._get_connection() as conn:
            cursor = conn.execute("""
                SELECT total_processed, total_errors, last_processed_at
                FROM processing_state
                WHERE input_file = ?
            """, (input_file,))
            row = cursor.fetchone()
            
            if row:
                return {
                    'total_processed': row['total_processed'],
                    'total_errors': row['total_errors'],
                    'last_processed_at': row['last_processed_at']
                }
            else:
                return {
                    'total_processed': 0,
                    'total_errors': 0,
                    'last_processed_at': None
                }
    
    def cleanup_old_events(self, input_file: str, days: int = 30):
        """
        Remove processed event IDs older than retention period.
        
        Args:
            input_file: Source file path
            days: Retention period in days
        """
        cutoff = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        ) - timedelta(days=days)
        
        with self._get_connection() as conn:
            cursor = conn.execute("""
                DELETE FROM processed_events
                WHERE input_file = ? AND processed_at < ?
            """, (input_file, cutoff.isoformat()))
            deleted = cursor.rowcount
            conn.commit()
        
        if deleted > 0:
            logger.info(f"Cleaned up {deleted} old event IDs (>{days} days)")
    
    def reset(self, input_file: str):
        """
        Reset state for input file (for testing/debugging).
        
        Args:
            input_file: Source file path
        """
        with self._get_connection() as conn:
            conn.execute("DELETE FROM processing_state WHERE input_file = ?", (input_file,))
            conn.execute("DELETE FROM processed_events WHERE input_file = ?", (input_file,))
            conn.commit()
        
        logger.warning(f"Reset state for {input_file}")
