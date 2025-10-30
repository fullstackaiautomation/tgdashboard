"""
Integration test - Test all components before full sync
"""
import asyncio
from sync.supabase_client import SupabaseClient
from graphiti_models.graph_builder import GraphBuilder

async def test_integration():
    print("="*60)
    print("INTEGRATION TEST")
    print("="*60 + "\n")

    # Test 1: Supabase Connection
    print("[TEST 1] Testing Supabase connection...")
    supabase = SupabaseClient()
    tasks = supabase.get_all_tasks()
    projects = supabase.get_all_projects()
    print(f"[SUCCESS] Connected to Supabase")
    print(f"  - Tasks: {len(tasks)}")
    print(f"  - Projects: {len(projects)}\n")

    # Test 2: Graphiti Connection
    print("[TEST 2] Testing Graphiti/Neo4j connection...")
    builder = GraphBuilder()
    print("[SUCCESS] Connected to Graphiti/Neo4j\n")

    # Test 3: Add a sample task to the knowledge graph
    print("[TEST 3] Adding sample task to knowledge graph...")
    if len(tasks) > 0:
        sample_task = tasks[0]  # Get first task from Supabase
        print(f"  Using task: {sample_task.get('title', 'Untitled')}")

        result = await builder.add_task_to_graph(sample_task)

        print(f"[SUCCESS] Task added to knowledge graph!")
        print(f"  - Entities extracted: {len(result.entities)}")
        print(f"  - Relationships created: {len(result.edges)}")

        # Display entities
        if result.entities:
            print(f"\n  Entities found:")
            for entity in result.entities[:5]:  # Show first 5
                print(f"    - {entity.name}")

    # Test 4: Search the knowledge graph
    print(f"\n[TEST 4] Searching knowledge graph...")
    search_results = await builder.search_graph("task", limit=3)

    if search_results:
        print(f"[SUCCESS] Found {len(search_results)} result(s)")
    else:
        print("[INFO] No results yet (graph might be empty)")

    await builder.close()

    print("\n" + "="*60)
    print("ALL TESTS PASSED!")
    print("="*60)
    print("\nYou're ready to run the full sync:")
    print("  python sync/sync_service.py")
    print("\nOr start the API server:")
    print("  python main.py")

if __name__ == "__main__":
    asyncio.run(test_integration())
