"""
View what's currently in the Neo4j knowledge graph
"""
import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

def view_graph():
    driver = GraphDatabase.driver(
        os.getenv("NEO4J_URI"),
        auth=(os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD"))
    )

    with driver.session() as session:
        print("="*60)
        print("KNOWLEDGE GRAPH CONTENTS")
        print("="*60)

        # Count all nodes
        result = session.run("MATCH (n) RETURN count(n) as count")
        total_nodes = result.single()['count']
        print(f"\nTotal Nodes: {total_nodes}")

        # Count relationships
        result = session.run("MATCH ()-[r]->() RETURN count(r) as count")
        total_rels = result.single()['count']
        print(f"Total Relationships: {total_rels}\n")

        if total_nodes > 0:
            # Show node types
            print("Node Types:")
            result = session.run("""
                MATCH (n)
                RETURN labels(n) as labels, count(*) as count
                ORDER BY count DESC
            """)
            for record in result:
                labels = record['labels']
                count = record['count']
                print(f"  - {labels}: {count}")

            # Show some sample nodes
            print(f"\nSample Nodes (first 5):")
            result = session.run("""
                MATCH (n)
                RETURN labels(n) as labels, properties(n) as props
                LIMIT 5
            """)
            for i, record in enumerate(result, 1):
                labels = record['labels']
                props = record['props']
                print(f"\n  [{i}] {labels}")
                if 'name' in props:
                    print(f"      Name: {props['name']}")
                if 'uuid' in props:
                    print(f"      UUID: {props['uuid'][:20]}...")

        print("\n" + "="*60)

    driver.close()

if __name__ == "__main__":
    view_graph()
