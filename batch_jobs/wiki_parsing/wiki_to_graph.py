from neo4j import GraphDatabase
import os
import json
from sentence_transformers import SentenceTransformer
import time
import boto3
from botocore.exceptions import ClientError
from typing import Dict, List, Optional, Any, Tuple
import requests
from dotenv import load_dotenv
load_dotenv()

# Read variables from the .env file
#neo4j
URI = os.getenv("NEO4J_URI", "neo4j://localhost:7687")
USER = os.getenv("NEO4J_USER", "neo4j")
PASSWORD = os.getenv("NEO4J_PASSWORD", "password")
AUTH = (USER, PASSWORD)
#llm
INFERENCE_ENDPOINT = os.getenv("INFERENCE_ENDPOINT")
EMBEDDINGS_ENDPOINT = os.getenv("EMBEDDINGS_ENDPOINT")
MIN_CONFIDENCE_THRESHOLD = 0.75
HUMAN_REVIEW_THRESHOLD = 0.85
#S3
S3_BUCKET = os.getenv("S3_BUCKET")


# Paths for categorization
CATEGORY_DOCUMENTATION_PATHS = {
    "KNOWLEDGE": "./is_kb",
    "PURSUIT": "./is_pursuit",
    "HEALTH": "./is_health",
    "SKILL": "./is_skill",
    "PERSONALITY": "./is_personality",
    "INTRINSIC": "./is_intrinsic",
    "ENTITY": "./is_entity",
    "PERSON": "./is_person",
    "REVIEW": "./needs_review",
    "REJECTED": "./rejected"
}

SIMILARITY_PROMPT = f""
SIMILARITY_TOOLS = []

NODE_CHOICE_PROMPT = f""
NODE_CHOICE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "handleChoice",
            "description": "Handles the choice made by the llm of what type of node the provided content might be",
            "parameters": {
                "type": "object",
                "properties": {
                    "nodeType": {
                        "type": "string",
                        "description": "The node type selected. One of seven possible values: PURSUIT, KNOWLEDGE, SKILL, PERSONALITY, HEALTH, INTRINSIC, or NONE"
                    },
                    "nodeName": {
                        "type": "string",
                        "description": "What the name of the node should be."
                    },
                    "nodeDescription": {
                        "type": "string",
                        "description": "A description of the new node we are creating."
                    }
                },
                "required": ["nodeType"]
            }
        }
    }
]

