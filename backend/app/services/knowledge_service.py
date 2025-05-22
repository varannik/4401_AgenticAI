import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import UploadFile, BackgroundTasks
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import AzureOpenAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_community.vectorstores import Qdrant

from ..db.mongodb import get_database
from ..core.config import settings

# Initialize embeddings
def get_embeddings():
    return AzureOpenAIEmbeddings(
        azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
        openai_api_version=settings.AZURE_OPENAI_API_VERSION,
        azure_endpoint=settings.AZURE_OPENAI_API_BASE,
        api_key=settings.AZURE_OPENAI_API_KEY,
    )

# Initialize vector store
def get_vector_store():
    embeddings = get_embeddings()
    return Qdrant(
        client_url=settings.VECTOR_DB_URL,
        collection_name="documents",
        embedding_function=embeddings,
        api_key=settings.VECTOR_DB_API_KEY,
    )

async def save_document_metadata(
    document_id: str,
    filename: str,
    title: str,
    description: Optional[str],
    file_size: int,
    file_type: str,
    chunk_count: int,
    user_id: str,
    tags: List[str] = []
) -> str:
    """
    Save document metadata to MongoDB
    """
    db = await get_database()
    
    document = {
        "document_id": document_id,
        "filename": filename,
        "title": title,
        "description": description,
        "file_size": file_size,
        "file_type": file_type,
        "chunk_count": chunk_count,
        "tags": tags,
        "user_id": user_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    await db.documents.insert_one(document)
    return document_id

async def process_document(
    temp_file_path: str,
    file_type: str,
    document_id: str,
    title: str,
    description: Optional[str],
    file_size: int,
    user_id: str,
    tags: List[str] = []
):
    """
    Process document in the background
    """
    try:
        # Load document based on file type
        if file_type.lower() == "pdf":
            loader = PyPDFLoader(temp_file_path)
        elif file_type.lower() in ["docx", "doc"]:
            loader = Docx2txtLoader(temp_file_path)
        else:
            # Default to text loader
            loader = TextLoader(temp_file_path)
        
        documents = loader.load()
        
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100,
        )
        chunks = text_splitter.split_documents(documents)
        
        # Set metadata for each chunk
        for i, chunk in enumerate(chunks):
            chunk.metadata.update({
                "document_id": document_id,
                "chunk_id": f"{document_id}-{i}",
                "user_id": user_id,
                "title": title,
                "source": "upload",
            })
        
        # Add to vector store
        vector_store = get_vector_store()
        vector_store.add_documents(chunks)
        
        # Update metadata in MongoDB
        await save_document_metadata(
            document_id=document_id,
            filename=os.path.basename(temp_file_path),
            title=title,
            description=description,
            file_size=file_size,
            file_type=file_type,
            chunk_count=len(chunks),
            user_id=user_id,
            tags=tags
        )
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

async def upload_document(
    file: UploadFile,
    title: str,
    description: Optional[str] = None,
    tags: List[str] = [],
    user_id: str = None,
    background_tasks: BackgroundTasks = None
) -> str:
    """
    Upload a document to the system
    """
    # Generate unique ID for document
    document_id = str(uuid.uuid4())
    
    # Save file to temporary location
    file_size = 0
    temp_dir = "/tmp/ai_platform_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1].lower()
    temp_file_path = f"{temp_dir}/{document_id}{file_extension}"
    
    with open(temp_file_path, "wb") as f:
        # Read file in chunks to avoid memory issues with large files
        while content := await file.read(1024 * 1024):
            file_size += len(content)
            f.write(content)
    
    # Determine file type
    if file_extension in [".pdf"]:
        file_type = "pdf"
    elif file_extension in [".docx", ".doc"]:
        file_type = "docx"
    elif file_extension in [".txt", ".md", ".rst"]:
        file_type = "text"
    else:
        file_type = "unknown"
    
    # Process document in background
    background_tasks.add_task(
        process_document,
        temp_file_path=temp_file_path,
        file_type=file_type,
        document_id=document_id,
        title=title,
        description=description,
        file_size=file_size,
        user_id=user_id,
        tags=tags
    )
    
    return document_id

async def search_documents(
    query: str,
    filters: Dict[str, Any] = {},
    limit: int = 5,
    user_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Search documents in the vector store
    """
    vector_store = get_vector_store()
    
    # Apply filters if any
    search_kwargs = {}
    if user_id:
        search_kwargs["filter"] = {"user_id": user_id}
    
    # Search vector store
    results = vector_store.similarity_search_with_score(
        query=query,
        k=limit,
        **search_kwargs
    )
    
    # Format results
    formatted_results = []
    for doc, score in results:
        formatted_results.append({
            "content": doc.page_content,
            "metadata": doc.metadata,
            "score": float(score)
        })
    
    return formatted_results

async def get_document_by_id(document_id: str) -> Optional[Dict[str, Any]]:
    """
    Get document metadata by ID
    """
    db = await get_database()
    document = await db.documents.find_one({"document_id": document_id})
    
    if document:
        document["_id"] = str(document["_id"])
        return document
    
    return None

async def delete_document(document_id: str, user_id: str) -> bool:
    """
    Delete a document and its chunks from the system
    """
    db = await get_database()
    
    # Get document to check ownership
    document = await db.documents.find_one({
        "document_id": document_id,
        "user_id": user_id
    })
    
    if not document:
        return False
    
    # Delete from MongoDB
    await db.documents.delete_one({"document_id": document_id})
    
    # Delete from vector store
    vector_store = get_vector_store()
    vector_store.delete(filter={"document_id": document_id})
    
    return True 