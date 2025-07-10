import "./assessment.css";
import { NavBar } from "../../common-components/navbar/nav";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Cloud } from "@react-three/drei";
import { useState, useMemo } from "react";
import { Step1 } from "./Step1/Step1";
import { Step2 } from "./Step2/Step2";
import { Step3 } from "./Step3/Step3";

interface StepResponse {
    stepId: number;
    response: string;
    timestamp: Date;
}

interface BranchingRule {
    condition: (response: string) => boolean;
    nextStep: number;
}

interface StepConfig {
    stepId: number;
    branchingRules?: BranchingRule[];
    defaultNext?: number;
}

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
    const [responses, setResponses] = useState<StepResponse[]>([]);
    
    const stepConfigs: StepConfig[] = [
        {
            stepId: 1,
            defaultNext: 2
        },
        {
            stepId: 2,
            branchingRules: [
                {
                    condition: (response: string) => response.trim() === "",
                    nextStep: 3 // Could branch to different step for blank responses
                },
                {
                    condition: (response: string) => response.trim() !== "",
                    nextStep: 3 // Could branch to different step for filled responses
                }
            ],
            defaultNext: 3
        },
        {
            stepId: 3,
            defaultNext: 4
        }
    ];
    
    const handleStepComplete = (stepId: number, response: string = '') => {
        const stepResponse: StepResponse = {
            stepId,
            response,
            timestamp: new Date()
        };
        
        setResponses(prev => [...prev, stepResponse]);
        
        const stepConfig = stepConfigs.find(config => config.stepId === stepId);
        let nextStep = stepConfig?.defaultNext || stepId + 1;
        
        if (stepConfig?.branchingRules) {
            for (const rule of stepConfig.branchingRules) {
                if (rule.condition(response)) {
                    nextStep = rule.nextStep;
                    break;
                }
            }
        }
        
        console.log(`Step ${stepId} completed with response:`, response);
        console.log(`Branching to step ${nextStep}`);
        
        setCurrentStep(nextStep);
    };
    
    const renderCurrentStep = () => {
        switch(currentStep) {
            case 1:
                return <Step1 onNext={() => handleStepComplete(1)} />;
            case 2:
                return <Step2 onNext={(response) => handleStepComplete(2, response)} />;
            case 3:
                return <Step3 onNext={() => handleStepComplete(3)} />;
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