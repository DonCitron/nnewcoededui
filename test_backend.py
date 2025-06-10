#!/usr/bin/env python3
"""
Simple backend test script - demonstrates all major features
"""

import sys
import json
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

try:
    from src.backend.main import app
    from src.backend.database.database import get_db
    from src.backend.services.taskmaster_integration import TaskmasterService
    from src.backend.services.ai_service import ai_service
    from fastapi.testclient import TestClient
    
    print("🚀 OrdnungsHub Backend Test")
    print("=" * 50)
    
    # Test 1: App Import
    print("✅ FastAPI app imported successfully")
    
    # Test 2: Database Connection
    try:
        db = next(get_db())
        print("✅ Database connection works")
        db.close()
    except Exception as e:
        print(f"❌ Database error: {e}")
    
    # Test 3: Test Client
    client = TestClient(app)
    print("✅ Test client created")
    
    # Test 4: Health Check
    try:
        response = client.get("/api/dashboard/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")
    
    # Test 5: Dashboard Stats
    try:
        response = client.get("/api/dashboard/stats")
        if response.status_code == 200:
            print("✅ Dashboard stats working")
            stats = response.json()
            print(f"   Total tasks: {stats['stats']['total_tasks']}")
            print(f"   Active workspaces: {stats['stats']['active_workspaces']}")
        else:
            print(f"❌ Dashboard stats failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Dashboard stats error: {e}")
    
    # Test 6: Workspace Templates
    try:
        response = client.get("/workspaces/templates")
        if response.status_code == 200:
            print("✅ Workspace templates working")
            templates = response.json()
            print(f"   Available templates: {len(templates['templates'])}")
        else:
            print(f"❌ Workspace templates failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Workspace templates error: {e}")
    
    # Test 7: AI Text Analysis
    try:
        response = client.post("/ai/analyze-text", json={
            "text": "This is a test document about financial planning and budget analysis."
        })
        if response.status_code == 200:
            print("✅ AI text analysis working")
            analysis = response.json()
            print(f"   Category: {analysis.get('category', 'unknown')}")
            print(f"   Sentiment: {analysis.get('sentiment', 'unknown')}")
        else:
            print(f"❌ AI analysis failed: {response.status_code}")
    except Exception as e:
        print(f"❌ AI analysis error: {e}")
    
    # Test 8: Taskmaster Integration
    try:
        response = client.get("/tasks/taskmaster/progress")
        if response.status_code == 200:
            print("✅ Taskmaster integration working")
            progress = response.json()
            print(f"   Progress data available")
        else:
            print(f"❌ Taskmaster failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Taskmaster error: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 All major components tested!")
    print("📚 View full demo: open demo_offline.html in your browser")
    print("🌐 Start server: python -m uvicorn src.backend.main:app --reload")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're in the project directory and virtual environment is activated")
except Exception as e:
    print(f"❌ Unexpected error: {e}")