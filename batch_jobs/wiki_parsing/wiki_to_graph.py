from neo4j import GraphDatabase, RoutingControl
import os
import json
import shutil
import time
import boto3
from botocore.exceptions import ClientError
from typing import Dict, List, Optional, Any, Tuple
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
MIN_CONFIDENCE_THRESHOLD = 0.75
HUMAN_REVIEW_THRESHOLD = 0.85

# Paths for categorization
CATEGORY_PATHS = {
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

class AtlasOfUsGraphAdmin:
    def __init__(self, uri, auth):
        self.driver = GraphDatabase.driver(uri, auth=auth)
        self.s3 = boto3.client('s3')
        
        # Create directories if they don't exist
        for path in CATEGORY_PATHS.values():
            os.makedirs(path, exist_ok=True)
            
        # Load system prompts
        with open("system_prompt.txt", "r") as f:
            self.system_message = f.read()
            
    def close(self):
        self.driver.close()
        
    def run_inference(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Run inference on the LLM to classify the Wikipedia content"""
        payload = {
            "model": "Qwen",
            "messages": [
                {
                    "role": "system",
                    "content": self.system_message
                },
                {
                    "role": "user",
                    "content": f"Title: {data['title']}\nExcerpt: {data['text'][:500]}...\n\nEvaluate this Wikipedia content according to the Atlas Of Us schema."
                }
            ],
            "function_call": {
                "name": "evaluateWikipediaContent"
            },
            "functions": [
                {
                    "name": "evaluateWikipediaContent",
                    "description": "Evaluate Wikipedia content and determine how it fits into the Atlas Of Us graph database",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "shouldAdd": {
                                "type": "boolean",
                                "description": "Whether this content should be added to the database"
                            },
                            "nodeType": {
                                "type": "string",
                                "enum": ["L1", "L2", "L3"],
                                "description": "The layer this node belongs to in the Atlas Of Us"
                            },
                            "nodeSubtype": {
                                "type": "string",
                                "enum": ["Pursuit", "Knowledge", "Skill", "Personality", "Health", "Intrinsic", "Entity", "Person"],
                                "description": "The specific subtype of the node"
                            },
                            "properties": {
                                "type": "object",
                                "description": "Key properties to extract for this node"
                            },
                            "relationships": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "type": {
                                            "type": "string",
                                            "description": "Type of relationship"
                                        },
                                        "targetNode": {
                                            "type": "string",
                                            "description": "The name of the target node"
                                        },
                                        "properties": {
                                            "type": "object",
                                            "description": "Properties of the relationship"
                                        }
                                    }
                                },
                                "description": "Potential relationships to other nodes"
                            },
                            "confidenceScore": {
                                "type": "number",
                                "minimum": 0,
                                "maximum": 1,
                                "description": "Confidence level in this evaluation"
                            },
                            "reasoning": {
                                "type": "string",
                                "description": "Explanation for this classification"
                            }
                        },
                        "required": ["shouldAdd", "confidenceScore", "reasoning"]
                    }
                }
            ]
        }
        
        response = requests.post(INFERENCE_ENDPOINT, json=payload)
        response.raise_for_status()  # Raises an error for non-200 responses
        return response.json()
    
    def check_existing_nodes(self, name: str, node_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Check if similar nodes already exist in the database"""
        query = (
            "MATCH (n) "
            "WHERE toLower(n.name) CONTAINS toLower($name) "
        )
        
        if node_type:
            query += f"AND n:{node_type} "
            
        query += "RETURN n.name as name, labels(n) as labels, id(n) as id LIMIT 5"
        
        with self.driver.session() as session:
            result = session.run(query, name=name)
            return [dict(record) for record in result]
    
    def create_node(self, node_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new node in the Neo4j database"""
        # Extract data
        node_type = node_data.get("nodeType")
        node_subtype = node_data.get("nodeSubtype")
        properties = node_data.get("properties", {})
        
        # Build labels string
        labels = []
        if node_type:
            labels.append(node_type)
        if node_subtype:
            labels.append(node_subtype)
            
        labels_str = ":".join(labels)
        
        # Build properties string
        props_list = [f"{k}: ${k}" for k in properties.keys()]
        props_str = ", ".join(props_list)
        
        query = f"CREATE (n:{labels_str} {{{props_str}}}) RETURN id(n) as id, n.name as name"
        
        with self.driver.session() as session:
            result = session.run(query, **properties)
            record = result.single()
            return {"id": record["id"], "name": record["name"]}
    
    def create_relationships(self, node_id: int, relationships: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create relationships between nodes"""
        results = []
        
        with self.driver.session() as session:
            for rel in relationships:
                # Find target node
                target_name = rel.get("targetNode")
                rel_type = rel.get("type")
                rel_props = rel.get("properties", {})
                
                # Check if target exists
                find_query = "MATCH (n) WHERE n.name = $name RETURN id(n) as id"
                find_result = session.run(find_query, name=target_name)
                target_record = find_result.single()
                
                if target_record:
                    # Create relationship if target exists
                    target_id = target_record["id"]
                    
                    # Build properties string
                    props_list = [f"{k}: ${k}" for k in rel_props.keys()]
                    props_str = ", ".join(props_list)
                    
                    rel_query = (
                        f"MATCH (a), (b) "
                        f"WHERE id(a) = $node_id AND id(b) = $target_id "
                        f"CREATE (a)-[r:{rel_type} {{{props_str}}}]->(b) "
                        f"RETURN id(r) as id, type(r) as type"
                    )
                    
                    rel_result = session.run(rel_query, node_id=node_id, target_id=target_id, **rel_props)
                    rel_record = rel_result.single()
                    
                    if rel_record:
                        results.append({
                            "id": rel_record["id"],
                            "type": rel_record["type"],
                            "source": node_id,
                            "target": target_id
                        })
                
        return results
    
    def process_file(self, file_key: str) -> Dict[str, Any]:
        """Process a single file from S3 and evaluate it for inclusion in the graph"""
        start_total = time.perf_counter()
        
        # Extract the filename from the file_key
        filename = os.path.basename(file_key)
        
        # Download file content
        response = self.s3.get_object(Bucket=S3_BUCKET, Key=file_key)
        file_content_str = response['Body'].read().decode('utf-8')
        file_content = json.loads(file_content_str)
        
        # Process the file with LLM
        start_ai = time.perf_counter()
        ai_response = self.run_inference(file_content)
        ai_time = time.perf_counter() - start_ai
        
        # Extract function call response
        try:
            function_call = ai_response.get('choices', [{}])[0].get('message', {}).get('function_call', {})
            
            if function_call and 'arguments' in function_call:
                evaluation = json.loads(function_call['arguments'])
            else:
                # Fallback to content parsing if function call is not used
                content = ai_response.get('choices', [{}])[0].get('message', {}).get('content', '')
                print(f"Warning: Function call not used. Parsing content: {content[:100]}...")
                
                # Simple fallback categorization
                evaluation = {
                    "shouldAdd": "KNOWLEDGE_BASE" in content or "PURSUIT" in content or "HEALTH" in content or "SKILL" in content,
                    "nodeType": "L1",
                    "nodeSubtype": "Knowledge" if "KNOWLEDGE_BASE" in content else 
                                  "Pursuit" if "PURSUIT" in content else
                                  "Health" if "HEALTH" in content else
                                  "Skill" if "SKILL" in content else "Unknown",
                    "confidenceScore": 0.7,
                    "reasoning": "Fallback classification from content parsing"
                }
        except Exception as e:
            print(f"Error parsing AI response: {e}")
            evaluation = {
                "shouldAdd": False,
                "confidenceScore": 0,
                "reasoning": f"Error processing: {str(e)}"
            }
        
        # Print classification results
        print(f"\n=== {file_content['title']} ===")
        print(f"Classification: {evaluation.get('nodeType', 'N/A')}/{evaluation.get('nodeSubtype', 'N/A')}")
        print(f"Should add: {evaluation.get('shouldAdd', False)}")
        print(f"Confidence: {evaluation.get('confidenceScore', 0)}")
        print(f"Reasoning: {evaluation.get('reasoning', 'None provided')[:100]}...")
        
        # Save categorized file
        #self.save_categorized_file(filename, file_content, evaluation)
        
        # Process database operations if we should add this node and confidence is high enough
        node_result = None
        relationships_result = []
        
        if evaluation.get('shouldAdd', False) and evaluation.get('confidenceScore', 0) >= MIN_CONFIDENCE_THRESHOLD:
            # Add properties derived from the original content
            if 'properties' not in evaluation or not evaluation['properties']:
                evaluation['properties'] = {}
                
            # Ensure name property exists
            if 'name' not in evaluation['properties']:
                evaluation['properties']['name'] = file_content['title']
                
            # Add source info and excerpt
            evaluation['properties']['source'] = 'wikipedia'
            evaluation['properties']['excerpt'] = file_content['text'][:200] if 'text' in file_content else ''
            
            # Check for duplicates
            existing = self.check_existing_nodes(evaluation['properties']['name'], 
                                              evaluation.get('nodeSubtype'))
            
            if existing:
                print(f"Found similar nodes: {[node['name'] for node in existing]}")
            else:
                # Create the node
                node_result = self.create_node(evaluation)
                print(f"Created node: {node_result}")
                
                # Create relationships if available
                if node_result and 'relationships' in evaluation and evaluation['relationships']:
                    relationships_result = self.create_relationships(
                        node_result['id'], 
                        evaluation['relationships']
                    )
                    print(f"Created {len(relationships_result)} relationships")
        
        total_time = time.perf_counter() - start_total
        print(f"Inference={ai_time:.4f}s, Total={total_time:.4f}s")
        
        return {
            "filename": filename,
            "evaluation": evaluation,
            "node_result": node_result,
            "relationships": relationships_result,
            "processing_time": total_time
        }
        
    def save_categorized_file(self, filename: str, content: Dict[str, Any], 
                             evaluation: Dict[str, Any]) -> None:
        """Save the file to the appropriate category folder with evaluation data"""
        # Determine destination path
        if not evaluation.get('shouldAdd', False):
            dest_folder = CATEGORY_PATHS['REJECTED']
        elif evaluation.get('confidenceScore', 0) < MIN_CONFIDENCE_THRESHOLD:
            dest_folder = CATEGORY_PATHS['REVIEW']
        else:
            subtype = evaluation.get('nodeSubtype', '').upper()
            dest_folder = CATEGORY_PATHS.get(subtype, CATEGORY_PATHS['REVIEW'])
        
        # Create an enhanced file with evaluation data
        enhanced_content = {
            **content,
            "atlas_evaluation": evaluation
        }
        
        # Write to destination
        dest_path = os.path.join(dest_folder, filename)
        with open(dest_path, 'w') as f:
            json.dump(enhanced_content, f, indent=2)
            
        print(f"Saved to {dest_path}")
        
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
            
    def generate_report(self, results: List[Dict[str, Any]]):
        """Generate a summary report of processing results"""
        total_files = len(results)
        added_nodes = sum(1 for r in results if r.get('node_result') is not None)
        rejected = sum(1 for r in results 
                     if not r.get('evaluation', {}).get('shouldAdd', False))
        review_needed = sum(1 for r in results 
                          if r.get('evaluation', {}).get('shouldAdd', False) 
                          and r.get('evaluation', {}).get('confidenceScore', 0) < MIN_CONFIDENCE_THRESHOLD)
        
        # Count by subtype
        subtypes = {}
        for r in results:
            subtype = r.get('evaluation', {}).get('nodeSubtype')
            if subtype:
                subtypes[subtype] = subtypes.get(subtype, 0) + 1
        
        # Write report
        report = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_files_processed": total_files,
            "nodes_added": added_nodes,
            "rejected": rejected,
            "review_needed": review_needed,
            "subtypes": subtypes,
            "average_confidence": sum(r.get('evaluation', {}).get('confidenceScore', 0) 
                                   for r in results) / total_files if total_files else 0,
            "total_relationships_created": sum(len(r.get('relationships', [])) for r in results)
        }
        
        with open("processing_report.json", "w") as f:
            json.dump(report, f, indent=2)
            
        print("\n=== PROCESSING SUMMARY ===")
        print(f"Total files processed: {total_files}")
        print(f"Nodes added to database: {added_nodes}")
        print(f"Files rejected: {rejected}")
        print(f"Files needing review: {review_needed}")
        print(f"Node subtypes: {subtypes}")
        print(f"Total relationships created: {report['total_relationships_created']}")
        print(f"Report saved to processing_report.json")

if __name__ == '__main__':
    admin = AtlasOfUsGraphAdmin(URI, AUTH)
    try:
        admin.process_all_files()
    finally:
        admin.close()