class AtlasOfUsGraphAdmin:
    #TODO: init passes the eye test, needs to actually run to determine errors though
    def __init__(self, uri, auth):
        #neo4j initialization
        self.driver = GraphDatabase.driver(uri, auth=auth)

        #load embedding model
        self.embedding_model = SentenceTransformer("all-mpnet-base-v2")

        #s3 initialization
        self.s3 = boto3.client('s3')
        
        # Load system prompts
        with open("system_prompt.txt", "r") as f:
            self.system_message = f.read()

    def close(self):
        self.driver.close()
        
    def generate_embedding(self, content_to_embed: str):
        """Generates an embedding for attaching to a graph node"""
        # payload = {
        #     "input": content_to_embed,
        #     "model": "Qwen",
        #     "encoding_format": "float"
        # }
        # response = requests.post(EMBEDDINGS_ENDPOINT, json=payload)
        # response_data = response.json() 
        # embedding = response_data['data'][0]['embedding']
        # print(f"Embedding length: {len(embedding)}") #QWEN is giving an embedding of size 5120 which is way too big
        embedding = self.embedding_model.encode(content_to_embed)
        return embedding

    def run_inference(self, message: str, tools: List, conversation_history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """Run inference on the LLM"""
        # Start with system message
        messages = [
            {
                "role": "system",
                "content": self.system_message
            }
        ]
        
        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history)
        
        # Add current query
        messages.append({
            "role": "user",
            "content": message
        })
        
        payload = {
            "model": "Qwen",
            "messages": messages,
            "tools": tools
        }
        
        response = requests.post(INFERENCE_ENDPOINT, json=payload)
        return response.json() 

    def checkNodeSimilarity(self, embedding_to_check: List[float]) -> List:
        try:
            similarity_result = self.driver.execute_query(
                (
                    "CALL db.index.vector.queryNodes('nodeEmbeddings', 5, $embedding) "
                    "YIELD node, score "
                    "RETURN node.name as name, node.description as description, score "
                ),
                embedding=embedding_to_check
            )
            similar_results = []
            for record in similarity_result.records:
                if record['score'] > MIN_CONFIDENCE_THRESHOLD:
                    similar_results.append(record)
            return similar_results
        except Exception as e:
            print(f"Error checking node similarity: {e}")
    
    def buildKnowledgeNode(self, function_params, ai_message):
        generated_embedding = self.generate_embedding(function_params['nodeDescription'])
        similar_nodes = self.checkNodeSimilarity(generated_embedding)
        if len(similar_nodes) > 0:
            print("Checking on similar nodes")
            #### NEED TO MAKE THE AI RETURN SOMETHING BETTER, MIGHT NEED TO MESS WITH THE SYSTEM PROMPT
            similarity_response = self.run_inference(f"\n\nYou previously took in this content and chose to create a node based off of it, however upon querying the database we see that something similar might actually exist. Here are the results of that query: {similar_nodes}\n\n Upon reviewing these, do any of them look like they are the same thing as the node you are trying to create? If so send back 'DUPLICATE' if what you are trying to create is different, send back 'DIFFERENT'", [])
            print(similarity_response['choices'][0]['message'])

        #now that we have an embedding, we should see if something similar already exists
        self.driver.execute_query(
            "MERGE (k:L1:Knowledge {name: $name, description: $description, embedding: $embedding, aiGenerated: true})", 
            name = function_params['nodeName'],
            description = function_params['nodeDescription'],
            embedding = generated_embedding
        )
        print(f"Created new node: {function_params['nodeName']}")

    def handleChoice(self, function_params: Dict[str, Any], ai_message: Any):
        match function_params['nodeType']:
            case "NONE":
                print(function_params)
            case "PURSUIT":
                print(function_params)
            case "KNOWLEDGE":
                self.buildKnowledgeNode(function_params, ai_message)
            case "SKILL":
                print(function_params)
            case "PERSONALITY":
                print(function_params)
            case "HEALTH":
                print(function_params)
            case "INTRINSIC":
                print(function_params)
            case _:
                print("default case")

    def process_file(self, file_key: str) -> Dict[str, Any]:
        """Process a single file from S3 and evaluate it for inclusion in the graph"""
        # Download file content
        response = self.s3.get_object(Bucket=S3_BUCKET, Key=file_key)
        file_content_str = response['Body'].read().decode('utf-8')
        file_content = json.loads(file_content_str)
        ai_message = f"Title: {file_content['title']}\nExcerpt: {file_content['text'][:500]}...\n\nEvaluate this Wikipedia content according to the Atlas Of Us schema."
        ai_response = self.run_inference(ai_message, NODE_CHOICE_TOOLS)
        ai_message = ai_response['choices'][0]['message']
        if ai_response['choices'][0]['message']['tool_calls']:
            tool_call = ai_response['choices'][0]['message']['tool_calls'][0]
            function_name = tool_call['function']['name']
            function_args = json.loads(tool_call['function']['arguments'])

            if function_name == "handleChoice":
                self.handleChoice(function_args, ai_message)

    def process_all_files(self):
        """Process all files in the S3 bucket"""
        try:
            # List objects in the bucket
            paginator = self.s3.get_paginator('list_objects_v2')
            print(f"Processing bucket: {S3_BUCKET}")
            page_iterator = paginator.paginate(Bucket=S3_BUCKET)
            
            all_results = []
            
            for page in page_iterator:
                if 'Contents' not in page:
                    print(f"No files found in bucket '{S3_BUCKET}'")
                    continue
                    
                for obj in page['Contents']:
                    file_key = obj['Key']
                    file_size = obj['Size']
                    
                    # Skip folders or empty files
                    if file_key.endswith('/') or file_size == 0:
                        continue
                        
                    print(f"\nProcessing file: {file_key} ({file_size} bytes)")
                    
                    try:
                        result = self.process_file(file_key)
                        all_results.append(result)
                    except Exception as e:
                        print(f"Error processing {file_key}: {e}")
            
            # Generate summary report
            self.generate_report(all_results)
                    
        except ClientError as e:
            print(f"Error accessing S3: {e}")
        
if __name__ == '__main__':
    admin = AtlasOfUsGraphAdmin(URI, AUTH)
    try:
        admin.process_all_files() #we can run this when ready, for now process one file
        #admin.process_file("1000001_NPU.json")
    finally:
        admin.close()