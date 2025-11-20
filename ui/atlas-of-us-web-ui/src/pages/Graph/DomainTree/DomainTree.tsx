import { useEffect, useState, useRef, useMemo } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { HttpService } from "../../../services/http-service";
import type { DomainData, KnowledgeRequirement, SkillRequirement, TraitRequirement, MilestoneRequirement } from "./domain-interfaces";
import "./DomainTree.css";

interface DomainTreeProps {
  domainName: string;
  position?: THREE.Vector3;
}

interface SkillTreeNode {
  id: string;
  name: string;
  type: 'knowledge' | 'skill' | 'trait' | 'milestone';
  level: number;
  data: KnowledgeRequirement | SkillRequirement | TraitRequirement | MilestoneRequirement;
  position: THREE.Vector3;
}

export function DomainTree({ domainName, position = new THREE.Vector3(0, 0, 0) }: DomainTreeProps) {
  const [domainData, setDomainData] = useState<DomainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<SkillTreeNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const httpService = new HttpService();
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const loadDomain = async () => {
      setLoading(true);
      const data = await httpService.fetchDomain(domainName);
      console.log("Domain data loaded:", data);
      if (data) {
        setDomainData(data);
      }
      setLoading(false);
    };

    loadDomain();
  }, [domainName]);

  // Memoize all nodes calculation to avoid rebuilding on every render
  const allNodes = useMemo(() => {
    if (!domainData) return [];

    const nodes: SkillTreeNode[] = [];
    const levels = domainData.levels;

    levels.forEach((levelData, levelIndex) => {
      const levelY = levelIndex * 150 - 300;
      const radius = 180;

      const levelNodes: Array<{name: string, type: 'knowledge' | 'skill' | 'trait' | 'milestone', data: any}> = [];

      levelData.knowledge.forEach(k => levelNodes.push({name: k.node.name, type: 'knowledge', data: k}));
      levelData.skills.forEach(s => levelNodes.push({name: s.node.name, type: 'skill', data: s}));
      levelData.traits.forEach(t => levelNodes.push({name: t.node.name, type: 'trait', data: t}));
      levelData.milestones.forEach(m => levelNodes.push({name: m.node.name, type: 'milestone', data: m}));

      levelNodes.forEach((node, index) => {
        const angle = (index / levelNodes.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        nodes.push({
          id: `${levelData.level.level}-${node.type}-${index}`,
          name: node.name,
          type: node.type,
          level: levelData.level.level,
          data: node.data,
          position: new THREE.Vector3(x, levelY, z)
        });
      });
    });

    return nodes;
  }, [domainData]);

  // Pre-compute shared geometries (memoized)
  const geometries = useMemo(() => ({
    sphere: new THREE.SphereGeometry(1, 12, 12), // Low-poly sphere (scaled per node)
    cylinder: new THREE.CylinderGeometry(0.3, 0.3, 1, 6),
    levelMarker: new THREE.CylinderGeometry(8, 8, 3, 6),
    levelConnector: new THREE.CylinderGeometry(0.5, 0.5, 150, 6),
  }), []);

  // Pre-compute shared materials by type
  const materials = useMemo(() => ({
    knowledge: new THREE.MeshStandardMaterial({
      color: "#9333ea",
      emissive: "#c084fc",
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    }),
    skill: new THREE.MeshStandardMaterial({
      color: "#3b82f6",
      emissive: "#60a5fa",
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    }),
    trait: new THREE.MeshStandardMaterial({
      color: "#10b981",
      emissive: "#34d399",
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    }),
    milestone: new THREE.MeshStandardMaterial({
      color: "#f59e0b",
      emissive: "#fbbf24",
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    }),
    levelMarker: new THREE.MeshStandardMaterial({
      color: "#4b5563",
      emissive: "#6b7280",
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
    }),
    connector: new THREE.MeshStandardMaterial({
      color: "#4b5563",
      emissive: "#6b7280",
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.4,
    }),
  }), []);

  if (loading || !domainData) {
    return null;
  }

  const levels = domainData.levels;

  // Helper function to get node icon emoji
  const getNodeIcon = (type: string) => {
    switch(type) {
      case 'knowledge': return '📚';
      case 'skill': return '⚡';
      case 'trait': return '✨';
      case 'milestone': return '🏆';
      default: return '•';
    }
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Domain title at top */}
      <Html position={[0, 400, 0]} center>
        <div className="skill-tree-domain-title">
          <h2>{domainData.domain.name}</h2>
          <p>Skill Constellation</p>
        </div>
      </Html>

      {/* Render level markers */}
      {levels.map((levelData, index) => {
        const levelY = index * 150 - 300;

        return (
          <group key={`level-${index}`}>
            {/* Central level pillar/marker */}
            <mesh position={[0, levelY, 0]} geometry={geometries.levelMarker} material={materials.levelMarker} />

            {/* Level label */}
            <Html position={[0, levelY, 0]} center>
              <div className="skill-tree-level-marker">
                <div className="level-number">{levelData.level.level}</div>
                <div className="level-name">{levelData.level.name}</div>
              </div>
            </Html>

            {/* Connection to next level */}
            {index < levels.length - 1 && (
              <mesh position={[0, levelY + 75, 0]} geometry={geometries.levelConnector} material={materials.connector} />
            )}
          </group>
        );
      })}

      {/* Render individual skill tree nodes */}
      {allNodes.map((node) => {
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode === node.id;
        const nodeSize = isSelected ? 8 : isHovered ? 7 : 6;
        const material = materials[node.type];

        return (
          <group key={node.id} position={node.position}>
            {/* Node sphere - using shared geometry, scaled */}
            <mesh
              scale={[nodeSize, nodeSize, nodeSize]}
              geometry={geometries.sphere}
              material={material}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNode(isSelected ? null : node);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredNode(node.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredNode(null);
                document.body.style.cursor = 'default';
              }}
            />

            {/* Node label - only render when hovered or selected */}
            {(isSelected || isHovered) && (
              <Html position={[0, nodeSize + 8, 0]} center>
                <div className={`skill-node-label ${node.type}`}>
                  <span className="node-icon">{getNodeIcon(node.type)}</span>
                  <span className="node-name">{node.name}</span>
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* Selected node detail panel */}
      {selectedNode && (
        <Html position={[300, 0, 0]} center>
          <div className="skill-node-details">
            <div className="detail-header">
              <span className="detail-icon">{getNodeIcon(selectedNode.type)}</span>
              <h3>{selectedNode.name}</h3>
              <button
                className="close-btn"
                onClick={() => setSelectedNode(null)}
              >×</button>
            </div>

            <div className="detail-type">
              <span className={`type-badge ${selectedNode.type}`}>
                {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)}
              </span>
              <span className="level-badge">Level {selectedNode.level}</span>
            </div>

            <div className="detail-content">
              {selectedNode.type === 'knowledge' && (
                <>
                  <p className="description">{(selectedNode.data as KnowledgeRequirement).node.description}</p>
                  <div className="requirement">
                    <strong>Required Level:</strong> {(selectedNode.data as KnowledgeRequirement).relationship.bloom_level}
                  </div>
                  {(selectedNode.data as KnowledgeRequirement).node.how_to_learn && (
                    <div className="how-to">
                      <strong>How to Learn:</strong>
                      <p>{(selectedNode.data as KnowledgeRequirement).node.how_to_learn}</p>
                    </div>
                  )}
                </>
              )}

              {selectedNode.type === 'skill' && (
                <>
                  <p className="description">{(selectedNode.data as SkillRequirement).node.description}</p>
                  <div className="requirement">
                    <strong>Required Level:</strong> {(selectedNode.data as SkillRequirement).relationship.dreyfus_level}
                  </div>
                  {(selectedNode.data as SkillRequirement).node.how_to_develop && (
                    <div className="how-to">
                      <strong>How to Develop:</strong>
                      <p>{(selectedNode.data as SkillRequirement).node.how_to_develop}</p>
                    </div>
                  )}
                </>
              )}

              {selectedNode.type === 'trait' && (
                <>
                  <p className="description">{(selectedNode.data as TraitRequirement).node.description}</p>
                  <div className="requirement">
                    <strong>Minimum Score:</strong> {(selectedNode.data as TraitRequirement).relationship.min_score}
                  </div>
                  {(selectedNode.data as TraitRequirement).node.measurement_criteria && (
                    <div className="how-to">
                      <strong>Measurement:</strong>
                      <p>{(selectedNode.data as TraitRequirement).node.measurement_criteria}</p>
                    </div>
                  )}
                </>
              )}

              {selectedNode.type === 'milestone' && (
                <>
                  <p className="description">{(selectedNode.data as MilestoneRequirement).node.description}</p>
                  {(selectedNode.data as MilestoneRequirement).node.how_to_achieve && (
                    <div className="how-to">
                      <strong>How to Achieve:</strong>
                      <p>{(selectedNode.data as MilestoneRequirement).node.how_to_achieve}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Html>
      )}

      {/* Legend */}
      <Html position={[-350, -250, 0]}>
        <div className="skill-tree-legend">
          <h4>Node Types</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-dot knowledge">📚</span>
              <span>Knowledge</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot skill">⚡</span>
              <span>Skills</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot trait">✨</span>
              <span>Traits</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot milestone">🏆</span>
              <span>Milestones</span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}
