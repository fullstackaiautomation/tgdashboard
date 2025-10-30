"""
Start a sync - handles encoding issues on Windows
Syncs first 10 tasks and 5 projects as a test
"""
import asyncio
import sys
from sync.supabase_client import SupabaseClient
from graphiti_models.graph_builder import GraphBuilder

# Force UTF-8 output
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

async def sync_sample():
    print("="*60)
    print("STARTING SYNC - First 10 tasks and 5 projects")
    print("="*60)
    print()

    supabase = SupabaseClient()
    builder = GraphBuilder()

    # Get sample data
    tasks = supabase.get_all_tasks()[:10]
    projects = supabase.get_all_projects()[:5]

    print(f"[INFO] Will sync {len(tasks)} tasks and {len(projects)} projects")
    print(f"[INFO] This may take 5-10 minutes...")
    print()

    # Sync tasks
    print("[INFO] Syncing tasks...")
    synced = 0
    for i, task in enumerate(tasks, 1):
        try:
            await builder.add_task_to_graph(task)
            synced += 1
            title = task.get('title', 'Untitled')[:50]
            print(f"  [{i}/{len(tasks)}] Synced: {title}")
        except Exception as e:
            print(f"  [{i}/{len(tasks)}] Error: {str(e)[:100]}")

    print()
    print(f"[SUCCESS] Synced {synced}/{len(tasks)} tasks")
    print()

    # Sync projects
    print("[INFO] Syncing projects...")
    synced = 0
    for i, project in enumerate(projects, 1):
        try:
            await builder.add_project_to_graph(project)
            synced += 1
            name = project.get('name', 'Untitled')[:50]
            print(f"  [{i}/{len(projects)}] Synced: {name}")
        except Exception as e:
            print(f"  [{i}/{len(projects)}] Error: {str(e)[:100]}")

    print()
    print(f"[SUCCESS] Synced {synced}/{len(projects)} projects")

    await builder.close()

    print()
    print("="*60)
    print("SYNC COMPLETE!")
    print("="*60)
    print()
    print("View your knowledge graph:")
    print("  python view_neo4j.py")
    print()
    print("Or open Neo4j Browser and run:")
    print("  MATCH (n) RETURN n LIMIT 50")

if __name__ == "__main__":
    asyncio.run(sync_sample())
