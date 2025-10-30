"""
Quick sync - Sync just 5 tasks and 3 projects to test the system
"""
import asyncio
from sync.supabase_client import SupabaseClient
from graphiti_models.graph_builder import GraphBuilder

async def quick_sync():
    print("\n" + "="*60)
    print("QUICK SYNC TEST - Syncing first 5 tasks and 3 projects")
    print("="*60 + "\n")

    supabase = SupabaseClient()
    builder = GraphBuilder()

    # Get data from Supabase
    tasks = supabase.get_all_tasks()[:5]  # First 5 tasks
    projects = supabase.get_all_projects()[:3]  # First 3 projects

    print(f"[INFO] Will sync {len(tasks)} tasks and {len(projects)} projects\n")

    # Sync tasks
    print("[INFO] Syncing tasks...")
    for i, task in enumerate(tasks, 1):
        try:
            await builder.add_task_to_graph(task)
            print(f"  [{i}/{len(tasks)}] ✓ {task.get('title', 'Untitled')}")
        except Exception as e:
            print(f"  [{i}/{len(tasks)}] ✗ Error: {e}")

    # Sync projects
    print(f"\n[INFO] Syncing projects...")
    for i, project in enumerate(projects, 1):
        try:
            await builder.add_project_to_graph(project)
            print(f"  [{i}/{len(projects)}] ✓ {project.get('name', 'Untitled')}")
        except Exception as e:
            print(f"  [{i}/{len(projects)}] ✗ Error: {e}")

    await builder.close()

    print("\n" + "="*60)
    print(f"QUICK SYNC COMPLETE!")
    print("="*60)
    print("\nYour knowledge graph now has:")
    print(f"  - {len(tasks)} tasks")
    print(f"  - {len(projects)} projects")
    print("\nNext steps:")
    print("  1. Open Neo4j Browser and run: MATCH (n) RETURN n LIMIT 25")
    print("  2. Run full sync: python sync/sync_service.py")
    print("  3. Start API: python main.py")

if __name__ == "__main__":
    asyncio.run(quick_sync())
