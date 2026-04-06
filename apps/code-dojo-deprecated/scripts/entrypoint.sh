#!/bin/bash
set -e

echo "=== Code Dojo - Starting ==="

# Step 1: Initialize and seed database
echo "Initializing database..."
python3 seed_data.py --smart || {
  echo "Warning: Database seeding failed (may already exist)"
}

# Step 2: Start the Flask application
echo "Starting Flask application..."
exec python3 app.py
