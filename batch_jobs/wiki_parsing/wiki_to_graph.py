from neo4j import GraphDatabase, RoutingControl
import os
import json
import shutil
import time

import requests
from dotenv import load_dotenv
load_dotenv()

# Read variables from the .env file
URI = os.getenv("NEO4J_URI", "neo4j://localhost:7687")
USER = os.getenv("NEO4J_USER", "neo4j")
PASSWORD = os.getenv("NEO4J_PASSWORD", "password")
INFERENCE_ENDPOINT = os.getenv("INFERENCE_ENDPOINT")
AUTH = (USER, PASSWORD)
system_message = ''

def run_inference_on_llama_cpp(data):
    payload = {
        "model": "Qwen",
        "messages": [
            {
                "role": "system",
                "content": system_message
            },
            {
                "role": "user",
                "content": data['title']
            }
        ]
    }
    response = requests.post(INFERENCE_ENDPOINT, json=payload)
    response.raise_for_status()  # Raises an error for non-200 responses
    return response.json()

# def insert_knowledge_base(driver, name, friend_name):
#     driver.execute_query(
#         "MERGE (a:Person {name: $name}) "
#         name=name, friend_name=friend_name, database_="neo4j",
#     )


# def update_kb_relationship(driver, name):
#     records, _, _ = driver.execute_query(
#         "MATCH (a:Person)-[:KNOWS]->(friend) WHERE a.name = $name "
#         "RETURN friend.name ORDER BY friend.name",
#         name=name, database_="neo4j", routing_=RoutingControl.READ,
#     )
#     for record in records:
#         print(record)


if __name__ == '__main__':
    neo4jDriver = GraphDatabase.driver(URI, auth=AUTH)
    directory = "./wiki_plaintext"
    with open("system_prompt.txt", "r") as f:
        system_message = f.read()
    
    for entry in os.scandir(directory):
        start_total = time.perf_counter()

        with open(entry.path, "r") as file:
            start_json = time.perf_counter()
            data = json.load(file)
            json_time = time.perf_counter() - start_json

        start_ai = time.perf_counter()
        ai_response = run_inference_on_llama_cpp(data)
        ai_time = time.perf_counter() - start_ai

        resp = ai_response['choices'][0]['message']['content']
        print(data['title'], resp)
        match True:
            case _ if resp.startswith("KNOWLEDGE_BASE"):
                dest = os.path.join("./is_kb", entry.name)
                shutil.copy(entry.path, dest)
                print("KNOWLEDGE_BASE - Copied file to ./is_kb")
            case _ if resp.startswith("PURSUIT"):
                dest = os.path.join("./is_pursuit", entry.name)
                shutil.copy(entry.path, dest)
                print("PURSUIT - Copied file to ./is_pursuit")
            case _ if resp.startswith("NEITHER"):
                print("NEITHER - No action taken")
            case _:
                print(f"Unexpected response: {resp}")
        total_time = time.perf_counter() - start_total
        print(f"JSON load={json_time:.4f}s, Inference={ai_time:.4f}s, Total={total_time:.4f}s")