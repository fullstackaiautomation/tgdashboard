"""
View relationships in a readable format
"""
import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

def view_relationships():
    driver = GraphDatabase.driver(
        os.getenv("NEO4J_URI"),
        auth=(os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD"))
    )

    with driver.session() as session:
        print("="*80)
        print("KNOWLEDGE GRAPH RELATIONSHIPS")
        print("="*80)
        print()

        # Get all relationships with their nodes
        result = session.run("""
            MATCH (a)-[r]->(b)
            RETURN
                labels(a)[0] as source_type,
                a.name as source_name,
                type(r) as relationship,
                r.fact as fact,
                labels(b)[0] as target_type,
                b.name as target_name
            LIMIT 50
        """)

        count = 0
        for record in result:
            count += 1
            source_type = record['source_type']
            source_name = record['source_name'] or 'Unknown'
            relationship = record['relationship']
            fact = record['fact'] or ''
            target_type = record['target_type']
            target_name = record['target_name'] or 'Unknown'

            print(f"[{count}] {source_type}: {source_name[:50]}")
            print(f"    --[{relationship}]-->")
            print(f"    {target_type}: {target_name[:50]}")
            if fact:
                print(f"    Fact: {fact}")
            print()

        print("="*80)
        print(f"Total Relationships Shown: {count}")
        print("="*80)
        print()

        # Show relationship types
        print("RELATIONSHIP TYPES:")
        result = session.run("""
            MATCH ()-[r]->()
            RETURN type(r) as type, count(*) as count
            ORDER BY count DESC
        """)
        for record in result:
            print(f"  - {record['type']}: {record['count']}")

        print()

        # Show entity types
        print("ENTITY TYPES:")
        result = session.run("""
            MATCH (n:Entity)
            RETURN n.name as name
            ORDER BY n.name
            LIMIT 20
        """)
        entities = [record['name'] for record in result]
        for entity in entities:
            print(f"  - {entity}")

    driver.close()

if __name__ == "__main__":
    view_relationships()
