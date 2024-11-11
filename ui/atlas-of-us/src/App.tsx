import './App.css'
import { Canvas } from "@react-three/fiber";
import { useEffect } from 'react';
import axios from 'axios';

export default function App() {

  useEffect(() => {
    axios.get('http://localhost:8001/api/v1/kg/match-node/Individual Possibilities/3')
      .then(response => {
        console.log(response.data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
    }, []); 

  return (
    <Canvas>
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshPhongMaterial />
      </mesh>
      <ambientLight intensity={0.1} />
      <directionalLight position={[0, 0, 5]} color="red" />
    </Canvas>
  )
}
