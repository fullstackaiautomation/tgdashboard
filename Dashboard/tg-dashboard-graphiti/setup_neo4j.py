"""
Set up Neo4j database with required indexes for Graphiti
"""
import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

def setup_neo4j():
    driver = GraphDatabase.driver(
        os.getenv("NEO4J_URI"),
        auth=(os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD"))
    )

    with driver.session() as session:
        print("="*60)
        print("SETTING UP NEO4J FOR GRAPHITI")
        print("="*60 + "\n")

        # Create fulltext index for nodes
        print("[INFO] Creating fulltext index for nodes...")
        try:
            session.run("""
                CREATE FULLTEXT INDEX node_name_and_summary IF NOT EXISTS
                FOR (n:Entity)
                ON EACH [n.name, n.summary]
            """)
            print("[SUCCESS] Created node_name_and_summary index")
        except Exception as e:
            print(f"[WARN] Index may already exist: {e}")

        # Create fulltext index for edges
        print("[INFO] Creating fulltext index for edges...")
        try:
            session.run("""
                CREATE FULLTEXT INDEX edge_fact IF NOT EXISTS
                FOR ()-[r:RELATES_TO]-()
                ON EACH [r.fact]
            """)
            print("[SUCCESS] Created edge_fact index")
        except Exception as e:
            print(f"[WARN] Index may already exist: {e}")

        print("\n[INFO] Listing all indexes...")
        result = session.run("SHOW INDEXES")
        for record in result:
            print(f"  - {record['name']}: {record['type']}")

        print("\n" + "="*60)
        print("NEO4J SETUP COMPLETE!")
        print("="*60)
        print("\nYou can now run:")
        print("  python simple_test.py")

    driver.close()

if __name__ == "__main__":
    setup_neo4j()

# Run to add missing index
def add_edge_index():
    driver = GraphDatabase.driver(
        os.getenv("NEO4J_URI"),
        auth=(os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD"))
    )
    
    with driver.session() as session:
        print("[INFO] Adding missing edge index...")
        try:
            session.run("""
                CREATE FULLTEXT INDEX edge_name_and_fact IF NOT EXISTS
                FOR ()-[r:RELATED_TO]-()
                ON EACH [r.name, r.fact]
            """)
            print("[SUCCESS] Created edge_name_and_fact index")
        except Exception as e:
            print(f"[ERROR] {e}")
    
    driver.close()

if __name__ == "__main__":
    add_edge_index()
