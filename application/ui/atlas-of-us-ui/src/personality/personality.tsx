import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'

type PersonalityTrait = {
  name: string
  description: string | null
  id: string
}

export default function Personality() {
  const [traits, setTraits] = useState<PersonalityTrait[]>([])

  useEffect(() => {
    fetch('/api/personality/traits')
      .then((res) => res.json())
      .then(setTraits)
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, 10] }}>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        {traits.map((trait, i) => {
          const angle = (i / traits.length) * Math.PI * 2
          return (
            <mesh key={trait.name} position={[Math.cos(angle) * 4, Math.sin(angle) * 4, 0]}>
              <sphereGeometry args={[0.2]} />
              <meshStandardMaterial color="orange" />
            </mesh>
          )
        })}
      </Canvas>
    </div>
  )
}
