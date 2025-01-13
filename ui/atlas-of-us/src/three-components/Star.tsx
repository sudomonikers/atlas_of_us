import React from 'react';
import { MeshProps } from '@react-three/fiber';
import { Line, LineProps } from '@react-three/drei';
import { Html } from '@react-three/drei';
import { Neo4JObject } from '../shared/interfaces/Neo4J.interface';

// Context to manage global hover and active state
export const StarNetworkContext = React.createContext<{
  hoveredStars: Set<string>;
  activeStars: Set<string>;
  setHoveredStar: (id: string, isHovered: boolean) => void;
  toggleActiveStar: (id: string) => void;
}>({
  hoveredStars: new Set(),
  activeStars: new Set(),
  setHoveredStar: () => {},
  toggleActiveStar: () => {}
});

export const StarNetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hoveredStars, setHoveredStars] = React.useState<Set<string>>(new Set());
  const [activeStars, setActiveStars] = React.useState<Set<string>>(new Set());

  const setHoveredStar = (id: string, isHovered: boolean) => {
    setHoveredStars(prev => {
      const updated = new Set(prev);
      isHovered ? updated.add(id) : updated.delete(id);
      return updated;
    });
  };

  const toggleActiveStar = (id: string) => {
    setActiveStars(prev => {
      const updated = new Set(prev);
      updated.has(id) ? updated.delete(id) : updated.add(id);
      return updated;
    });
  };

  return (
    <StarNetworkContext.Provider value={{ hoveredStars, activeStars, setHoveredStar, toggleActiveStar }}>
      {children}
    </StarNetworkContext.Provider>
  );
};

export const Star: React.FC<MeshProps & { node: Neo4JObject }> = ({ 
  node, 
  ...props 
}) => {
  const { hoveredStars, activeStars, setHoveredStar, toggleActiveStar } = React.useContext(StarNetworkContext);
  const isHovered = hoveredStars.has(node.ElementId);
  const isActive = activeStars.has(node.ElementId);

  const isTangentiallyActive = React.useMemo(() => hoveredStars.has(node.ElementId) || activeStars.has(node.ElementId), [hoveredStars, activeStars, node.ElementId]);

  return (
    <mesh 
      {...props}
      onPointerOver={() => setHoveredStar(node.ElementId, true)}
      onPointerOut={() => setHoveredStar(node.ElementId, false)}
      onClick={() => toggleActiveStar(node.ElementId)}
    >
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial 
        color={isHovered || isActive || isTangentiallyActive ? 'hotpink' : 'orange'} 
      />
      {(isHovered || isActive || isTangentiallyActive) && (
        <Html 
          position={[0, 1, 0]} 
          style={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            whiteSpace: 'nowrap',
            transform: 'scale(0.5)',
            transformOrigin: 'top left'
          }}
        >
          {node.Props.name}
        </Html>
      )}
    </mesh>
  );
};

export const StarRelationship: React.FC<LineProps & { fromId: string; toId: string }> = ({ 
  fromId, 
  toId, 
  ...lineProps 
}) => {
  const { hoveredStars, activeStars } = React.useContext(StarNetworkContext);

  const isHighlighted = React.useMemo(() => 
    hoveredStars.has(fromId) || hoveredStars.has(toId) || activeStars.has(fromId) || activeStars.has(toId), 
    [hoveredStars, activeStars, fromId, toId]
  );

  return (
    <>
      {isHighlighted && (
        <Line
          {...lineProps}
          color='yellow'
          lineWidth={3}
          dashed={false}
        />
      )}
    </>
  );
};