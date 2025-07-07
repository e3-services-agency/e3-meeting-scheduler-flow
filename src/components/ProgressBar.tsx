
import React from 'react';
import { AppState } from '../types/scheduling';

interface ProgressBarProps {
  appState: AppState;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ appState }) => {
  return (
    <div className="flex justify-between items-center mb-8 px-2">
      {appState.steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < appState.currentStep;
        const isActive = stepNumber === appState.currentStep;
        
        let barClass = 'bg-e3-white/20';
        if (isCompleted) barClass = 'bg-e3-emerald';
        if (isActive) barClass = 'bg-e3-azure';

        return (
          <React.Fragment key={stepNumber}>
            <div className="flex-1 text-center">
              <div className={`text-xs uppercase tracking-wider ${isActive ? 'text-e3-white' : 'text-e3-white/50'}`}>
                {step.name}
              </div>
              <div className={`h-1.5 mt-1 rounded-full ${barClass} transition-colors duration-500`}></div>
            </div>
            {stepNumber < appState.totalSteps && (
              <div className="w-10 h-px bg-e3-white/20 mx-2 self-center mt-4"></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProgressBar;
