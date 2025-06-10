import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.backend.main import app
from src.backend.database.database import Base, get_db
from src.backend.models.task import Task, TaskStatus, TaskPriority
from src.backend.models.workspace import Workspace
from src.backend.models.user import User

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture
def test_db():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def sample_user(test_db):
    """Create a sample user for testing."""
    user = User(
        username="testuser",
        email="test@example.com"
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user

@pytest.fixture
def sample_workspace(test_db, sample_user):
    """Create a sample workspace for testing."""
    workspace = Workspace(
        user_id=sample_user.id,
        name="Test Workspace",
        description="A test workspace",
        theme="default",
        is_active=True
    )
    test_db.add(workspace)
    test_db.commit()
    test_db.refresh(workspace)
    return workspace

@pytest.fixture
def sample_tasks(test_db, sample_user, sample_workspace):
    """Create sample tasks for testing."""
    tasks = [
        Task(
            user_id=sample_user.id,
            workspace_id=sample_workspace.id,
            title="Completed Task 1",
            description="A completed task",
            status=TaskStatus.COMPLETED,
            priority=TaskPriority.MEDIUM
        ),
        Task(
            user_id=sample_user.id,
            workspace_id=sample_workspace.id,
            title="Pending Task 1",
            description="A pending task",
            status=TaskStatus.PENDING,
            priority=TaskPriority.HIGH
        ),
        Task(
            user_id=sample_user.id,
            workspace_id=sample_workspace.id,
            title="In Progress Task 1",
            description="A task in progress",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.LOW
        )
    ]
    
    for task in tasks:
        test_db.add(task)
    test_db.commit()
    
    for task in tasks:
        test_db.refresh(task)
    
    return tasks

class TestDashboardAPI:
    """Test cases for Dashboard API endpoints."""
    
    def test_dashboard_stats_empty_database(self, test_db):
        """Test dashboard stats with empty database."""
        response = client.get("/api/dashboard/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["message"] == "Dashboard statistics retrieved successfully"
        assert data["stats"]["total_tasks"] == 0
        assert data["stats"]["completed_tasks"] == 0
        assert data["stats"]["active_workspaces"] == 0
        assert data["stats"]["total_files"] == 0
        assert data["stats"]["completion_percentage"] == 0
    
    def test_dashboard_stats_with_data(self, test_db, sample_tasks):
        """Test dashboard stats with sample data."""
        response = client.get("/api/dashboard/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["stats"]["total_tasks"] == 3
        assert data["stats"]["completed_tasks"] == 1
        assert data["stats"]["active_workspaces"] == 1
        assert data["stats"]["completion_percentage"] == 33  # 1/3 = 33%
    
    def test_dashboard_health_check(self, test_db):
        """Test dashboard health check endpoint."""
        response = client.get("/api/dashboard/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "healthy"
        assert data["service"] == "dashboard"
        assert data["database"] == "connected"
        assert data["message"] == "Dashboard service is operational"
    
    def test_recent_activity_empty(self, test_db):
        """Test recent activity with no data."""
        response = client.get("/api/dashboard/recent-activity")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["count"] == 0
        assert data["activities"] == []
    
    def test_recent_activity_structure(self, test_db):
        """Test recent activity endpoint structure (without sample data)."""
        response = client.get("/api/dashboard/recent-activity")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert isinstance(data["activities"], list)
        assert isinstance(data["count"], int)
    
    def test_recent_activity_with_limit(self, test_db):
        """Test recent activity with custom limit."""
        response = client.get("/api/dashboard/recent-activity?limit=2")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert isinstance(data["activities"], list)
        assert isinstance(data["count"], int)

class TestDashboardErrorHandling:
    """Test error handling in Dashboard API."""
    
    def test_stats_endpoint_response_structure(self, test_db):
        """Test that stats endpoint returns correct structure."""
        response = client.get("/api/dashboard/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        required_fields = ["success", "stats", "message"]
        for field in required_fields:
            assert field in data
        
        # Check stats structure
        stats_fields = ["total_tasks", "completed_tasks", "active_workspaces", "total_files", "completion_percentage"]
        for field in stats_fields:
            assert field in data["stats"]
            assert isinstance(data["stats"][field], int)
    
    def test_health_check_response_structure(self, test_db):
        """Test that health check returns correct structure."""
        response = client.get("/api/dashboard/health")
        
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["status", "service", "database", "message"]
        for field in required_fields:
            assert field in data

if __name__ == "__main__":
    pytest.main([__file__, "-v"])