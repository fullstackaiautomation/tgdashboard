"""
TG-Dashboard Expert AI Agent
Powered by Graphiti knowledge graph and Claude
"""
import os
from dotenv import load_dotenv
from graphiti_models.graph_builder import GraphBuilder

load_dotenv()

class ExpertAgent:
    def __init__(self):
        self.graph_builder = None

    async def initialize(self):
        """Initialize the agent with Graphiti connection"""
        self.graph_builder = GraphBuilder()
        print("[SUCCESS] Expert Agent initialized with knowledge graph access")

    async def query(self, question: str):
        """
        Query the knowledge graph to answer questions about TG-Dashboard data

        Args:
            question: Natural language question about tasks, projects, content, etc.

        Returns:
            Dictionary with answer and supporting data from the graph
        """
        print(f"[INFO] Expert Agent processing query: {question}")

        # Search the knowledge graph
        results = await self.graph_builder.search_graph(question, limit=5)

        if not results:
            return {
                "answer": "I don't have enough information in the knowledge graph to answer that question yet.",
                "results": [],
                "confidence": "low"
            }

        # Format the results
        formatted_results = []
        for result in results:
            formatted_results.append({
                "content": str(result),
                "relevance": "high"  # Graphiti ranks by relevance
            })

        # Generate a contextual answer
        answer = self._generate_answer(question, formatted_results)

        return {
            "answer": answer,
            "results": formatted_results,
            "confidence": "high" if len(results) > 0 else "medium"
        }

    def _generate_answer(self, question: str, results: list):
        """Generate a natural language answer based on graph results"""
        if not results:
            return "No relevant information found in the knowledge graph."

        # Create a summary answer
        answer = f"Based on the knowledge graph, I found {len(results)} relevant item(s):\n\n"

        for i, result in enumerate(results[:3], 1):  # Show top 3
            answer += f"{i}. {result['content']}\n"

        return answer

    async def get_task_insights(self):
        """Get insights about tasks in the system"""
        query = "What tasks are in progress? What are the priorities?"
        return await self.query(query)

    async def get_project_overview(self):
        """Get overview of all projects"""
        query = "What projects exist? What is their status?"
        return await self.query(query)

    async def get_relationships(self, entity_name: str):
        """Get relationships for a specific entity"""
        query = f"What is related to {entity_name}? What are the connections?"
        return await self.query(query)

    async def close(self):
        """Close the agent and its connections"""
        if self.graph_builder:
            await self.graph_builder.close()
        print("[INFO] Expert Agent closed")

if __name__ == "__main__":
    import asyncio

    async def test_agent():
        agent = ExpertAgent()
        await agent.initialize()

        # Test query
        result = await agent.query("What tasks are currently in progress?")
        print("\n[AGENT RESPONSE]")
        print(f"Answer: {result['answer']}")
        print(f"Confidence: {result['confidence']}")

        await agent.close()

    asyncio.run(test_agent())
