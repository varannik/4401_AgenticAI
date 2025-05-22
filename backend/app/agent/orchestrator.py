import time
from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from langchain_openai import AzureChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import StrOutputParser

from ..core.config import settings

AGENT_TEMPLATES = [
    {
        "id": "default",
        "name": "Default Agent",
        "description": "General-purpose agent for answering questions",
    },
    {
        "id": "knowledge",
        "name": "Knowledge Agent",
        "description": "Agent specialized in retrieving information from the knowledge base",
    },
    {
        "id": "sql",
        "name": "SQL Agent",
        "description": "Agent specialized in generating and executing SQL queries",
    }
]

def get_llm(temperature=0):
    """Get Azure OpenAI LLM instance"""
    return AzureChatOpenAI(
        azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
        openai_api_version=settings.AZURE_OPENAI_API_VERSION,
        azure_endpoint=settings.AZURE_OPENAI_API_BASE,
        api_key=settings.AZURE_OPENAI_API_KEY,
        temperature=temperature,
    )

def create_default_agent():
    """Create a simple agent that just calls the LLM"""
    
    prompt = ChatPromptTemplate.from_template(
        "You are a helpful assistant. Answer the following question: {question}"
    )
    
    model = get_llm()
    return prompt | model | StrOutputParser()

async def run_agent(user_id: str, prompt: str, agent_type: str = "default", parameters: Dict[str, Any] = {}):
    """
    Run an agent with the given prompt and parameters
    """
    start_time = time.time()
    
    # Logic to dispatch to specific agent type
    if agent_type == "default":
        agent = create_default_agent()
        answer = await agent.ainvoke({"question": prompt})
    else:
        # For now, fallback to default agent
        agent = create_default_agent()
        answer = await agent.ainvoke({"question": prompt})
    
    # Prepare response
    processing_time = time.time() - start_time
    return {
        "answer": answer,
        "sources": [],  # No sources for default agent
        "processing_time": processing_time,
        "model": "azure-gpt4",
    }

async def list_agent_templates():
    """
    List available agent templates
    """
    return AGENT_TEMPLATES 