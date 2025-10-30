"""
Graphiti Knowledge Graph Builder
Converts Supabase data into Graphiti episodes and builds the knowledge graph
"""
import os
from datetime import datetime
from dotenv import load_dotenv
from graphiti_core import Graphiti
from graphiti_core.llm_client.anthropic_client import AnthropicClient
from graphiti_core.llm_client.config import LLMConfig
from graphiti_core.nodes import EpisodeType

load_dotenv()

class GraphBuilder:
    def __init__(self):
        """Initialize Graphiti with Anthropic LLM"""
        # Configure LLM
        llm_config = LLMConfig(
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )

        # Initialize Anthropic LLM client
        llm_client = AnthropicClient(config=llm_config)

        # Initialize Graphiti
        self.graphiti = Graphiti(
            uri=os.getenv("NEO4J_URI"),
            user=os.getenv("NEO4J_USER"),
            password=os.getenv("NEO4J_PASSWORD"),
            llm_client=llm_client
        )

        print("[SUCCESS] Graphiti initialized and connected to Neo4j")

    async def add_task_to_graph(self, task_data):
        """
        Add a task as an episode to the knowledge graph

        Args:
            task_data: Dictionary containing task information from Supabase
        """
        # Build a rich description of the task
        episode_body = f"""
        Task: {task_data.get('title', 'Untitled Task')}
        Description: {task_data.get('description', 'No description')}
        Status: {task_data.get('status', 'unknown')}
        Priority: {task_data.get('priority', 'normal')}
        Area: {task_data.get('area', 'general')}
        Labels: {', '.join(task_data.get('labels', []))}
        """

        if task_data.get('due_date'):
            episode_body += f"\nDue Date: {task_data['due_date']}"

        if task_data.get('project_id'):
            episode_body += f"\nProject ID: {task_data['project_id']}"

        # Add to Graphiti
        result = await self.graphiti.add_episode(
            name=f"Task: {task_data.get('title', 'Untitled')}",
            episode_body=episode_body,
            source_description="TG-Dashboard Task",
            reference_time=datetime.fromisoformat(task_data.get('created_at', datetime.now().isoformat())),
            source=EpisodeType.text
        )

        return result

    async def add_project_to_graph(self, project_data):
        """Add a project to the knowledge graph"""
        episode_body = f"""
        Project: {project_data.get('name', 'Untitled Project')}
        Description: {project_data.get('description', 'No description')}
        Status: {project_data.get('status', 'active')}
        Business Project ID: {project_data.get('business_project_id', 'None')}
        Phase ID: {project_data.get('phase_id', 'None')}
        """

        result = await self.graphiti.add_episode(
            name=f"Project: {project_data.get('name', 'Untitled')}",
            episode_body=episode_body,
            source_description="TG-Dashboard Project",
            reference_time=datetime.fromisoformat(project_data.get('created_at', datetime.now().isoformat())),
            source=EpisodeType.text
        )

        return result

    async def add_content_to_graph(self, content_data):
        """Add content library item to the knowledge graph"""
        episode_body = f"""
        Content: {content_data.get('title', 'Untitled Content')}
        URL: {content_data.get('url', 'No URL')}
        Type: {content_data.get('content_type', 'unknown')}
        Summary: {content_data.get('summary', 'No summary')}
        AI Analysis: {content_data.get('ai_analysis', 'No analysis')}
        Tags: {', '.join(content_data.get('tags', []))}
        """

        result = await self.graphiti.add_episode(
            name=f"Content: {content_data.get('title', 'Untitled')}",
            episode_body=episode_body,
            source_description="TG-Dashboard Content Library",
            reference_time=datetime.fromisoformat(content_data.get('created_at', datetime.now().isoformat())),
            source=EpisodeType.text
        )

        return result

    async def search_graph(self, query: str, limit: int = 10):
        """Search the knowledge graph"""
        results = await self.graphiti.search(query, num_results=limit)
        return results

    async def close(self):
        """Close the Graphiti connection"""
        await self.graphiti.close()
        print("[INFO] Graphiti connection closed")

if __name__ == "__main__":
    import asyncio

    async def test_graph_builder():
        builder = GraphBuilder()

        # Test adding a sample task
        sample_task = {
            "title": "Test GraphBuilder Integration",
            "description": "Testing the GraphBuilder with a sample task",
            "status": "in_progress",
            "priority": "high",
            "area": "development",
            "labels": ["testing", "graphiti"],
            "created_at": datetime.now().isoformat()
        }

        print("[INFO] Adding sample task to graph...")
        result = await builder.add_task_to_graph(sample_task)
        print(f"[SUCCESS] Task added! Entities: {len(result.entities)}, Edges: {len(result.edges)}")

        await builder.close()

    asyncio.run(test_graph_builder())
