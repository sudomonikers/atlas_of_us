import boto3
import requests
import json
import os
from botocore.exceptions import ClientError

def process_s3_files_with_llm(bucket_name, prefix="", llm_endpoint="http://localhost:8080/v1/chat/completions"):
    """
    Process all files from an S3 bucket with a local LLM server.
    
    Args:
        bucket_name (str): Name of the S3 bucket
        prefix (str, optional): Filter files by prefix/folder
        llm_endpoint (str, optional): URL of the LLM API endpoint
    """
    # Initialize S3 client
    s3 = boto3.client('s3')
    
    try:
        # List objects in the bucket
        paginator = s3.get_paginator('list_objects_v2')
        page_iterator = paginator.paginate(Bucket=bucket_name, Prefix=prefix)
        
        for page in page_iterator:
            if 'Contents' not in page:
                print(f"No files found in bucket '{bucket_name}' with prefix '{prefix}'")
                continue
                
            for obj in page['Contents']:
                file_key = obj['Key']
                file_size = obj['Size']
                
                # Skip folders or empty files
                if file_key.endswith('/') or file_size == 0:
                    continue
                    
                print(f"Processing file: {file_key} ({file_size} bytes)")
                
                # Download file content
                response = s3.get_object(Bucket=bucket_name, Key=file_key)
                file_content = response['Body'].read().decode('utf-8')
                
                # Process the file with LLM
                llm_response = run_inference_on_llama_cpp(file_content, llm_endpoint)
                
                # Do something with the LLM response
                print(f"LLM processed file {file_key}")
                print(f"Response preview: {llm_response[:100]}...")
                
                # Optionally save the response back to S3
                # save_response_to_s3(bucket_name, file_key, llm_response)
                
    except ClientError as e:
        print(f"Error accessing S3: {e}")

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



if __name__ == "__main__":
    # Configuration
    BUCKET_NAME = "your-bucket-name"  # Replace with your bucket name
    PREFIX = ""  # Optional: filter by prefix/folder
    LLM_ENDPOINT = "http://localhost:8080/v1/chat/completions"  # Adjust if needed
    
    # Run the processor
    process_s3_files_with_llm(BUCKET_NAME, PREFIX, LLM_ENDPOINT)