"""
Workspace API endpoints for OrdnungsHub
Provides workspace management and AI-powered organization
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from loguru import logger

from src.backend.database.database import get_db
from src.backend.models.workspace import Workspace, WorkspaceTheme
from src.backend.schemas.workspace import (
    WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse,
    WorkspaceStateUpdate, WorkspaceThemeCreate
)
from src.backend.crud.crud_workspace import workspace as crud_workspace
from src.backend.services.ai_service import ai_service

router = APIRouter(prefix="/workspaces", tags=["workspaces"])

@router.get("/", response_model=List[WorkspaceResponse])
async def get_workspaces(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get all workspaces for a user"""
    try:
        workspaces = crud_workspace.get_multi_by_user(
            db, user_id=user_id or 1, skip=skip, limit=limit  # Default to user 1 for now
        )
        return workspaces
    except Exception as e:
        logger.error(f"Error fetching workspaces: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch workspaces")

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(workspace_id: int, db: Session = Depends(get_db)):
    """Get a specific workspace by ID"""
    try:
        workspace = crud_workspace.get(db, id=workspace_id)
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        return workspace
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching workspace {workspace_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch workspace")

@router.post("/", response_model=WorkspaceResponse)
async def create_workspace(
    workspace: WorkspaceCreate,
    db: Session = Depends(get_db)
):
    """Create a new workspace"""
    try:
        # Use AI to suggest initial settings if description provided
        ai_suggestions = {}
        if workspace.description:
            analysis = await ai_service.analyze_text(workspace.description)
            ai_suggestions = {
                "suggested_category": analysis.get("category", "general"),
                "suggested_tags": await ai_service.suggest_tags(workspace.description)
            }
        
        # Create workspace with AI suggestions
        workspace_data = workspace.model_dump()
        if (not workspace_data.get("theme") or workspace_data.get("theme") == "default") and ai_suggestions.get("suggested_category"):
            # Map AI category to theme
            category_theme_map = {
                "work": "professional",
                "personal": "minimal",
                "finance": "dark",
                "education": "light"
            }
            workspace_data["theme"] = category_theme_map.get(
                ai_suggestions["suggested_category"], "default"
            )
        
        db_workspace = crud_workspace.create(db, obj_in=WorkspaceCreate(**workspace_data))
        
        # Log AI suggestions for user feedback
        if ai_suggestions:
            logger.info(f"AI suggestions for workspace {db_workspace.id}: {ai_suggestions}")
        
        return db_workspace
    except Exception as e:
        logger.error(f"Error creating workspace: {e}")
        raise HTTPException(status_code=500, detail="Failed to create workspace")

@router.put("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: int,
    workspace_update: WorkspaceUpdate,
    db: Session = Depends(get_db)
):
    """Update a workspace"""
    try:
        workspace = crud_workspace.get(db, id=workspace_id)
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        updated_workspace = crud_workspace.update(
            db, db_obj=workspace, obj_in=workspace_update
        )
        return updated_workspace
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating workspace {workspace_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update workspace")

@router.delete("/{workspace_id}")
async def delete_workspace(workspace_id: int, db: Session = Depends(get_db)):
    """Delete a workspace"""
    try:
        workspace = crud_workspace.get(db, id=workspace_id)
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        crud_workspace.remove(db, id=workspace_id)
        return {"message": "Workspace deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting workspace {workspace_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete workspace")

@router.post("/{workspace_id}/switch")
async def switch_workspace(
    workspace_id: int,
    db: Session = Depends(get_db)
):
    """Switch to a specific workspace"""
    try:
        workspace = crud_workspace.get(db, id=workspace_id)
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        # Mark workspace as active (set last_accessed)
        crud_workspace.mark_as_accessed(db, workspace_id=workspace_id)
        
        # Return workspace state for UI restoration
        return {
            "workspace": workspace,
            "state": workspace.layout_config or {},
            "message": f"Switched to workspace: {workspace.name}"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error switching to workspace {workspace_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to switch workspace")

@router.put("/{workspace_id}/state")
async def update_workspace_state(
    workspace_id: int,
    state_update: WorkspaceStateUpdate,
    db: Session = Depends(get_db)
):
    """Update workspace state (for state preservation)"""
    try:
        workspace = crud_workspace.get(db, id=workspace_id)
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        # Update workspace state
        updated_workspace = crud_workspace.update_state(
            db, workspace_id=workspace_id, state=state_update.state
        )
        
        return {
            "workspace_id": workspace_id,
            "state": updated_workspace.layout_config,
            "message": "Workspace state updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating workspace state {workspace_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update workspace state")

@router.get("/{workspace_id}/state")
async def get_workspace_state(workspace_id: int, db: Session = Depends(get_db)):
    """Get workspace state for restoration"""
    try:
        workspace = crud_workspace.get(db, id=workspace_id)
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        return {
            "workspace_id": workspace_id,
            "state": workspace.layout_config or {},
            "last_accessed_at": workspace.last_accessed_at
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching workspace state {workspace_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch workspace state")

@router.post("/{workspace_id}/assign-content")
async def assign_content_to_workspace(
    workspace_id: int,
    content: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Use AI to suggest content assignment to workspace"""
    try:
        workspace = crud_workspace.get(db, id=workspace_id)
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        # Analyze content with AI
        content_text = content.get("text", "") or content.get("description", "")
        if not content_text:
            raise HTTPException(status_code=400, detail="Content text is required for analysis")
        
        analysis = await ai_service.analyze_text(content_text)
        
        # Determine if content fits this workspace
        workspace_category = workspace.description or workspace.name
        workspace_analysis = await ai_service.analyze_text(workspace_category)
        
        content_category = analysis.get("category", "general")
        workspace_cat = workspace_analysis.get("category", "general")
        
        # Calculate compatibility score
        compatibility = 0.5  # Base compatibility
        if content_category == workspace_cat:
            compatibility = 0.9
        elif content_category in ["general"] or workspace_cat in ["general"]:
            compatibility = 0.7
        
        # Check priority match
        content_priority = analysis.get("priority", "medium")
        if "urgent" in workspace.name.lower() and content_priority == "urgent":
            compatibility += 0.1
        
        return {
            "workspace_id": workspace_id,
            "workspace_name": workspace.name,
            "content_analysis": analysis,
            "compatibility_score": min(compatibility, 1.0),
            "recommendation": "assign" if compatibility > 0.7 else "consider",
            "reasoning": f"Content category '{content_category}' matches workspace focus '{workspace_cat}'"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing content for workspace {workspace_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze content assignment")

@router.get("/{workspace_id}/suggestions")
async def get_workspace_suggestions(workspace_id: int, db: Session = Depends(get_db)):
    """Get AI suggestions for workspace optimization"""
    try:
        workspace = crud_workspace.get(db, id=workspace_id)
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        # Analyze workspace usage and provide suggestions
        suggestions = []
        
        # Theme suggestions based on name/description
        if workspace.description:
            analysis = await ai_service.analyze_text(workspace.description)
            category = analysis.get("category", "general")
            
            theme_suggestions = {
                "work": ["professional", "dark", "minimal"],
                "personal": ["light", "colorful", "minimal"],
                "finance": ["dark", "professional"],
                "education": ["light", "colorful"]
            }
            
            if category in theme_suggestions:
                suggestions.append({
                    "type": "theme",
                    "suggestion": theme_suggestions[category][0],
                    "reason": f"Based on {category} category detection"
                })
        
        # Layout suggestions based on workspace size/usage
        suggestions.append({
            "type": "layout",
            "suggestion": "Add quick actions widget",
            "reason": "Improve workflow efficiency"
        })
        
        return {
            "workspace_id": workspace_id,
            "suggestions": suggestions,
            "generated_at": "now"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating suggestions for workspace {workspace_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate workspace suggestions")

@router.post("/create-from-template")
async def create_workspace_from_template(
    template_name: str,
    workspace_name: str,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Create workspace from predefined template"""
    try:
        templates = {
            "work": {
                "theme": "professional",
                "description": "Professional workspace for work tasks and projects",
                "default_widgets": ["calendar", "tasks", "notes", "quick_actions"],
                "color_scheme": "blue"
            },
            "personal": {
                "theme": "minimal",
                "description": "Personal workspace for daily life organization",
                "default_widgets": ["calendar", "notes", "weather", "quick_actions"],
                "color_scheme": "green"
            },
            "study": {
                "theme": "light",
                "description": "Study workspace for learning and education",
                "default_widgets": ["notes", "timer", "calendar", "files"],
                "color_scheme": "purple"
            },
            "creative": {
                "theme": "colorful",
                "description": "Creative workspace for projects and inspiration",
                "default_widgets": ["files", "notes", "gallery", "music"],
                "color_scheme": "orange"
            }
        }
        
        if template_name not in templates:
            raise HTTPException(status_code=400, detail=f"Template '{template_name}' not found")
        
        template = templates[template_name]
        
        # Create workspace with template settings
        workspace_data = WorkspaceCreate(
            name=workspace_name,
            description=template["description"],
            theme=template["theme"],
            user_id=user_id or 1,
            layout_config={
                "widgets": template["default_widgets"],
                "color_scheme": template["color_scheme"],
                "created_from_template": template_name
            }
        )
        
        workspace = crud_workspace.create(db, obj_in=workspace_data)
        
        return {
            "workspace": workspace,
            "template_used": template_name,
            "message": f"Workspace '{workspace_name}' created from {template_name} template"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating workspace from template: {e}")
        raise HTTPException(status_code=500, detail="Failed to create workspace from template")