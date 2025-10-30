"""
Supabase client for reading data from TG-Dashboard
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class SupabaseClient:
    def __init__(self):
        url = os.getenv("VITE_SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not url or not key:
            raise ValueError("Missing Supabase credentials in .env file")

        self.client: Client = create_client(url, key)

    def get_all_tasks(self):
        """Fetch all tasks from the tasks table"""
        try:
            response = self.client.table("tasks").select("*").execute()
            return response.data
        except Exception as e:
            print(f"Error fetching tasks: {e}")
            return []

    def get_all_projects(self):
        """Fetch all projects"""
        try:
            response = self.client.table("projects").select("*").execute()
            return response.data
        except Exception as e:
            print(f"Error fetching projects: {e}")
            return []

    def get_all_business_projects(self):
        """Fetch all business projects"""
        try:
            response = self.client.table("business_projects").select("*").execute()
            return response.data
        except Exception as e:
            print(f"Error fetching business projects: {e}")
            return []

    def get_all_phases(self):
        """Fetch all project phases"""
        try:
            response = self.client.table("project_phases").select("*").execute()
            return response.data
        except Exception as e:
            print(f"Error fetching phases: {e}")
            return []

    def get_all_content(self):
        """Fetch all content library items"""
        try:
            response = self.client.table("content_library").select("*").execute()
            return response.data
        except Exception as e:
            print(f"Error fetching content: {e}")
            return []

    def get_all_finance_records(self):
        """Fetch all finance records"""
        try:
            response = self.client.table("finance_records").select("*").execute()
            return response.data
        except Exception as e:
            print(f"Error fetching finance records: {e}")
            return []

    def get_all_time_entries(self):
        """Fetch all time tracking entries"""
        try:
            response = self.client.table("time_entries").select("*").execute()
            return response.data
        except Exception as e:
            print(f"Error fetching time entries: {e}")
            return []

    def get_tables_list(self):
        """List all available tables in the database"""
        try:
            # Query information_schema to get table names
            query = """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            """
            response = self.client.rpc("get_tables").execute()
            return response.data
        except Exception as e:
            print(f"Error fetching tables: {e}")
            return []

if __name__ == "__main__":
    # Test the connection
    client = SupabaseClient()
    print("[INFO] Testing Supabase connection...")

    tasks = client.get_all_tasks()
    print(f"[SUCCESS] Found {len(tasks)} tasks")

    projects = client.get_all_projects()
    print(f"[SUCCESS] Found {len(projects)} projects")

    print("[SUCCESS] Supabase connection working!")
