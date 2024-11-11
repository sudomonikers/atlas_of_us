import './App.css'
import React, { useEffect, useState } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from '@react-three/drei';

import axios from 'axios';

import Star from './three-components/Star';
import { NodeAndDescendants } from './shared/interfaces/NetworkResponse.interface';


export default function App() {
  const [data, setData] = useState<NodeAndDescendants | null>(null);

  useEffect(() => {
    axios.get<NodeAndDescendants[]>('http://localhost:8001/api/v1/kg/match-node/Individual Possibilities/3')
      .then(response => {
        setData(response.data[0]);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
    }, []); 

  return (
    <Canvas style={{ height: '100vh', width: '100vw' }}>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls />
      {data ? (
        data.Values[2].map((item, index) => (
          <Star 
            key={index} 
            position={[index * 2 - 5, Math.sin(index) * 5, Math.cos(index) * 5]} 
          />
        ))
      ) : (
        <Star position={[0, 0, 0]} /> // Render a single star if data is empty
      )}
    </Canvas>
  )
}
