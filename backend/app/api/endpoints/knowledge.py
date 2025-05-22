from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel

from ...core.auth import get_current_user
from ...models.user import User
from ...services.knowledge_service import (
    upload_document, 
    search_documents, 
    get_document_by_id,
    delete_document
)

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    filters: Dict[str, Any] = {}
    limit: int = 5

class SearchResponse(BaseModel):
    results: List[Dict[str, Any]]
    metadata: Dict[str, Any] = {}

@router.post("/upload")
async def upload_document_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(None),
    tags: List[str] = Form([]),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a document to the knowledge base
    """
    document_id = await upload_document(
        file=file,
        title=title,
        description=description,
        tags=tags,
        user_id=str(current_user.id),
        background_tasks=background_tasks
    )
    
    return {
        "message": "Document uploaded successfully",
        "document_id": document_id
    }

@router.post("/search", response_model=SearchResponse)
async def search_documents_endpoint(
    request: SearchRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Search documents in the knowledge base
    """
    results = await search_documents(
        query=request.query,
        filters=request.filters,
        limit=request.limit,
        user_id=str(current_user.id)
    )
    
    return {
        "results": results,
        "metadata": {
            "total": len(results),
            "query": request.query,
        }
    }

@router.get("/{document_id}")
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get document details by ID
    """
    document = await get_document_by_id(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document

@router.delete("/{document_id}")
async def delete_document_endpoint(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a document from the knowledge base
    """
    success = await delete_document(document_id, str(current_user.id))
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": "Document deleted successfully"} 