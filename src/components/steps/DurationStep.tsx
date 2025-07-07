
import React from 'react';
import { StepProps } from '../../types/scheduling';

const DurationStep: React.FC<StepProps> = ({ appState, onNext, onStateChange }) => {
  const durations = [15, 30, 45, 60];

  const selectDuration = (minutes: number) => {
    onStateChange({ duration: minutes });
    onNext();
  };

  return (
    <div className="step animate-fade-in" aria-labelledby="step1-heading">
      <h2 id="step1-heading" className="sub-heading mb-6 text-center">1. Select Meeting Duration</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {durations.map(duration => (
          <button
            key={duration}
            onClick={() => selectDuration(duration)}
            className={`duration-btn focusable p-4 border border-e3-azure rounded-lg hover:bg-e3-azure/20 transition ${
              appState.duration === duration ? 'selected' : ''
            }`}
          >
            {duration} min
          </button>
        ))}
      </div>
    </div>
  );
};

export default DurationStep;
