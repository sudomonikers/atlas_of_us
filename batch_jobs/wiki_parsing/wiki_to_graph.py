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
    "Knowledge": "./node_type_documentation/knowledge.txt",
    "Pursuit": "./node_type_documentation/pursuit.txt",
    "Health": "./node_type_documentation/health.txt",
    "Skill": "./node_type_documentation/skill.txt",
    "Personality": "./node_type_documentation/personality.txt",
    "Intrinsic": "./node_type_documentation/intrinsic.txt"
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
        if 'tool_calls' in ai_message:
            function_call = ai_message['tool_calls'][0]['function']
            conversation_history.append({"role": "assistant", "content": f"Tool call made: {function_call['name']} called with parameters {function_call['arguments']}"})
        else:
            conversation_history.append({"role": "assistant", "content": ai_message['content']})

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

        1. Take in a piece of content and evaluate it. Does anything within the content match any of the 6 L1 types?
        2. If so, how does it fit in?

        You, as the LLM Atlas Of Us Graph Database Manager, will be the one performing the evaluation. If any piece of the ingested content relates to one of the 6 nodes, then call the handleChoice function with one of the 6 expected parameters:

        - Pursuit
        - Knowledge
        - Skill
        - Personality
        - Health
        - Intrinsic

        If the content does not match any L1 type, then call handleChoice with NONE.

        Title: {file_content['title']}
        Excerpt: {file_content['text'][:500]}...
        
        Evaluate this Wikipedia content according to the Atlas Of Us schema.
        Call the handleChoice function with the expected parameters.
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
                                "description": "The node type selected. One of seven possible values: Pursuit, Knowledge, Skill, Personality, Health, Intrinsic, or NONE"
                            },
                            "nodeName": {
                                "type": "string",
                                "description": "What the name of the node should be (not necessarily the name of the content)."
                            },
                            "nodeDescription": {
                                "type": "string",
                                "description": "A description of the new node we are creating (not necessarily a description of the content)."
                            },
                            "selectionReason": {
                                "type": "string",
                                "description": "The AI agents reasoning for how this content matches the selected nodeName"
                            }
                        },
                        "required": ["nodeType", "nodeName", "nodeDescription", "selectionReason"]
                    }
                }
            }
        ]
        #run inference
        ai_response, conversation_history = self.run_inference(NODE_CHOICE_PROMPT, NODE_CHOICE_TOOLS) 
        print(ai_response)       
        node_choice_function_call = ai_response['tool_calls'][0]['function']
        node_choice_function_call_arguments = json.loads(node_choice_function_call['arguments'])
        node_type_selected = node_choice_function_call_arguments['nodeType']

        #If the agent thinks this content has something that should be added to the db, lets have it refine further
        if node_type_selected != 'NONE':
            #generate an embedding of the content, and then check neo4j to see if somthing similar exists
            generated_embedding = self.generate_embedding(node_choice_function_call_arguments['nodeDescription'])
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
                Do not send back an explanation. Only respond with 'DUPLICATE' or 'DIFFERENT' as a parameter to the provided handleSimilarityResponse tool.
                """
                SIMILARITY_TOOLS = [
                    {
                        "type": "function",
                        "function": {
                            "name": "handleSimilarityResponse",
                            "description": "Handles the choice made by the llm of whether or not the given node is the same as or different from the provided 'similar' nodes.",
                            "parameters": {
                                "type": "string",
                                "description": "One of two possible strings 'DIFFERENT', or 'DUPLICATE'"
                            }
                        }
                    }
                ]
                similarity_response, conversation_history = self.run_inference(SIMILARITY_PROMPT, SIMILARITY_TOOLS, conversation_history)
                
                similarity_function_call = similarity_response['tool_calls'][0]['function']
                similarity_function_call_choice = json.loads(similarity_function_call['arguments'])
                if similarity_function_call_choice == 'DUPLICATE':
                    return

            #if we have cleared the node type check as well as the duplicate check, then we can refine our node further
            REFINE_NODE_FURTHER_PROMPT = f"""
            Now that we have determined the node's, main type, we need to refine it further.
            The following is the documentation for the node type you have selected:

            {self.category_documentation[node_type_selected]}

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
                            "type": "object",
                            "properties": { 
                                "subTypesSelected": {
                                    "type": "array",
                                    "description": "A list of subtypes to add as labels to the node."
                                },
                                "selectionReason": {
                                    "type": "string",
                                    "description": "The AI agents reasoning for how this content matches the selected nodeName"
                                }
                            }

                        }
                    }
                }
            ]
            node_refinement_response, conversation_history = self.run_inference(REFINE_NODE_FURTHER_PROMPT, REFINE_NODE_FURTHER_TOOLS, conversation_history)
            print(node_refinement_response)

            #now that we have our node nice and refined and passing all checks, add it to the database
            sub_types_selected = json.loads(node_refinement_response['tool_calls'][0]['function']['arguments'])['subTypesSelected']
            self.createNode(
                ["L1", node_type_selected] + sub_types_selected,
                {
                    "name": node_choice_function_call_arguments['nodeName'],
                    "description": node_choice_function_call_arguments['nodeDescription'],
                    "embedding": generated_embedding,
                    "aiGenerated": True,
                    "aiReasoning": node_choice_function_call_arguments['selectionReason']
                }
            )
            print(f"Created new node: {node_choice_function_call_arguments['nodeName']}")
        else:
            return
            

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
                        start_time = time.time()
                        self.process_file(file_key)

                        # Move the file to the 'processed' folder
                        self.s3.copy_object(Bucket=S3_BUCKET, CopySource={'Bucket': S3_BUCKET, 'Key': file_key}, Key='processed/' + file_key)
                        self.s3.delete_object(Bucket=S3_BUCKET, Key=file_key)
                        
                        end_time = time.time()
                        print(f"Time to process {file_key}: {end_time - start_time} seconds")
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