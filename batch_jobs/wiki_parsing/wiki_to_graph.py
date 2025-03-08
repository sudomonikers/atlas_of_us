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
    "KNOWLEDGE": "./node_type_documentation/knowledge.txt",
    "PURSUIT": "./node_type_documentation/pursuit.txt",
    "HEALTH": "./node_type_documentation/health.txt",
    "SKILL": "./node_type_documentation/skill.txt",
    "PERSONALITY": "./node_type_documentation/personality.txt",
    "INTRINSIC": "./node_type_documentation/intrinsic.txt"
}

class AtlasOfUsGraphAdmin:
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
        
        # Load category documentation
        self.category_documentation = {}
        for category, path in CATEGORY_DOCUMENTATION_PATHS.items():
            with open(path, "r") as f:
                self.category_documentation[category] = f.read()

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
        try:
            response = requests.post(INFERENCE_ENDPOINT, json=payload)
            response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
        except requests.exceptions.RequestException as e:
            print(f"Error running inference: {e}")
            return {}, conversation_history  # Return empty dict and original history on error

        ai_message = response.json()['choices'][0]['message']

        # Update conversation history with the user message and the AI response
        if conversation_history is None:
            conversation_history = []

        conversation_history.append({"role": "user", "content": message})
        conversation_history.append({"role": "assistant", "content": ai_message})

        return ai_message, conversation_history

    def findSimilarNodes(self, embedding_to_check: List[float]) -> List:
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
            
    def createNode(self, labels: List[str], properties: Dict[str, Any]):
        """
        Creates a node in the Neo4j graph with the given labels and properties.
        Requires that properties contains an 'embedding' key with a valid embedding value.

        Args:
            labels (List[str]): A list of labels to apply to the node.
            properties (Dict[str, Any]): A dictionary of properties to set on the node, including an 'embedding'.
        """
        if 'embedding' not in properties:
            raise ValueError("Embedding must be provided in properties")

        properties['aiGenerated'] = True  # Ensure aiGenerated is always true

        label_string = ":".join(labels)
        property_string = ", ".join([f"{key}: ${key}" for key in properties])
        query = f"MERGE (n:{label_string} {{{property_string}}})"
        
        self.driver.execute_query(query, **properties)
        print(f"Created node with labels: {labels} and properties: {properties}")
    
    def createRelationship(self):
        print("build this function")

    def process_file(self, file_key: str) -> Dict[str, Any]:
        """Process a single file from S3 and evaluate it for inclusion in the graph"""
        # Download file content
        response = self.s3.get_object(Bucket=S3_BUCKET, Key=file_key)
        file_content_str = response['Body'].read().decode('utf-8')
        file_content = json.loads(file_content_str)
        
        #message 
        NODE_CHOICE_PROMPT = f"""
        # What is the process for evaluating something new?
        When evaluating some new piece of information of content, we may want to represent it in the graph database. To figure out what that thing should look like, we will follow this process:

        1. Take in a piece of content and evaluate it. Do any pieces of it match the 6 L1 types?
        2. If so, how does it fit in?
        3. Create the graph node and insert it into neo4j

        You, as the LLM Atlas Of Us Graph Database Manager, will be the one performing the evaluation. If any piece of the ingested content relates to one of the 6 nodes, respond by saying so. You can indicate your choice (if there is any choice) by the last word of your response. Give your reasoning, and then end your answer with “therefor, this piece of content matches KNOWLEDGE” or whichever category it matches. The 6 categories available are:

        - Pursuit
        - Knowledge
        - Skill
        - Personality
        - Health
        - Intrinsic

        Title: {file_content['title']}
        Excerpt: {file_content['text'][:500]}...
        
        Evaluate this Wikipedia content according to the Atlas Of Us schema. Call the handleChoice function with the node designation.
        """
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
                        "required": ["nodeType", "nodeName", "nodeDescription"]
                    }
                }
            }
        ]
        #run inference
        ai_response, conversation_history = self.run_inference(NODE_CHOICE_PROMPT, NODE_CHOICE_TOOLS)        
        while 'tool_calls' not in ai_response:
            print("No tool calls in response, retrying...")
            ai_response, conversation_history = self.run_inference(NODE_CHOICE_PROMPT, NODE_CHOICE_TOOLS)
        
        print(f"Initial ai response: {ai_response}\n")
        tool_call = ai_response['tool_calls'][0]
        function_name = tool_call['function']['name']
        function_args = json.loads(tool_call['function']['arguments'])

        if function_name == "handleChoice":
            if function_args['nodeType'] == "NONE":
                pass
            else:
                generated_embedding = self.generate_embedding(function_args['nodeDescription'])
                similar_nodes = self.findSimilarNodes(generated_embedding)

                #if we have similar nodes, double check with the llm if they are really the same or not
                if len(similar_nodes) > 0:
                    print("Checking on similar nodes")
                    SIMILARITY_PROMPT = f"""
                    You previously took in this content and chose to create a node based off of it, however upon querying the database we see that something similar might actually exist.
                    Here are the results of that query: 

                    {similar_nodes}

                    Upon reviewing these, do any of them look like they are the same thing as the node you are trying to create? 
                    If so send back 'DUPLICATE' if what you are trying to create is different, send back 'DIFFERENT'. Only send back one of those two words.
                    Do not send back an explanation. Only respond with 'DUPLICATE' or 'DIFFERENT'.
                    """
                    similarity_response, conversation_history = self.run_inference(SIMILARITY_PROMPT, [], conversation_history)
                    while similarity_response['content'] not in ("DUPLICATE", "DIFFERENT"):
                        print("No tool calls in response, retrying...")
                        similarity_response = self.run_inference(SIMILARITY_PROMPT, NODE_CHOICE_TOOLS)

                    match similarity_response['content']:
                        case "DUPLICATE":
                            print('This is a duplicate, no action taken.')
                            pass
                        case "DIFFERENT":
                            ###REFINE THE NODE FURTHER FOR SUB TYPES
                            REFINE_NODE_FURTHER_PROMPT = f"""
                            Now that we have determined the node's, main type, we need to refine it further.
                            The following is the documentation for the node type you have selected:

                            {self.category_documentation[function_args['nodeType']]}

                            Given the following content, does it fall into any of the subcategories listed in the documentation?
                            If it does, respond with an array of the subtypes. These subtypes will become labels in our graph database.
                            """
                            REFINE_NODE_FURTHER_TOOLS = [
                                {
                                    "type": "function",
                                    "function": {
                                        "name": "refineNodeSubTypes",
                                        "description": "Adds subtypes to the previous node",
                                        "parameters": {
                                            "type": "list",
                                            "description": "A list of subtypes to add as labels to the node."
                                        }
                                    }
                                }
                            ]
                            node_refinement_response, conversation_history = self.run_inference(REFINE_NODE_FURTHER_PROMPT, REFINE_NODE_FURTHER_TOOLS, conversation_history)
                            print(node_refinement_response)
                            self.createNode(
                                ["L1", function_args['nodeType']], 
                                {
                                    "name": function_args['nodeName'],
                                    "description": function_args['nodeDescription'],
                                    "embedding": generated_embedding,
                                    "aiGenerated": True,
                                    "aiReasonForAdding": ai_response['content'] #ADDING THIS TEMPORARILY FOR DEBUGGING PURPOSES (IT SHOULD BE REMOVED LATER)
                                }
                            )
                            print(f"Created new node: {function_args['nodeName']}")
                        case _:
                            print("Bad AI response, reevaluate")      
                else:
                    ###REFINE THE NODE FURTHER FOR SUB TYPES
                    REFINE_NODE_FURTHER_PROMPT = f"""
                    Now that we have determined the node's, main type, we need to refine it further.
                    The following is the documentation for the node type you have selected:

                    {self.category_documentation[function_args['nodeType']]}

                    Given the following content, does it fall into any of the subcategories listed in the documentation?
                    If it does, respond with an array of the subtypes. These subtypes will become labels in our graph database.
                    """
                    REFINE_NODE_FURTHER_TOOLS = [
                        {
                            "type": "function",
                            "function": {
                                "name": "refineNodeSubTypes",
                                "description": "Adds subtypes to the previous node",
                                "parameters": {
                                    "type": "list",
                                    "description": "A list of subtypes to add as labels to the node."
                                }
                            }
                        }
                    ]
                    print(f"CONVO HISTORY: {conversation_history}")
                    node_refinement_response, conversation_history = self.run_inference(REFINE_NODE_FURTHER_PROMPT, REFINE_NODE_FURTHER_TOOLS, conversation_history)
                    print(node_refinement_response)
                    self.createNode(
                        ["L1", function_args['nodeType']], 
                        {
                            "name": function_args['nodeName'],
                            "description": function_args['nodeDescription'],
                            "embedding": generated_embedding,
                            "aiGenerated": True,
                            "aiReasonForAdding": ai_response['content'] #ADDING THIS TEMPORARILY FOR DEBUGGING PURPOSES (IT SHOULD BE REMOVED LATER)
                        }
                    )

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
            #self.generate_report(all_results)
                    
        except ClientError as e:
            print(f"Error accessing S3: {e}")
        
if __name__ == '__main__':
    admin = AtlasOfUsGraphAdmin(URI, AUTH)
    try:
        admin.process_all_files() 
        #admin.process_file("1000001_NPU.json") #FOR DEBUGGING one file
    finally:
        admin.close()