import React from 'react';

interface UsageProgressBarProps {
  current: number;
  max: number;
  label: string;
}

const UsageProgressBar: React.FC<UsageProgressBarProps> = ({ current, max, label }) => {
  const percentage = Math.min(100, Math.round((current / max) * 100));
  const isWarning = percentage > 80;
  const isCritical = percentage > 95;

  let colorClass = 'bg-primary';
  if (isCritical) colorClass = 'bg-red-500';
  else if (isWarning) colorClass = 'bg-yellow-500';

  return (
    <div className="bg-white shadow rounded-lg p-5">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">{label}</h3>
        <span className="text-sm font-semibold text-gray-900">
          {current} / {max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${colorClass}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="mt-2 text-xs text-gray-500 text-right">{percentage}% used</p>
    </div>
  );
};

export default UsageProgressBar;
