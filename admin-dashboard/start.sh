#!/bin/bash
# A simple script to start a quick web server on port 8000
echo "Starting Canteen Admin Dashboard on http://localhost:8000"
echo "Press Ctrl+C to stop"
python3 -m http.server 8000
