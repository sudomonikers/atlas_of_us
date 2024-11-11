import React from 'react';
import { MeshProps } from '@react-three/fiber';

const Star: React.FC<MeshProps> = (props) => {
  console.log(props);
  return (
    <mesh {...props}>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color={'yellow'} />
    </mesh>
  );
};

export default Star;
