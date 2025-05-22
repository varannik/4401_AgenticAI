from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ...core.auth import get_current_user
from ...models.user import User
from ...agent.orchestrator import run_agent, list_agent_templates

router = APIRouter()

class AgentRequest(BaseModel):
    prompt: str
    agent_type: str = "default"
    parameters: Dict[str, Any] = {}

class AgentResponse(BaseModel):
    result: str
    metadata: Dict[str, Any] = {}

@router.post("/run", response_model=AgentResponse)
async def run_agent_endpoint(
    request: AgentRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Run an agent with the given prompt and parameters
    """
    result = await run_agent(
        user_id=str(current_user.id),
        prompt=request.prompt,
        agent_type=request.agent_type,
        parameters=request.parameters
    )
    
    return {
        "result": result.get("answer", ""),
        "metadata": {
            "sources": result.get("sources", []),
            "processing_time": result.get("processing_time", 0),
            "model": result.get("model", "unknown"),
        }
    }

@router.get("/templates", response_model=List[Dict[str, Any]])
async def get_agent_templates(
    current_user: User = Depends(get_current_user)
):
    """
    List available agent templates
    """
    templates = await list_agent_templates()
    return templates 