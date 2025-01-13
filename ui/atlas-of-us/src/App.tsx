import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import axios from 'axios';
import { NodeAndDescendants } from './shared/interfaces/NetworkResponse.interface';
import womanImage from './assets/woman.jpg';

// Image processing utility
const processImage = async (
  imageUrl: string,
  numPoints: number,
  threshold = 128
): Promise<Array<{ x: number; y: number; z: number }>> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const edgePixels = [];

      // Collect dark pixels
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          
          if (brightness < threshold) {
            edgePixels.push({ x, y });
          }
        }
      }

      // Select points based on desired number
      const step = Math.max(1, Math.floor(edgePixels.length / numPoints));
      const selectedPoints = [];
      
      for (let i = 0; i < edgePixels.length && selectedPoints.length < numPoints; i += step) {
        const randomOffset = Math.floor(Math.random() * step);
        const pixel = edgePixels[Math.min(i + randomOffset, edgePixels.length - 1)];
        selectedPoints.push(pixel);
      }

      // Normalize coordinates to THREE.js space
      const scale = 20;
      const aspectRatio = canvas.width / canvas.height;
      
      const normalizedPoints = selectedPoints.map(point => ({
          x: (point.x / canvas.width - 0.5) * scale * aspectRatio,
          y: -(point.y / canvas.height - 0.5) * scale,
          z: 0
      }));

      resolve(normalizedPoints);
    };
    img.src = imageUrl;
  });
};

// Star component
const Star = ({ position, name }: { position: [number, number, number]; name: string }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[hovered ? 0.3 : 0.2, 32, 32]} />
      <meshStandardMaterial
        color={hovered ? 0xccccff : 0xffffff}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};

// Line component
const Line = ({ start, end }: { start: [number, number, number]; end: [number, number, number] }) => {
  const points = [start, end].map(p => ({ x: p[0], y: p[1], z: p[2] }));
  
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={0x4444ff} transparent opacity={0.2} />
    </line>
  );
};

// Constellation component
const Constellation = ({ nodes }: { nodes: NodeAndDescendants[] }) => {
  const [starPositions, setStarPositions] = useState<Array<{ x: number; y: number; z: number }>>([]);
  const [lines, setLines] = useState<Array<{ start: [number, number, number]; end: [number, number, number] }>>([]);

  useEffect(() => {
    const loadImage = async () => {
      try {
        console.log('hello', nodes)
        const positions = await processImage(womanImage, nodes[0].Values[2].length, 128);
        console.log(positions)
        setStarPositions(positions);

        // Create lines between nearby stars
        const newLines = [];
        const maxDistance = 3;

        for (let i = 0; i < positions.length; i++) {
          for (let j = i + 1; j < positions.length; j++) {
            const dx = positions[i].x - positions[j].x;
            const dy = positions[i].y - positions[j].y;
            const dz = positions[i].z - positions[j].z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < maxDistance) {
              newLines.push({
                start: [positions[i].x, positions[i].y, positions[i].z] as [number, number, number],
                end: [positions[j].x, positions[j].y, positions[j].z] as [number, number, number]
              });
            }
          }
        }
        setLines(newLines);
      } catch (error) {
        console.error('Error processing image:', error);
      }
    };

    loadImage();
  }, [nodes]);

  return (
    <group>
      {starPositions.map((pos, index) => (
        <Star
          key={`star-${index}`}
          position={[pos.x, pos.y, pos.z]}//@ts-ignore
          name={nodes[index]?.name || `Star ${index}`}
        />
      ))}
      {/* {lines.map((line, index) => (
        <Line key={`line-${index}`} start={line.start} end={line.end} />
      ))} */}
    </group>
  );
};

// Main App component
export default function App() {
  const [nodes, setNodes] = useState<NodeAndDescendants[]>([]);

  useEffect(() => {
    axios
      .get<NodeAndDescendants[]>(
        'http://localhost:8001/api/v1/kg/match-node/Individual Possibilities/3',
      )
      .then((response) => {
        function extendArray<T>(arr: T[], targetLength: number): T[] {
          const originalLength = arr.length;
          if (originalLength === 0) return arr;
        
          while (arr.length < targetLength) {
            const itemsToAdd = Math.min(originalLength, targetLength - arr.length);
            arr.push(...arr.slice(0, itemsToAdd));
          }
        
          return arr;
        }

        response.data[0].Values[2] = extendArray(response.data[0].Values[2], 800)
        setNodes(response.data);
        console.log(response);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });
  }, []);

  return (
    <Canvas style={{ height: '100vh', width: '100vw' }}>
      <color attach="background" args={[0x000011]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <OrbitControls />
      {nodes.length > 0 && <Constellation nodes={nodes} />}
    </Canvas>
  );
}