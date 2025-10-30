"""
Simplest possible test - add one task and verify
"""
import asyncio
import os
from datetime import datetime
from dotenv import load_dotenv
from graphiti_core import Graphiti
from graphiti_core.llm_client.anthropic_client import AnthropicClient
from graphiti_core.llm_client.config import LLMConfig
from graphiti_core.nodes import EpisodeType

load_dotenv()

async def simple_test():
    print("="*60)
    print("SIMPLE TEST - Add One Task")
    print("="*60 + "\n")

    # Initialize
    llm_config = LLMConfig(api_key=os.getenv("ANTHROPIC_API_KEY"))
    llm_client = AnthropicClient(config=llm_config)

    graphiti = Graphiti(
        uri=os.getenv("NEO4J_URI"),
        user=os.getenv("NEO4J_USER"),
        password=os.getenv("NEO4J_PASSWORD"),
        llm_client=llm_client
    )

    print("[INFO] Connected to Graphiti")

    # Add a simple task
    episode_body = """
    Task: Build TG-Dashboard Graphiti Integration
    Description: Create a knowledge graph backend for TG-Dashboard
    Status: in_progress
    Priority: high
    """

    print("[INFO] Adding task to knowledge graph...")
    print("[INFO] This will use Claude to extract entities and relationships...")
    print("[INFO] This may take 30-60 seconds...\n")

    try:
        result = await graphiti.add_episode(
            name="Task: Build Graphiti Integration",
            episode_body=episode_body,
            source_description="TG-Dashboard Test",
            reference_time=datetime.now(),
            source=EpisodeType.text
        )

        print("[SUCCESS] Task added to knowledge graph!")
        print(f"\nExtracted {len(result.entities)} entities:")
        for entity in result.entities[:10]:
            print(f"  - {entity.name}")

        print(f"\nCreated {len(result.edges)} relationships:")
        for edge in result.edges[:10]:
            print(f"  - {edge.fact}")

    except Exception as e:
        print(f"[ERROR] Failed: {e}")

    await graphiti.close()

    print("\n" + "="*60)
    print("Test complete! Check Neo4j Browser:")
    print("  MATCH (n) RETURN n LIMIT 25")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(simple_test())
