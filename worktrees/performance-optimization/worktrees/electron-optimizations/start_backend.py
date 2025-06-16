#!/usr/bin/env python3
"""
Simple startup script for OrdnungsHub backend
"""
import sys
import os
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Start the backend
if __name__ == "__main__":
    from src.backend.main import app
    import uvicorn
    
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        reload=False,
        log_level="info"
    )