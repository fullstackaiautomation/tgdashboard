"""
TG-Dashboard Graphiti Backend
FastAPI service for AI agents to query the knowledge graph
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sync.sync_service import SyncService
from agents.expert_agent import ExpertAgent

app = FastAPI(
    title="TG-Dashboard Graphiti API",
    description="Knowledge graph API for TG-Dashboard AI agents",
    version="1.0.0"
)

# Initialize services (will be done on startup)
expert_agent = None

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    answer: str
    results: list
    confidence: str

@app.on_event("startup")
async def startup_event():
    """Initialize the expert agent on startup"""
    global expert_agent
    expert_agent = ExpertAgent()
    await expert_agent.initialize()
    print("[SUCCESS] TG-Dashboard Graphiti API is ready!")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown"""
    if expert_agent:
        await expert_agent.close()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "TG-Dashboard Graphiti API",
        "status": "running",
        "version": "1.0.0"
    }

@app.post("/query", response_model=QueryResponse)
async def query_knowledge_graph(request: QueryRequest):
    """
    Query the knowledge graph with a natural language question

    This endpoint allows AI agents to ask questions about tasks, projects,
    content, and their relationships.
    """
    if not expert_agent:
        raise HTTPException(status_code=503, detail="Expert agent not initialized")

    try:
        result = await expert_agent.query(request.question)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

@app.get("/insights/tasks")
async def get_task_insights():
    """Get AI-powered insights about tasks"""
    if not expert_agent:
        raise HTTPException(status_code=503, detail="Expert agent not initialized")

    try:
        result = await expert_agent.get_task_insights()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get insights: {str(e)}")

@app.get("/insights/projects")
async def get_project_overview():
    """Get overview of all projects"""
    if not expert_agent:
        raise HTTPException(status_code=503, detail="Expert agent not initialized")

    try:
        result = await expert_agent.get_project_overview()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get overview: {str(e)}")

@app.get("/relationships/{entity_name}")
async def get_entity_relationships(entity_name: str):
    """Get all relationships for a specific entity"""
    if not expert_agent:
        raise HTTPException(status_code=503, detail="Expert agent not initialized")

    try:
        result = await expert_agent.get_relationships(entity_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get relationships: {str(e)}")

@app.post("/sync/all")
async def sync_all_data():
    """
    Trigger a full sync from Supabase to Graphiti

    This endpoint syncs all tasks, projects, and content from Supabase
    into the knowledge graph.
    """
    try:
        sync_service = SyncService()
        await sync_service.sync_all()
        return {
            "status": "success",
            "message": "Full sync completed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

@app.post("/sync/tasks")
async def sync_tasks():
    """Sync only tasks from Supabase"""
    try:
        sync_service = SyncService()
        await sync_service.initialize()
        count = await sync_service.sync_all_tasks()
        await sync_service.close()
        return {
            "status": "success",
            "synced_count": count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task sync failed: {str(e)}")

@app.post("/sync/projects")
async def sync_projects():
    """Sync only projects from Supabase"""
    try:
        sync_service = SyncService()
        await sync_service.initialize()
        count = await sync_service.sync_all_projects()
        await sync_service.close()
        return {
            "status": "success",
            "synced_count": count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Project sync failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
