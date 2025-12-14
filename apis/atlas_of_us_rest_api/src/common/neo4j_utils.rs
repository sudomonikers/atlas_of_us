use serde_json::{Value, json};
use neo4rs::{BoltNull, BoltType};

// Helper function to convert serde_json::Value to BoltType (infallible)
pub fn json_value_to_bolt_type(value: &Value) -> BoltType {
    match value {
        Value::Null => BoltType::Null(BoltNull),
        Value::Bool(b) => BoltType::from(*b),
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                BoltType::from(i)
            } else if let Some(f) = n.as_f64() {
                BoltType::from(f)
            } else {
                BoltType::from(n.to_string().as_str())
            }
        }
        Value::String(s) => BoltType::from(s.as_str()),
        Value::Array(arr) => {
            let bolt_values: Vec<BoltType> = arr
                .iter()
                .map(json_value_to_bolt_type)
                .collect();
            BoltType::from(bolt_values)
        }
        Value::Object(_) => {
            BoltType::from(value.to_string().as_str())
        }
    }
}

/// Maps neo4rs node data from Bolt4 to Bolt5 format
pub fn map_bolt4_to_bolt5_node(node_data: &Value) -> Value {
    if let Some(obj) = node_data.as_object() {
        let id = obj.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
        let element_id = obj.get("elementId").and_then(|v| v.as_str()).unwrap_or("");
        let labels = obj.get("labels").and_then(|v| v.as_array()).cloned().unwrap_or_default();
        
        let props = if let Some(nested_props) = obj.get("props") {
            nested_props.clone()
        } else {
            let mut props_map = serde_json::Map::new();
            for (key, value) in obj {
                if !matches!(key.as_str(), "id" | "elementId" | "labels") {
                    props_map.insert(key.clone(), value.clone());
                }
            }
            json!(props_map)
        };

        json!({
            "Id": id,
            "ElementId": element_id,
            "Labels": labels,
            "Props": props
        })
    } else {
        node_data.clone()
    }
}

pub fn map_bolt4_to_bolt5_relationship(rel_data: &Value) -> Value {
    if let Some(obj) = rel_data.as_object() {
        let id = obj.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
        let element_id = obj.get("elementId").and_then(|v| v.as_str()).unwrap_or("");
        let start_id = obj.get("startId").and_then(|v| v.as_i64()).unwrap_or(0);
        let start_element_id = obj.get("startElementId").and_then(|v| v.as_str()).unwrap_or("");
        let end_id = obj.get("endId").and_then(|v| v.as_i64()).unwrap_or(0);
        let end_element_id = obj.get("endElementId").and_then(|v| v.as_str()).unwrap_or("");
        let rel_type = obj.get("type").and_then(|v| v.as_str()).unwrap_or("");
        
        let props = if let Some(nested_props) = obj.get("props") {
            nested_props.clone()
        } else {
            let mut props_map = serde_json::Map::new();
            for (key, value) in obj {
                if !matches!(key.as_str(), "id" | "elementId" | "startId" | "startElementId" | "endId" | "endElementId" | "type") {
                    props_map.insert(key.clone(), value.clone());
                }
            }
            json!(props_map)
        };

        json!({
            "Id": id,
            "ElementId": element_id,
            "StartId": start_id,
            "StartElementId": start_element_id,
            "EndId": end_id,
            "EndElementId": end_element_id,
            "Type": rel_type,
            "Props": props
        })
    } else {
        rel_data.clone()
    }
}

/// Maps the entire query result from Bolt4 to Bolt5 format with Values and Keys structure
/// Handles both complex queries (with node/relationships/affiliatedNodes) and simple arrays
pub fn map_bolt4_to_bolt5(data: Vec<Value>) -> Value {
    if data.is_empty() {
        return json!([]);
    }

    // Check if this is a complex query result (has node/relationships/affiliatedNodes structure)
    let is_complex = data.first()
        .and_then(|item| item.as_object())
        .map(|obj| obj.contains_key("node") || obj.contains_key("relationships") || obj.contains_key("affiliatedNodes"))
        .unwrap_or(false);

    if is_complex {
        let mut bolt5_results = Vec::new();

        for node_result in data {
            if let Some(obj) = node_result.as_object() {
                let mut values = Vec::new();
                
                if let Some(node) = obj.get("node") {
                    values.push(map_bolt4_to_bolt5_node(node));
                }
                
                if let Some(relationships) = obj.get("relationships") {
                    if let Some(rel_array) = relationships.as_array() {
                        let mapped_rels: Vec<Value> = rel_array.iter()
                            .map(map_bolt4_to_bolt5_relationship)
                            .collect();
                        values.push(json!(mapped_rels));
                    } else {
                        values.push(json!([]));
                    }
                }
                
                if let Some(affiliated_nodes) = obj.get("affiliatedNodes") {
                    if let Some(nodes_array) = affiliated_nodes.as_array() {
                        let mapped_nodes: Vec<Value> = nodes_array.iter()
                            .map(map_bolt4_to_bolt5_node)
                            .collect();
                        values.push(json!(mapped_nodes));
                    } else {
                        values.push(json!([]));
                    }
                }

                bolt5_results.push(json!({
                    "Values": values,
                    "Keys": ["node", "relationships", "affiliatedNodes"]
                }));
            }
        }

        json!(bolt5_results)
    } else {
        let first_item = &data[0];
        
        if let Some(obj) = first_item.as_object() {
            let is_relationship = obj.contains_key("startId") || obj.contains_key("type") || obj.contains_key("Type");
            
            if is_relationship {
                let mapped_rels: Vec<Value> = data.iter().map(map_bolt4_to_bolt5_relationship).collect();
                json!(mapped_rels)
            } else {
                let mapped_nodes: Vec<Value> = data.iter().map(map_bolt4_to_bolt5_node).collect();
                json!(mapped_nodes)
            }
        } else {
            // Fallback: return as-is
            json!(data)
        }
    }
}