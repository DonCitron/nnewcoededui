"""
AI API endpoints for OrdnungsHub
Provides AI-powered analysis and suggestions
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from loguru import logger

from src.backend.services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])

# Request/Response Models
class TextAnalysisRequest(BaseModel):
    text: str
    
class TextAnalysisResponse(BaseModel):
    entities: Dict[str, List[str]]
    sentiment: Dict[str, Any]
    priority: str
    category: str
    keywords: List[str]
    word_count: int
    character_count: int
    language: str

class TagSuggestionRequest(BaseModel):
    text: str
    
class TagSuggestionResponse(BaseModel):
    tags: List[str]

class FileCategorizeRequest(BaseModel):
    filename: str
    content_preview: Optional[str] = ""
    
class FileCategorizeResponse(BaseModel):
    category: str
    subcategory: str
    tags: List[str]
    priority: str

class AIStatusResponse(BaseModel):
    service: str
    status: str
    capabilities: List[str]
    models: str
    privacy: str

@router.get("/status", response_model=AIStatusResponse)
async def get_ai_status():
    """Get AI service status and capabilities"""
    try:
        status = ai_service.get_status()
        return AIStatusResponse(**status)
    except Exception as e:
        logger.error(f"Error getting AI status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get AI service status")

@router.post("/analyze-text", response_model=TextAnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    """
    Analyze text and extract insights including:
    - Named entities (emails, phones, URLs)
    - Sentiment analysis
    - Priority suggestion
    - Category suggestion
    - Keywords
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        analysis = await ai_service.analyze_text(request.text)
        
        # Handle empty analysis result
        if not analysis:
            raise HTTPException(status_code=400, detail="Text content is too short to analyze")
        
        return TextAnalysisResponse(**analysis)
    
    except HTTPException:
        # Re-raise HTTP exceptions (like 400 errors)
        raise
    except Exception as e:
        logger.error(f"Error analyzing text: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze text: {str(e)}")

@router.post("/suggest-tags", response_model=TagSuggestionResponse)
async def suggest_tags(request: TagSuggestionRequest):
    """
    Suggest relevant tags for content based on text analysis
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        tags = await ai_service.suggest_tags(request.text)
        
        return TagSuggestionResponse(tags=tags)
    
    except Exception as e:
        logger.error(f"Error suggesting tags: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to suggest tags: {str(e)}")

@router.post("/categorize-file", response_model=FileCategorizeResponse)
async def categorize_file(request: FileCategorizeRequest):
    """
    Categorize file based on filename and optional content preview
    """
    try:
        if not request.filename.strip():
            raise HTTPException(status_code=400, detail="Filename cannot be empty")
        
        result = await ai_service.categorize_file(
            request.filename, 
            request.content_preview or ""
        )
        
        return FileCategorizeResponse(**result)
    
    except Exception as e:
        logger.error(f"Error categorizing file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to categorize file: {str(e)}")

@router.post("/suggest-priority")
async def suggest_task_priority(request: TextAnalysisRequest):
    """
    Suggest task priority based on text content
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        analysis = await ai_service.analyze_text(request.text)
        
        return {
            "priority": analysis.get("priority", "medium"),
            "reasoning": f"Based on content analysis and keyword detection",
            "confidence": 0.7  # Static confidence for rule-based system
        }
    
    except Exception as e:
        logger.error(f"Error suggesting priority: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to suggest priority: {str(e)}")

@router.post("/extract-entities")
async def extract_entities(request: TextAnalysisRequest):
    """
    Extract named entities from text (emails, phones, URLs)
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        analysis = await ai_service.analyze_text(request.text)
        
        return {
            "entities": analysis.get("entities", {}),
            "count": sum(len(entities) for entities in analysis.get("entities", {}).values())
        }
    
    except Exception as e:
        logger.error(f"Error extracting entities: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to extract entities: {str(e)}")

@router.post("/analyze-sentiment")
async def analyze_sentiment(request: TextAnalysisRequest):
    """
    Analyze sentiment of text content
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        analysis = await ai_service.analyze_text(request.text)
        sentiment = analysis.get("sentiment", {})
        
        return {
            "sentiment": sentiment.get("label", "neutral"),
            "score": sentiment.get("score", 0.0),
            "confidence": abs(sentiment.get("score", 0.0))
        }
    
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze sentiment: {str(e)}")