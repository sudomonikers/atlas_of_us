import React from 'react';
import { MeshProps } from '@react-three/fiber';
import { Line, LineProps } from '@react-three/drei';
import { Html } from '@react-three/drei';
import { Neo4JObject } from '../shared/interfaces/Neo4J.interface';

// Context to manage global hover state
export const StarNetworkContext = React.createContext<{
  hoveredStars: Set<number>;
  setHoveredStar: (id: number, isHovered: boolean) => void;
}>({
  hoveredStars: new Set(),
  setHoveredStar: () => {}
});

export const StarNetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hoveredStars, setHoveredStars] = React.useState<Set<number>>(new Set());

  const setHoveredStar = (id: number, isHovered: boolean) => {
    setHoveredStars(prev => {
      const updated = new Set(prev);
      isHovered ? updated.add(id) : updated.delete(id);
      return updated;
    });
  };

  return (
    <StarNetworkContext.Provider value={{ hoveredStars, setHoveredStar }}>
      {children}
    </StarNetworkContext.Provider>
  );
};

export const Star: React.FC<MeshProps & { node: Neo4JObject }> = ({ 
  node, 
  ...props 
}) => {
  const { hoveredStars, setHoveredStar } = React.useContext(StarNetworkContext);
  const isHovered = hoveredStars.has(node.Id);

  return (
    <mesh 
      {...props}
      onPointerOver={() => setHoveredStar(node.Id, true)}
      onPointerOut={() => setHoveredStar(node.Id, false)}
    >
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial 
        color={isHovered ? 'hotpink' : 'orange'} 
      />
      {isHovered && (
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

export const StarRelationship: React.FC<LineProps & { fromId: number; toId: number }> = ({ 
  fromId, 
  toId, 
  ...lineProps 
}) => {
  const { hoveredStars } = React.useContext(StarNetworkContext);

  const isHighlighted = React.useMemo(() => 
    hoveredStars.has(fromId) || hoveredStars.has(toId), 
    [hoveredStars, fromId, toId]
  );

  return (
    <Line
      {...lineProps}
      color={isHighlighted ? 'yellow' : 'cyan'}
      lineWidth={isHighlighted ? 3 : 2}
      dashed={false}
    />
  );
};