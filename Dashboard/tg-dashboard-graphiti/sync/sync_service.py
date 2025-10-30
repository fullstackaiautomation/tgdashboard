"""
Data Sync Service
Syncs data from Supabase to Graphiti knowledge graph
"""
import asyncio
from sync.supabase_client import SupabaseClient
from graphiti_models.graph_builder import GraphBuilder

class SyncService:
    def __init__(self):
        self.supabase = SupabaseClient()
        self.graph_builder = None

    async def initialize(self):
        """Initialize async components"""
        self.graph_builder = GraphBuilder()

    async def sync_all_tasks(self):
        """Sync all tasks from Supabase to Graphiti"""
        print("[INFO] Syncing tasks...")
        tasks = self.supabase.get_all_tasks()

        if not tasks:
            print("[WARN] No tasks found in Supabase")
            return 0

        synced_count = 0
        for task in tasks:
            try:
                await self.graph_builder.add_task_to_graph(task)
                synced_count += 1
                print(f"[SUCCESS] Synced task: {task.get('title', 'Untitled')}")
            except Exception as e:
                print(f"[ERROR] Failed to sync task {task.get('id')}: {e}")

        print(f"[SUCCESS] Synced {synced_count}/{len(tasks)} tasks")
        return synced_count

    async def sync_all_projects(self):
        """Sync all projects from Supabase to Graphiti"""
        print("[INFO] Syncing projects...")
        projects = self.supabase.get_all_projects()

        if not projects:
            print("[WARN] No projects found in Supabase")
            return 0

        synced_count = 0
        for project in projects:
            try:
                await self.graph_builder.add_project_to_graph(project)
                synced_count += 1
                print(f"[SUCCESS] Synced project: {project.get('name', 'Untitled')}")
            except Exception as e:
                print(f"[ERROR] Failed to sync project {project.get('id')}: {e}")

        print(f"[SUCCESS] Synced {synced_count}/{len(projects)} projects")
        return synced_count

    async def sync_all_content(self):
        """Sync all content library items from Supabase to Graphiti"""
        print("[INFO] Syncing content library...")
        content_items = self.supabase.get_all_content()

        if not content_items:
            print("[WARN] No content items found in Supabase")
            return 0

        synced_count = 0
        for content in content_items:
            try:
                await self.graph_builder.add_content_to_graph(content)
                synced_count += 1
                print(f"[SUCCESS] Synced content: {content.get('title', 'Untitled')}")
            except Exception as e:
                print(f"[ERROR] Failed to sync content {content.get('id')}: {e}")

        print(f"[SUCCESS] Synced {synced_count}/{len(content_items)} content items")
        return synced_count

    async def sync_all(self):
        """Sync all data from Supabase to Graphiti"""
        print("\n" + "="*60)
        print("STARTING FULL SYNC: Supabase → Graphiti")
        print("="*60 + "\n")

        await self.initialize()

        total_synced = 0

        # Sync all entity types
        total_synced += await self.sync_all_tasks()
        total_synced += await self.sync_all_projects()
        total_synced += await self.sync_all_content()

        print("\n" + "="*60)
        print(f"SYNC COMPLETE: {total_synced} total items synced")
        print("="*60 + "\n")

        await self.close()

    async def close(self):
        """Close connections"""
        if self.graph_builder:
            await self.graph_builder.close()

async def main():
    """Run a full sync"""
    sync_service = SyncService()
    await sync_service.sync_all()

if __name__ == "__main__":
    asyncio.run(main())
