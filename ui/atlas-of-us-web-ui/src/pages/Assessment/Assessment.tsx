import "./assessment.css";
import { NavBar } from "../../common-components/navbar/nav";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Cloud } from "@react-three/drei";
import { useState, useMemo } from "react";
import { Step1 } from "./Step1/Step1";
import { Step2 } from "./Step2/Step2";
import { Step3 } from "./Step3/Step3";

function EtherealWorld() {
    return (
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
            
            <fog attach="fog" args={['#1a1a2e', 30, 100]} />
        </>
    );
}


export function Assessment() {
    const [currentStep, setCurrentStep] = useState(1);
    
    const nextStep = () => {
        setCurrentStep(prev => prev + 1);
    };
    
    const renderCurrentStep = () => {
        switch(currentStep) {
            case 1:
                return <Step1 onNext={nextStep} />;
            case 2:
                return <Step2 onNext={nextStep} />;
            case 3:
                return <Step3 onNext={nextStep} />;
            default:
                return <div className="link-dialogue">Assessment complete!</div>;
        }
    };

    const memoizedCanvas = useMemo(() => (
        <Canvas className="assessment-canvas">
            <EtherealWorld />
            <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
    ), []);

    return (
        <>
            <NavBar />
            <div className="in-nav-container assessment-container">
                {memoizedCanvas}
                {renderCurrentStep()}
            </div>
        </>
    );
}