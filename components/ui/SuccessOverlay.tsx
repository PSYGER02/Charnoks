import React from 'react';

const SuccessOverlay: React.FC = () => (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-bounce-in">
        <div className="bg-green-500 rounded-full w-32 h-32 flex items-center justify-center shadow-2xl">
            <svg className="w-20 h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        </div>
    </div>
);

export default SuccessOverlay;