from neo4j import GraphDatabase, RoutingControl
import os
import requests
from dotenv import load_dotenv
load_dotenv()

# Read variables from the .env file
URI = os.getenv("NEO4J_URI", "neo4j://localhost:7687")
USER = os.getenv("NEO4J_USER", "neo4j")
PASSWORD = os.getenv("NEO4J_PASSWORD", "password")
INFERENCE_ENDPOINT = os.getenv("INFERENCE_ENDPOINT")
AUTH = (USER, PASSWORD)

def run_inference_on_llama_cpp(data):
    response = requests.post(INFERENCE_ENDPOINT)
    response.raise_for_status()  # Raises an error for non-200 responses
    return response.json()

def insert_knowledge_base(driver, name, friend_name):
    driver.execute_query(
        "MERGE (a:Person {name: $name}) "
        name=name, friend_name=friend_name, database_="neo4j",
    )


def update_kb_relationship(driver, name):
    records, _, _ = driver.execute_query(
        "MATCH (a:Person)-[:KNOWS]->(friend) WHERE a.name = $name "
        "RETURN friend.name ORDER BY friend.name",
        name=name, database_="neo4j", routing_=RoutingControl.READ,
    )
    for record in records:
        print(record["friend.name"])


if __name__ == '__main__':
    neo4jDriver = GraphDatabase.driver(uri, auth=AUTH)
    directory = "./wiki_plaintext"
    

    for entry in os.scandir(directory):
    with open(entry.path, "r") as file:
        data = json.load(file)
        ai_response = run_inference_on_llama_cpp(data)
        print(ai_response)