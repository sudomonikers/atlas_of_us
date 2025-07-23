import "./assessment.css";
import { NavBar } from "../../common-components/navbar/nav";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Cloud } from "@react-three/drei";
import { useState, useMemo, useRef } from "react";
import { OrbitControls as OrbitControlsType } from "three-stdlib";
import { Step1 } from "./Step1/Step1";
import { Step2 } from "./Step2/Step2";
import { Step3 } from "./Step3/Step3";
import { Step2Choice1 } from "./Step2Choice1/Step2Choice1";
import { Step2Choice2 } from "./Step2Choice2/Step2Choice2";
import { Step4 } from "./Step4/Step4";
import { Step5 } from "./Step5/Step5";
import { Step6 } from "./Step6/Step6";
import { interpolateColor } from "./shared/sharedFunctions";

interface StepResponse {
    stepId: string;
    response: string;
    timestamp: Date;
}

interface BranchingRule {
    condition: (response: string) => boolean;
    nextStep: string;
}

interface StepConfig {
    stepId: string;
    branchingRules?: BranchingRule[];
    defaultNext?: string;
}

export interface StepProps {
    onNext: (response?: string) => void;
    onFunctionCall?: (functionName: string) => void;
}

interface WorldState {
    skyColor: string; // hex code
    starIntensity: number;
    cameraTarget: number[];
}

function EtherealWorld({ targetWorldState }: { 
    targetWorldState: WorldState; 
}) {
    const controlsRef = useRef<OrbitControlsType>(null);
    const [worldState, setWorldState] = useState<WorldState>({
        skyColor: '#1a1a2e',
        starIntensity: 4,
        cameraTarget: [0, 0, 0]
    });

    const memoizedClouds = useMemo(() => (
        <>
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
        </>
    ), []);

    useFrame(() => {
        if (!controlsRef.current) return;
        
        const lerpFactor = 0.05;
        
        // Animate camera target
        const currentTarget = controlsRef.current.target;
        const targetPos = targetWorldState.cameraTarget;
        
        currentTarget.x += (targetPos[0] - currentTarget.x) * lerpFactor;
        currentTarget.y += (targetPos[1] - currentTarget.y) * lerpFactor;
        currentTarget.z += (targetPos[2] - currentTarget.z) * lerpFactor;
        
        controlsRef.current.update();
        
        // Update worldState to lerp towards targetWorldState
        setWorldState(prevState => {
            const newState = { ...prevState };
            
            // Lerp star intensity
            if (Math.abs(prevState.starIntensity - targetWorldState.starIntensity) > 0.01) {
                newState.starIntensity += (targetWorldState.starIntensity - prevState.starIntensity) * lerpFactor;
            }
            
            // Lerp sky color
            if (prevState.skyColor !== targetWorldState.skyColor) {
                const colorProgress = lerpFactor;
                newState.skyColor = interpolateColor(prevState.skyColor, targetWorldState.skyColor, colorProgress);
            }
            
            // Update camera target in state
            newState.cameraTarget = [currentTarget.x, currentTarget.y, currentTarget.z];
            
            return newState;
        });
    });

    return (
        <>
            <ambientLight intensity={0.3} />
            <directionalLight position={[10, 10, 5]} intensity={0.5} />
            <pointLight position={[0, 10, 0]} intensity={0.8} color="#9bb5ff" />
            
            <Stars radius={100} depth={50} count={2000} factor={worldState.starIntensity} saturation={0} fade />
            
            {memoizedClouds}
            
            <fog attach="fog" args={[worldState.skyColor, 30, 100]} />
            <OrbitControls ref={controlsRef} enableZoom={false} enablePan={false} />
        </>
    );
}

export function Assessment() {
    const [currentStep, setCurrentStep] = useState('Step1');
    const [responses, setResponses] = useState<StepResponse[]>([]);
    const [targetWorldState, setTargetWorldState] = useState<WorldState>({
        skyColor: '#1a1a2e',
        starIntensity: 4,
        cameraTarget: [0, 0, 0]
    });
    
    const stepConfigs: StepConfig[] = [
        {
            stepId: 'Step1',
            defaultNext: 'Step2'
        },
        {
            stepId: 'Step2',
            branchingRules: [
                {
                    condition: (response: string) => response.trim() === "",
                    nextStep: 'Step2Choice1'
                },
                {
                    condition: (response: string) => response.trim() !== "",
                    nextStep: 'Step2Choice2'
                }
            ]
        },
        {
            stepId: 'Step2Choice1',
            defaultNext: 'Step3'
        },
        {
            stepId: 'Step2Choice2',
            defaultNext: 'Step3'
        },
        {
            stepId: 'Step3',
            defaultNext: 'Step4'
        },
        {
            stepId: 'Step4',
            defaultNext: 'Step5'
        },
        {
            stepId: 'Step5',
            defaultNext: 'Step6'
        },
        {
            stepId: 'Step6',
            defaultNext: 'Step7'
        }
    ];
    
    const handleFunctionCall = (functionName: string) => {
        switch (functionName) {
            case 'transitionToSky':
                setTargetWorldState({
                    skyColor: '#0a0a1a',
                    starIntensity: 6,
                    cameraTarget: [0, 20, 0]
                });
                break;
            default:
                console.warn(`Unknown function call: ${functionName}`);
        }
    };
    
    const handleStepComplete = (stepId: string, response: string = '') => {
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
            case 'Step1':
                return <Step1 onNext={() => handleStepComplete('Step1')} />;
            case 'Step2':
                return <Step2 onNext={(response) => handleStepComplete('Step2', response)} />;
            case 'Step2Choice1':
                return <Step2Choice1 onNext={() => handleStepComplete('Step2Choice1')} />;
            case 'Step2Choice2':
                return <Step2Choice2 onNext={() => handleStepComplete('Step2Choice2')} />;
            case 'Step3':
                return <Step3 onNext={() => handleStepComplete('Step3')} />;
            case 'Step4':
                return <Step4 onNext={() => handleStepComplete('Step4')} />;
            case 'Step5':
                return <Step5 onNext={() => handleStepComplete('Step5')} />;
            case 'Step6':
                return <Step6 onNext={() => handleStepComplete('Step6')} onFunctionCall={handleFunctionCall} />;
            default:
                return <div className="link-dialogue">Assessment complete!</div>;
        }
    };

    const memoizedCanvas = useMemo(() => (
        <Canvas className="assessment-canvas">
            <EtherealWorld 
                targetWorldState={targetWorldState}
            />
        </Canvas>
    ), [targetWorldState]);



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