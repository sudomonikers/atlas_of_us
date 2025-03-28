import React, { useMemo } from 'react';
import { Object3D, Vector3 } from "three";
import { Line } from '@react-three/drei';
import { Neo4jRelationship } from "../../graph-interfaces.interface";

interface RelationshipProps {
  startNode: Object3D;
  endNode: Object3D;
  relationshipData: Neo4jRelationship;
}

export const RelationshipLine: React.FC<RelationshipProps> = ({
  startNode,
  endNode,
  relationshipData
}) => {
  // Calculate line points using the world positions of start and end nodes
  const linePoints = useMemo(() => {
    // Get world positions of start and end nodes
    const startPosition = startNode.getWorldPosition(new Vector3());
    const endPosition = endNode.getWorldPosition(new Vector3());
    
    // Return an array of points for the line
    return [
        startPosition,
        endPosition
    ];
  }, [startNode, endNode]);

  return (
    <Line
      points={linePoints}
      color="white"  // Default color, can be customized based on relationshipData
      lineWidth={10} // Adjust line thickness as needed
      dashed={false} // Set to true for dashed line if desired
    />
  );
};