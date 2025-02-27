from neo4j import GraphDatabase, RoutingControl
import os
import json
import shutil
import time
import boto3
from botocore.exceptions import ClientError

import requests
from dotenv import load_dotenv
load_dotenv()

# Read variables from the .env file
URI = os.getenv("NEO4J_URI", "neo4j://localhost:7687")
USER = os.getenv("NEO4J_USER", "neo4j")
PASSWORD = os.getenv("NEO4J_PASSWORD", "password")
INFERENCE_ENDPOINT = os.getenv("INFERENCE_ENDPOINT")
S3_BUCKET = os.getenv("S3_BUCKET")
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
                "content": data['title'] + ' - ' + data['text'][:200] + '...'
            }
        ]
    }
    response = requests.post(INFERENCE_ENDPOINT, json=payload)
    response.raise_for_status()  # Raises an error for non-200 responses
    return response.json()

if __name__ == '__main__':
    neo4jDriver = GraphDatabase.driver(URI, auth=AUTH)
    
    # Create directories if they don't exist
    os.makedirs("./is_kb", exist_ok=True)
    os.makedirs("./is_pursuit", exist_ok=True)
    os.makedirs("./is_health", exist_ok=True)
    os.makedirs("./is_skill", exist_ok=True)

    with open("system_prompt.txt", "r") as f:
        system_message = f.read()

    s3 = boto3.client('s3')
    
    try:
        # List objects in the bucket
        paginator = s3.get_paginator('list_objects_v2')
        print(f"Processing bucket: {S3_BUCKET}")
        page_iterator = paginator.paginate(Bucket=S3_BUCKET)
        
        for page in page_iterator:
            if 'Contents' not in page:
                print(f"No files found in bucket '{S3_BUCKET}'")
                continue
                
            for obj in page['Contents']:
                start_total = time.perf_counter()

                file_key = obj['Key']
                file_size = obj['Size']
                
                # Skip folders or empty files
                if file_key.endswith('/') or file_size == 0:
                    continue
                    
                print(f"Processing file: {file_key} ({file_size} bytes)")
                
                # Extract the filename from the file_key
                filename = os.path.basename(file_key)
                
                # Download file content
                response = s3.get_object(Bucket=S3_BUCKET, Key=file_key)
                file_content_str = response['Body'].read().decode('utf-8')
                file_content = json.loads(file_content_str)
                
                
                # Process the file with LLM
                start_ai = time.perf_counter()
                ai_response = run_inference_on_llama_cpp(file_content)
                ai_time = time.perf_counter() - start_ai
                
                resp = ai_response['choices'][0]['message']['content']
                print(f"{file_content['title']}: {resp}")
                
                 # Handle file based on the response
                response_parts = resp.split()
                last_word = response_parts[-1] if response_parts else ""
                categories = last_word.split(',')

                if "KNOWLEDGE_BASE" in categories:
                    dest = os.path.join("./is_kb", filename)
                    with open(dest, 'w') as f:
                        json.dump(file_content, f)
                    print(f"KNOWLEDGE_BASE - Copied file to ./is_kb/{filename}")
                elif "PURSUIT" in categories:
                    dest = os.path.join("./is_pursuit", filename)
                    with open(dest, 'w') as f:
                        json.dump(file_content, f)
                    print(f"PURSUIT - Copied file to ./is_pursuit/{filename}")
                elif "HEALTH" in categories:
                    dest = os.path.join("./is_health", filename)
                    with open(dest, 'w') as f:
                        json.dump(file_content, f)
                    print(f"HEALTH - Copied file to ./is_health/{filename}")
                elif "SKILL" in categories:
                    dest = os.path.join("./is_skill", filename)
                    with open(dest, 'w') as f:
                        json.dump(file_content, f)
                    print(f"SKILL - Copied file to ./is_skill/{filename}")
                elif "NONE" in categories:
                    print("NONE - No action taken")
                else:
                    print(f"Unexpected response: {resp}")
                
                    
                total_time = time.perf_counter() - start_total
                print(f"Inference={ai_time:.4f}s, Total={total_time:.4f}s")
                
    except ClientError as e:
        print(f"Error accessing S3: {e}")