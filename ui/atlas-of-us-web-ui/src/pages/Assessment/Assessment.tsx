import "./assessment.css";
import { NavBar } from "../../common-components/navbar/nav";
import { Canvas } from "@react-three/fiber";
import React, { useState } from "react";
import { Step1 } from "./Step1/Step1";
import { Step2 } from "./Step2/Step2";
import { Step3 } from "./Step3/Step3";
import { Step2Choice1 } from "./Step2Choice1/Step2Choice1";
import { Step2Choice2 } from "./Step2Choice2/Step2Choice2";
import { Step4 } from "./Step4/Step4";
import { Step5 } from "./Step5/Step5";
import { Step6 } from "./Step6/Step6";
import { StepSkillsAbilities } from "./StepSkillsAbilities/StepSkillsAbilities";
import { StepYou } from "./StepYou/StepYou";

import { AssessmentWorld, WorldState } from "./AssessmentWorld";
import { ForceGraph } from "../Graph/ForceGraph/ForceGraph";
import { TrackballControls } from "@react-three/drei";

interface StepResponse {
    stepId: string;
    response: string;
    timestamp: Date;
}

interface OnNextResponse {
    text?: string;
    functionCall?: string;
}

interface BranchingRule {
    condition: (response: OnNextResponse) => boolean;
    nextStep: string;
}

interface StepConfig {
    stepId: string;
    nextStepRules: BranchingRule[];
    nodeId?: string;
    component: React.ComponentType<StepProps>;
}

export interface StepProps {
    onStepComplete: (response?: OnNextResponse) => void;
    onFunctionCall: (functionName: string) => void;
}

export function Assessment() {
    const [currentStep, setCurrentStep] = useState('Step1');
    const [responses, setResponses] = useState<StepResponse[]>([]);
    const [initialNodeId, setInitialNodeId] = useState<string | null>(null);
    const [worldState, setWorldState] = useState<WorldState>({
        skyColor: '#1a1a2e',
        starIntensity: 4,
        cameraTarget: [0, 0, 0]
    });
    const [targetWorldState, setTargetWorldState] = useState<WorldState>({
        skyColor: '#1a1a2e',
        starIntensity: 4,
        cameraTarget: [0, 0, 0]
    });
    

    const stepConfigs: StepConfig[] = [
        {
            stepId: 'Step1',
            nextStepRules: [
                { condition: () => true, nextStep: 'Step2' }
            ],
            component: Step1
        },
        {
            stepId: 'Step2',
            nextStepRules: [
                {
                    condition: (response: OnNextResponse) => !response?.text || response.text.trim() === "",
                    nextStep: 'Step2Choice1'
                },
                {
                    condition: (response: OnNextResponse) => response?.text && response.text.trim() !== "",
                    nextStep: 'Step2Choice2'
                }
            ],
            component: Step2
        },
        {
            stepId: 'Step2Choice1',
            nextStepRules: [
                { condition: () => true, nextStep: 'Step3' }
            ],
            component: Step2Choice1
        },
        {
            stepId: 'Step2Choice2',
            nextStepRules: [
                { condition: () => true, nextStep: 'Step3' }
            ],
            component: Step2Choice2
        },
        {
            stepId: 'Step3',
            nextStepRules: [
                { condition: () => true, nextStep: 'Step4' }
            ],
            component: Step3
        },
        {
            stepId: 'Step4',
            nextStepRules: [
                { condition: () => true, nextStep: 'Step5' }
            ],
            component: Step4
        },
        {
            stepId: 'Step5',
            nextStepRules: [
                { condition: () => true, nextStep: 'Step6' }
            ],
            component: Step5
        },
        {
            stepId: 'Step6',
            nextStepRules: [
                { condition: () => true, nextStep: 'StepYou' }
            ],
            nodeId: '4:b476f271-2fae-4ff8-9d53-640f0dd4144a:0',
            component: Step6
        },
        {
            stepId: 'StepYou',
            nextStepRules: [
                { condition: () => true, nextStep: 'StepSkillsAbilities' }
            ],
            component: StepYou
        },
        {
            stepId: 'StepSkillsAbilities',
            nextStepRules: [
                { condition: () => true, nextStep: 'StepSkillsAbilities' }
            ],
            component: StepSkillsAbilities
        },
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
            case 'loadNodesById':
                console.log('Loading nodes...');
                // Add any specific logic for loading skills nodes
                break;
            default:
                console.warn(`Unknown function call: ${functionName}`);
        }
    };
    
    const handleStepComplete = (stepId: string, response: OnNextResponse = {}) => {
        // Handle function call if present
        if (response.functionCall) {
            handleFunctionCall(response.functionCall);
        }
        
        // Store response for tracking
        const stepResponse: StepResponse = {
            stepId,
            response: response.text || '',
            timestamp: new Date()
        };
        
        setResponses(prev => [...prev, stepResponse]);
        
        // Navigate based on branching rules
        const stepConfig = stepConfigs.find(config => config.stepId === stepId);
        for (const rule of stepConfig.nextStepRules) {
            if (rule.condition(response)) {
                console.log(`Step ${stepId} completed with response:`, response);
                console.log(`Branching to step ${rule.nextStep}`);
                
                setCurrentStep(rule.nextStep);
                
                // Update initialNodeId based on the new step
                const nextStepConfig = stepConfigs.find(config => config.stepId === rule.nextStep);
                setInitialNodeId(nextStepConfig?.nodeId || null);
                break;
            }
        }
    };
    
    const renderCurrentStep = () => {
        const stepConfig = stepConfigs.find(config => config.stepId === currentStep);
        
        if (!stepConfig) {
            return <div className="link-dialogue">Assessment complete!</div>;
        }
        
        const Component = stepConfig.component;
        const props: StepProps = {
            onStepComplete: (response?: OnNextResponse) => handleStepComplete(currentStep, response || {}),
            onFunctionCall: handleFunctionCall
        };
        
        return <Component {...props} />;
    };

    return (
        <>
            <NavBar />
            <div className="in-nav-container assessment-container">
                <Canvas className="assessment-canvas" flat camera={{ position: [0, 0, 180], far: 5000 }}>
                    <TrackballControls makeDefault />
                    <AssessmentWorld 
                        worldState={worldState}
                        setWorldState={setWorldState}
                        targetWorldState={targetWorldState}
                    />
                    <ForceGraph 
                        key={currentStep} // Force re-render when step changes 
                        initialNodeId={initialNodeId} 
                    />
                </Canvas>
                {renderCurrentStep()}
            </div>
        </>
    );
}