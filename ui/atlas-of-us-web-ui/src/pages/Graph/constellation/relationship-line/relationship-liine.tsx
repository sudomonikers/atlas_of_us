import "./relationship-line.css";
import React, { useMemo, useRef, useState } from "react";
import { Object3D, Vector3 } from "three";
import { Html, Line } from "@react-three/drei";
import { Neo4jRelationship } from "../../graph-interfaces.interface";
import { Line2 } from "three-stdlib";

interface RelationshipProps {
  startNode: Object3D;
  endNode: Object3D;
  relationshipData: Neo4jRelationship;
}

export const RelationshipLine: React.FC<RelationshipProps> = ({
  startNode,
  endNode,
  relationshipData,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const lineRef = useRef<Line2>(null);

  const clickHandler = () => {
    setIsActive(!isActive);
  };

  const linePoints = useMemo(() => {
    // Get world positions of start and end nodes
    const startPosition = startNode.getWorldPosition(new Vector3());
    
    const endPosition = endNode ? endNode.getWorldPosition(new Vector3()) : new Vector3(0,0,0); //this or condition needs to be updated to shoot off into the void...
    const midPoint = new Vector3().addVectors(startPosition, endPosition).multiplyScalar(0.5);

    // Return an array of points for the line
    return [startPosition, endPosition, midPoint];
  }, [startNode, endNode]);

  let color;
  switch (relationshipData.type) {
    case "BUILDS":
      color = "blue";
      break;
    case "REQUIRES":
      color = "red";
      break;
    default:
      color = "white";
      break;
  }

  return (
    <Line
      ref={lineRef}
      points={[linePoints[0], linePoints[1]]}
      color={color}
      lineWidth={isActive || isHovered ? 3 : 2}
      userData={relationshipData}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
      onClick={clickHandler}
    >
      {(isHovered || isActive) && relationshipData && (
        <Html position={linePoints[2]}>
          <div className="info-box">
            <div className="info-box-header">{relationshipData.type}</div>
          </div>
        </Html>
      )}
    </Line>
  );
};
