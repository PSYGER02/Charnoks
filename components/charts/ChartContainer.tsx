
import React from 'react';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, subtitle, action }) => {
  return (
    <div className="modern-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-text-primary">{title}</h3>
          {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="flex-grow w-full min-h-[300px]">
        {children}
      </div>
    </div>
  );
};

export default ChartContainer;
