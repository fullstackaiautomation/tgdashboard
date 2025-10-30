# TG-Dashboard Graphiti Backend

AI-powered knowledge graph backend for TG-Dashboard. This service syncs data from Supabase into a Graphiti knowledge graph and provides an expert AI agent that other AI agents can query for context and insights.

## Architecture

```
TG-Dashboard (React)  ──► Supabase  ◄── Python Graphiti Service
                                            │
                                            ├─► Neo4j (Knowledge Graph)
                                            │
                                            └─► Expert AI Agent (Claude)
                                                    │
                                                    ▼
                                            Other AI Agents Query Here
```

## Features

- 🔄 **Automatic Data Sync**: Syncs tasks, projects, and content from Supabase
- 🧠 **Knowledge Graph**: Builds rich relationship graphs with Graphiti
- 🤖 **Expert AI Agent**: Claude-powered agent that understands your entire system
- 🔌 **REST API**: Easy-to-use endpoints for AI agent integration
- 📊 **Insights**: AI-generated insights about productivity patterns

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

The `.env` file is already configured with your credentials:
- Supabase connection
- Anthropic API key
- Neo4j database
- OpenAI API key (for embeddings)

### 3. Start Neo4j Database

Make sure your Neo4j instance is running:
- Open Neo4j Desktop
- Start the "TG Dashboard" instance
- Create a database if you haven't already

### 4. Run Initial Sync

Sync your existing data from Supabase to the knowledge graph:

```bash
python sync/sync_service.py
```

This will:
- Connect to Supabase
- Fetch all tasks, projects, and content
- Build the knowledge graph in Neo4j
- Extract entities and relationships using AI

### 5. Start the API Server

```bash
python main.py
```

Or use uvicorn directly:

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /
```
Returns service status

### Query Knowledge Graph
```
POST /query
Body: {
  "question": "What tasks are in progress?"
}
```
Ask natural language questions about your data

### Get Task Insights
```
GET /insights/tasks
```
AI-generated insights about your tasks

### Get Project Overview
```
GET /insights/projects
```
Overview of all projects and their status

### Get Entity Relationships
```
GET /relationships/{entity_name}
```
Find all relationships for a specific entity

### Sync Data
```
POST /sync/all        # Sync everything
POST /sync/tasks      # Sync only tasks
POST /sync/projects   # Sync only projects
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Usage Examples

### For AI Agents

```python
import requests

# Query the knowledge graph
response = requests.post("http://localhost:8000/query", json={
    "question": "What high-priority tasks are related to the marketing project?"
})

result = response.json()
print(result["answer"])
print(result["confidence"])
```

### For Other Services

```bash
# Get task insights
curl http://localhost:8000/insights/tasks

# Trigger a sync
curl -X POST http://localhost:8000/sync/all

# Query relationships
curl http://localhost:8000/relationships/Project%20Alpha
```

## Project Structure

```
tg-dashboard-graphiti/
├── .env                    # Environment configuration
├── requirements.txt        # Python dependencies
├── main.py                # FastAPI application
│
├── sync/                  # Data synchronization
│   ├── supabase_client.py # Supabase connection
│   └── sync_service.py    # Sync orchestration
│
├── graphiti_models/       # Knowledge graph
│   └── graph_builder.py   # Graphiti integration
│
└── agents/                # AI agents
    └── expert_agent.py    # Expert AI agent
```

## How It Works

### 1. Data Sync
The sync service reads data from Supabase and converts it into Graphiti episodes:
- Each task, project, or content item becomes an episode
- Graphiti uses Claude to extract entities and relationships
- The knowledge graph grows with each sync

### 2. Knowledge Graph
Graphiti automatically:
- Identifies entities (tasks, projects, people, concepts)
- Discovers relationships between entities
- Builds semantic connections
- Enables intelligent querying

### 3. Expert AI Agent
The agent:
- Has access to the entire knowledge graph
- Can answer questions about your data
- Understands context and relationships
- Provides insights powered by Claude

### 4. Agent-to-Agent Communication
Other AI agents can:
- Query for specific information
- Get context about tasks and projects
- Discover relationships
- Request insights

## Maintenance

### Regular Syncs
Run periodic syncs to keep the knowledge graph up-to-date:

```bash
# Cron job example (daily at 2 AM)
0 2 * * * cd /path/to/tg-dashboard-graphiti && python sync/sync_service.py
```

### Incremental Updates
For real-time updates, you can:
1. Use Supabase webhooks
2. Call the sync endpoints when data changes
3. Implement event-driven sync

## Troubleshooting

### Neo4j Connection Issues
- Ensure Neo4j Desktop is running
- Check that the database is started
- Verify credentials in `.env`

### Supabase Connection Issues
- Verify Supabase URL and service role key
- Check network connectivity
- Ensure service role key has read permissions

### API Key Issues
- Verify all API keys in `.env` are valid
- Check API quotas and limits

## Safety Notes

✅ **Read-Only**: This service only reads from Supabase, never writes
✅ **Independent**: Your React app is completely unaffected
✅ **Reversible**: Can be stopped or removed anytime
✅ **Private**: All data stays local (Neo4j on your machine)

## Future Enhancements

- [ ] Real-time webhook integration
- [ ] Advanced pattern detection
- [ ] Predictive insights
- [ ] Multi-agent collaboration
- [ ] Graph visualization tools
- [ ] Automated reporting

## Support

For issues or questions:
1. Check the API documentation at `/docs`
2. Review logs for error messages
3. Verify all services are running (Neo4j, FastAPI)
4. Test connections individually

## License

Private project - TG Personal Dashboard
