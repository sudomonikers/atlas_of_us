import { useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Cloud } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { OrbitControls as OrbitControlsType } from "three-stdlib";

export interface WorldState {
    skyColor: string; // hex code
    starIntensity: number;
    cameraTarget: number[];
}

export function AssessmentWorld({ 
    worldState, 
    setWorldState, 
    targetWorldState 
}: { 
    worldState: WorldState;
    setWorldState: React.Dispatch<React.SetStateAction<WorldState>>;
    targetWorldState: WorldState;
}) {
    const controlsRef = useRef<OrbitControlsType>(null);

    useFrame(() => {
        const lerpFactor = 0.01; // animation speed. smaller values = slower
        let updatedState: Partial<WorldState> = {};

        //animate the camera
        if (controlsRef.current) {
            // Animate camera target
            const currentTarget = controlsRef.current.target;
            const targetPos = targetWorldState.cameraTarget;
            if (currentTarget.x !== targetPos[0] || currentTarget.y !== targetPos[1] || currentTarget.z !== targetPos[2]) {
                currentTarget.x += (targetPos[0] - currentTarget.x) * lerpFactor;
                currentTarget.y += (targetPos[1] - currentTarget.y) * lerpFactor;
                currentTarget.z += (targetPos[2] - currentTarget.z) * lerpFactor;
                
                controlsRef.current.update();
                updatedState.cameraTarget = [currentTarget.x, currentTarget.y, currentTarget.z];
            }
        }
        
        //update the worldState if something changed
        if (Object.keys(updatedState).length > 0) {
            setWorldState(prevState => ({
                ...prevState,
                ...updatedState
            }));
        }
    });

    const memoizedCanvas = useMemo(() => (
        <>
            <ambientLight intensity={0.3} />
            <directionalLight position={[10, 10, 5]} intensity={0.5} />
            <pointLight position={[0, 10, 0]} intensity={0.8} color="#9bb5ff" />
            <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade />
            <Cloud
                position={[-10, 5, -10]}
                opacity={0.3}
                speed={0.4}
                segments={20}
            />
            <Cloud
                position={[10, -5, -5]}
                opacity={0.2}
                speed={0.2}
                segments={15}
            />
            <OrbitControls ref={controlsRef} enableZoom={false} enablePan={false} />
        </>
    ), []);

    return (
        <>
            {memoizedCanvas}
        </>
    )
}