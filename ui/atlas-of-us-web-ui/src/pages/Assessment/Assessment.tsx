import "./assessment.css";
import { NavBar } from "../../common-components/navbar/nav";
import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { Step1 } from "./Step1/Step1";
import { Step2 } from "./Step2/Step2";
import { Step3 } from "./Step3/Step3";
import { Step2Choice1 } from "./Step2Choice1/Step2Choice1";
import { Step2Choice2 } from "./Step2Choice2/Step2Choice2";
import { Step4 } from "./Step4/Step4";
import { Step5 } from "./Step5/Step5";
import { Step6 } from "./Step6/Step6";
import { StepSkillsAbilities } from "./StepSkillsAbilities/StepSkillsAbilities";

import { AssessmentWorld, WorldState } from "./AssessmentWorld";
import { ForceGraph } from "../Graph/ForceGraph/ForceGraph";
import { TrackballControls } from "@react-three/drei";
import { GraphUtils } from "../Graph/graph-utils";
import { HttpService } from "../../services/http-service";

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

export function Assessment() {
    const [graphData, setGraphData] = useState(null);
    const http = new HttpService();
    const graphUtils = new GraphUtils(http);
    
    useEffect(() => {
        graphUtils.loadMostRelatedNodeBySearch('programming', 2).then((data) => {
            setGraphData(data);
        });
    }, []);
    
    const [currentStep, setCurrentStep] = useState('Step1');
    const [responses, setResponses] = useState<StepResponse[]>([]);
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
            defaultNext: 'StepSkillsAbilities'
        },
        {
            stepId: 'StepSkillsAbilities',
            defaultNext: 'StepSkillsAbilities'
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
            case 'StepSkillsAbilities':
                return <StepSkillsAbilities onNext={() => handleStepComplete('StepSkillsAbilities')} onFunctionCall={handleFunctionCall} />;
    
            default:
                return <div className="link-dialogue">Assessment complete!</div>;
        }
    };






    



    return (
        <>
            <NavBar />
            <div className="in-nav-container assessment-container">
                <Canvas className="assessment-canvas" flat camera={{ position: [0, 0, 180], far: 5000 }}>
                    <TrackballControls />
                    <AssessmentWorld 
                        worldState={worldState}
                        setWorldState={setWorldState}
                        targetWorldState={targetWorldState}
                    />
                    {graphData && <ForceGraph neo4jResponse={graphData} />}
                </Canvas>
                {renderCurrentStep()}
            </div>
        </>
    );
}