from neo4j import GraphDatabase, RoutingControl
import os
import json
import shutil
import time
import boto3
from botocore.exceptions import ClientError
from typing import Dict, List, Optional, Any, Tuple
import requests
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv
load_dotenv()

# Read variables from the .env file
#neo4j
URI = os.getenv("NEO4J_URI", "neo4j://localhost:7687")
USER = os.getenv("NEO4J_USER", "neo4j")
PASSWORD = os.getenv("NEO4J_PASSWORD", "password")
AUTH = (USER, PASSWORD)
#pinecone
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX = os.getenv("PINECONE_INDEX", "atlas-of-us-nodes")
SIMILARITY_THRESHOLD=0.7
#llm
INFERENCE_ENDPOINT = os.getenv("INFERENCE_ENDPOINT")
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

class AtlasOfUsGraphAdmin:
    #TODO: init passes the eye test, needs to actually run to determine errors though
    def __init__(self, uri, auth):
        #neo4j initialization
        self.driver = GraphDatabase.driver(uri, auth=auth)

        #pinecone initialization
        pc = Pinecone(api_key=PINECONE_API_KEY)
        if not pc.has_index(PINECONE_INDEX):
            print(f"Creating Pinecone index: {PINECONE_INDEX}")
            pc.create_index(
                name=PINECONE_INDEX,
                dimension=1024,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1"
                ) 
            )
            while not pc.describe_index(PINECONE_INDEX).status['ready']:
                time.sleep(1)
        self.pinecone_index = pc.Index(PINECONE_INDEX)

        #s3 initialization
        self.s3 = boto3.client('s3')
        
            
        # Load system prompts
        with open("system_prompt.txt", "r") as f:
            self.system_message = f.read()

    #TODO: close passes the eye test, needs to actually run to determine errors though
    def close(self):
        self.driver.close()
        
    def run_inference(self, data: Dict[str, Any], conversation_history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """Run inference on the LLM to classify the content"""
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
            "content": f"Title: {data['title']}\nExcerpt: {data['text'][:500]}...\n\nEvaluate this Wikipedia content according to the Atlas Of Us schema."
        })
        
        payload = {
            "model": "Qwen",
            "messages": messages,
            "function_call": {
                "name": "evaluateWikipediaContent"
            },
            "functions": [
                # Function definition remains the same
            ]
        }
        
        response = requests.post(INFERENCE_ENDPOINT, json=payload)
        response.raise_for_status()
        return response.json()

    #TODO: actually create the functions in the function call
    def confirm_similarity_with_llm(self, node1: Dict[str, Any], node2: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use the LLM to confirm if two nodes are actually similar or different
        """
        node1_text = f"{node1.get('name')}: {node1.get('definition', '')} {node1.get('description', '')}"
        node2_text = f"{node2.get('name')}: {node2.get('definition', '')} {node2.get('description', '')}"
        
        payload = {
            "model": "Qwen",
            "messages": [
                {
                    "role": "system",
                    "content": "You are an AI assistant helping to determine if two knowledge graph nodes represent the same concept or different concepts."
                },
                {
                    "role": "user",
                    "content": f"Compare these two potential knowledge graph nodes and determine if they represent the same concept or different concepts:\n\nNode 1: {node1_text}\n\nNode 2: {node2_text}\n\nAre these the same concept or different concepts?"
                }
            ],
            "function_call": {
                "name": "evaluateSimilarity"
            },
            "functions": [
                {
                    "name": "evaluateSimilarity",
                    "description": "Evaluate if two nodes represent the same concept",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "areSimilar": {
                                "type": "boolean",
                                "description": "Whether the nodes represent the same concept"
                            },
                            "similarityScore": {
                                "type": "number",
                                "minimum": 0,
                                "maximum": 1,
                                "description": "Confidence in the similarity assessment"
                            },
                            "reasoning": {
                                "type": "string",
                                "description": "Explanation for this assessment"
                            }
                        },
                        "required": ["areSimilar", "similarityScore", "reasoning"]
                    }
                }
            ]
        }
        
        response = requests.post(INFERENCE_ENDPOINT, json=payload)
        response.raise_for_status()
        
        # Extract function call response
        result = response.json()
        try:
            function_call = result.get('choices', [{}])[0].get('message', {}).get('function_call', {})
            
            if function_call and 'arguments' in function_call:
                return json.loads(function_call['arguments'])
            else:
                # Fallback
                return {
                    "areSimilar": False,
                    "similarityScore": 0.5,
                    "reasoning": "Unable to determine similarity due to API response format."
                }
        except Exception as e:
            print(f"Error parsing similarity confirmation: {e}")
            return {
                "areSimilar": False,
                "similarityScore": 0.5,
                "reasoning": f"Error processing: {str(e)}"
            }
    
    #TODO: need to create the self.get_embedding method
    def check_existing_nodes(self, name: str, node_type: Optional[str] = None, description: Optional[str] = None) -> Dict[str, Any]:
        """
        Check if similar nodes already exist using both Pinecone and Neo4j
        Returns a dictionary with:
        - vector_matches: Semantic matches from Pinecone
        - neo4j_matches: Exact/substring matches from Neo4j
        - combined_matches: Merged and deduplicated results
        """
        results = {
            "vector_matches": [],
            "neo4j_matches": [],
            "combined_matches": []
        }
        
        # Part 1: Check Pinecone for semantic similarity
        if description:
            search_text = f"{name}: {description}"
        else:
            search_text = name
            
        # Get embedding for the search text
        embedding = self.get_embedding(search_text)
        
        # Query Pinecone
        try:
            vector_query_result = self.pinecone_index.query(
                vector=embedding,
                top_k=5,
                include_metadata=True,
                filter={"node_type": node_type} if node_type else {}
            )
            
            # Process Pinecone results
            for match in vector_query_result.get("matches", []):
                if match.get("score", 0) >= SIMILARITY_THRESHOLD:
                    metadata = match.get("metadata", {})
                    vector_match = {
                        "name": metadata.get("name", "Unknown"),
                        "id": metadata.get("neo4j_id"),
                        "labels": metadata.get("labels", []),
                        "similarity_score": match.get("score", 0),
                        "definition": metadata.get("definition", ""),
                        "description": metadata.get("description", "")
                    }
                    results["vector_matches"].append(vector_match)
        except Exception as e:
            print(f"Error querying Pinecone: {e}")
        
        # Part 2: Check Neo4j for exact/substring name matches
        query = (
            "MATCH (n) "
            "WHERE toLower(n.name) CONTAINS toLower($name) "
        )
        
        if node_type:
            query += f"AND n:{node_type} "
            
        query += "RETURN n.name as name, labels(n) as labels, id(n) as id, " \
                "n.definition as definition, n.description as description LIMIT 5"
        
        with self.driver.session() as session:
            result = session.run(query, name=name)
            neo4j_matches = [dict(record) for record in result]
            results["neo4j_matches"] = neo4j_matches
        
        # Combine and deduplicate results
        seen_ids = set()
        for match in results["vector_matches"] + neo4j_matches:
            node_id = match.get("id")
            if node_id and node_id not in seen_ids:
                seen_ids.add(node_id)
                match["source"] = "pinecone" if match in results["vector_matches"] else "neo4j"
                results["combined_matches"].append(match)
        
        llm_verified_matches = []
        for match in results["combined_matches"]:
            # Only verify nodes above a certain threshold or from vector search
            if match.get("source") == "pinecone" or match.get("similarity_score", 0) > 0.7:
                node1 = {
                    "name": name,
                    "definition": "",
                    "description": description or ""
                }
                
                similarity_confirmation = self.confirm_similarity_with_llm(node1, match)
                match["llm_verified"] = similarity_confirmation.get("areSimilar", False)
                match["llm_confidence"] = similarity_confirmation.get("similarityScore", 0)
                match["llm_reasoning"] = similarity_confirmation.get("reasoning", "")
                
                if similarity_confirmation.get("areSimilar", False):
                    llm_verified_matches.append(match)

        results["llm_verified_matches"] = llm_verified_matches

        return results
    
    #this just needs full human rewrite for what we want to do
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
            node_id = record["id"]
            node_name = record["name"]
            node_properties = dict(record["n"])
            
        # Create embedding for the new node
        node_text = f"{node_name}: {node_properties.get('definition', '')} {node_properties.get('description', '')}"
        embedding = self.get_embedding(node_text)
        
        # Store in Pinecone
        try:
            self.pinecone_index.upsert(
                vectors=[
                    {
                        "id": f"node_{node_id}",
                        "values": embedding,
                        "metadata": {
                            "neo4j_id": node_id,
                            "name": node_name,
                            "labels": labels,
                            "node_type": node_subtype,
                            "definition": node_properties.get("definition", ""),
                            "description": node_properties.get("description", ""),
                            "created_at": time.time()
                        }
                    }
                ]
            )
            print(f"Added node embedding to Pinecone: {node_name}")
        except Exception as e:
            print(f"Error adding to Pinecone: {e}")
            
        return {
            "id": node_id, 
            "name": node_name, 
            "labels": labels,
            "properties": node_properties
        }
    
    def create_relationships(self, node_id: int, relationships: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create relationships between nodes"""
        results = []
        missing_targets = []
        
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
                            "target": target_id,
                            "target_name": target_name
                        })
                else:
                    # Target doesn't exist - record this for potential follow-up action
                    missing_targets.append({
                        "target_name": target_name,
                        "relationship_type": rel_type,
                        "relationship_properties": rel_props
                    })
                    
                    print(f"Target node '{target_name}' doesn't exist. Relationship couldn't be created.")
        
        return {
            "created_relationships": results,
            "missing_targets": missing_targets
        }
    
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
            
            # Get a description for similarity search
            description = (evaluation['properties'].get('definition', '') or 
                        evaluation['properties'].get('description', '') or 
                        file_content.get('text', '')[:500])
            
            # Enhanced similarity check using both Neo4j and Pinecone
            similarity_results = self.check_existing_nodes(
                evaluation['properties']['name'],
                evaluation.get('nodeSubtype'),
                description
            )
            
            combined_matches = similarity_results.get('combined_matches', [])
            
            if combined_matches:
                print(f"Found similar nodes:")
                for i, node in enumerate(combined_matches, 1):
                    print(f"  {i}. {node['name']} (via {node.get('source', 'unknown')}, " +
                        f"similarity: {node.get('similarity_score', 'N/A')})")
                        
                # If high similarity matches found, we might want to skip creation
                high_similarity = any(node.get('similarity_score', 0) > 0.92 for node in combined_matches)
                
                if high_similarity:
                    print("High similarity match found - marking for review instead of creating duplicate")
                    # Update the file in the review folder with similarity info
                    evaluation['similarNodes'] = combined_matches
                    evaluation['shouldAdd'] = False
                    evaluation['reasoning'] += " Similar nodes already exist in the database."
                    
                    # Re-save the categorized file with updated evaluation
                    self.save_categorized_file(filename, file_content, evaluation)
                    
                    total_time = time.perf_counter() - start_total
                    print(f"Inference={ai_time:.4f}s, Total={total_time:.4f}s")
                    
                    return {
                        "filename": filename,
                        "evaluation": evaluation,
                        "similarity_results": similarity_results,
                        "node_result": None,
                        "relationships": [],
                        "processing_time": total_time
                    }
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
            "similarity_results": similarity_results,
            "node_result": node_result,
            "relationships": relationships_result,
            "processing_time": total_time
        }
        
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
            
            # Count similarity results
            similarity_stats = {
                "total_similar_found": sum(1 for r in results if r.get('similarity_results', {}).get('combined_matches')),
                "neo4j_matches": sum(len(r.get('similarity_results', {}).get('neo4j_matches', [])) for r in results),
                "vector_matches": sum(len(r.get('similarity_results', {}).get('vector_matches', [])) for r in results),
            }
            
            # Write report
            report = {
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "total_files_processed": total_files,
                "nodes_added": added_nodes,
                "rejected": rejected,
                "review_needed": review_needed,
                "subtypes": subtypes,
                "similarity_stats": similarity_stats,
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
            print(f"Total relationships created: {report['total_relationships_created']}")
            print(f"Report saved to processing_report.json")

if __name__ == '__main__':
    admin = AtlasOfUsGraphAdmin(URI, AUTH)
    try:
        #admin.process_all_files() #we can run this when ready, for now process one file
        admin.process_file("1000001_NPU.json")
    finally:
        admin.close()