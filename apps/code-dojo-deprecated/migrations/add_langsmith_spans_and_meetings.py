"""
Database Migration: Add LangSmith spans, topic question count, and scheduled meetings

This migration adds:
1. topic_question_count column to agent_sessions table
2. langsmith_topic_run_id column to goal_progress table
3. scheduled_meetings table for tracking instructor meetings

Usage:
    python migrations/add_langsmith_spans_and_meetings.py

This migration is idempotent - safe to run multiple times.
"""

import sys
import os
import sqlite3

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def get_database_path():
    """Get the database path from config."""
    try:
        from app import app

        db_uri = app.config["SQLALCHEMY_DATABASE_URI"]
        # Extract path from sqlite:///path
        if db_uri.startswith("sqlite:///"):
            db_path = db_uri.replace("sqlite:///", "")
            # If relative path, check instance folder first, then make it absolute
            if not os.path.isabs(db_path):
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

                # Check instance folder first (Flask default for SQLite)
                instance_path = os.path.join(base_dir, "instance", db_path)
                if os.path.exists(instance_path):
                    return instance_path

                # Otherwise use relative to base directory
                db_path = os.path.join(base_dir, db_path)
            return db_path
        else:
            print("Error: This script only supports SQLite databases")
            sys.exit(1)
    except Exception as e:
        print(f"Error getting database path: {e}")
        sys.exit(1)


def table_exists(cursor, table_name):
    """Check if a table exists."""
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,)
    )
    return cursor.fetchone() is not None


def column_exists(cursor, table_name, column_name):
    """Check if a column exists in a table."""
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [row[1] for row in cursor.fetchall()]
    return column_name in columns


def run_migration():
    """Execute the migration."""
    print("Starting migration: Add LangSmith spans and scheduled meetings")
    print("=" * 60)

    db_path = get_database_path()
    print(f"\nDatabase: {db_path}")

    if not os.path.exists(db_path):
        print(f"Error: Database file not found at {db_path}")
        sys.exit(1)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Add topic_question_count to agent_sessions
        print("\n1. Checking agent_sessions.topic_question_count...")
        if table_exists(cursor, "agent_sessions"):
            if column_exists(cursor, "agent_sessions", "topic_question_count"):
                print("   ✓ Column already exists.")
            else:
                cursor.execute("""
                    ALTER TABLE agent_sessions
                    ADD COLUMN topic_question_count INTEGER DEFAULT 0
                """)
                print("   ✓ Added topic_question_count column.")
        else:
            print(
                "   ⚠ Table agent_sessions does not exist. Will be created on app startup."
            )

        # 2. Add langsmith_topic_run_id to goal_progress
        print("\n2. Checking goal_progress.langsmith_topic_run_id...")
        if table_exists(cursor, "goal_progress"):
            if column_exists(cursor, "goal_progress", "langsmith_topic_run_id"):
                print("   ✓ Column already exists.")
            else:
                cursor.execute("""
                    ALTER TABLE goal_progress
                    ADD COLUMN langsmith_topic_run_id VARCHAR(36)
                """)
                print("   ✓ Added langsmith_topic_run_id column.")
        else:
            print(
                "   ⚠ Table goal_progress does not exist. Will be created on app startup."
            )

        # 3. Create scheduled_meetings table
        print("\n3. Checking scheduled_meetings table...")
        if table_exists(cursor, "scheduled_meetings"):
            print("   ✓ Table already exists.")
        else:
            cursor.execute("""
                CREATE TABLE scheduled_meetings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER NOT NULL,
                    instructor_id INTEGER,
                    submission_id INTEGER,
                    scheduled_at DATETIME,
                    calendly_event_uri VARCHAR(255),
                    status VARCHAR(20) DEFAULT 'scheduled',
                    notes TEXT,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL,
                    FOREIGN KEY (student_id) REFERENCES users (id),
                    FOREIGN KEY (instructor_id) REFERENCES users (id),
                    FOREIGN KEY (submission_id) REFERENCES submissions (id)
                )
            """)

            # Create indexes for faster lookups
            cursor.execute("""
                CREATE INDEX idx_scheduled_meetings_student
                ON scheduled_meetings (student_id)
            """)
            cursor.execute("""
                CREATE INDEX idx_scheduled_meetings_status
                ON scheduled_meetings (status)
            """)
            print("   ✓ Table created successfully.")

        conn.commit()
        print("\n✓ Migration completed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"\n✗ Migration failed: {e}")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("Code Dojo Database Migration")
    print("=" * 60)

    response = input(
        "\nThis will add LangSmith tracking and scheduled meetings support. Continue? (yes/no): "
    )
    if response.lower() != "yes":
        print("Migration cancelled.")
        sys.exit(0)

    run_migration()
    print("\n" + "=" * 60)
