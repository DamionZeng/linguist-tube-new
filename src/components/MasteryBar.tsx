import React from 'react';

interface MasteryBarProps {
  mastery: number; // 1-5
}

// Color by level: 2=red, 3=yellow, 4-5=green
function getLevelColor(level: number): string {
  if (level <= 2) return '#E74C3C';
  if (level === 3) return '#F1C40F';
  return '#7A8A54';
}

export const MasteryBar: React.FC<MasteryBarProps> = ({ mastery }) => {
  const level = Math.max(1, Math.min(5, Math.round(mastery)));
  const color = getLevelColor(level);

  return (
    <div className="flex items-center" title={`熟练度: ${level}/5`}>
      <svg width="22" height="11" viewBox="0 0 28 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Battery body */}
        <rect x="0.5" y="0.5" width="23" height="13" rx="3" fill="white" stroke={color} strokeWidth="1.2" />
        {/* Battery terminal */}
        <path d="M24.5 4h1.5a1 1 0 011 1v4a1 1 0 01-1 1h-1.5" fill={color} />
        {/* Inner bars */}
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={3 + i * 5}
            y={3}
            width={3}
            height={8}
            rx={0.75}
            fill={i < level ? color : '#E8E8E0'}
          />
        ))}
      </svg>
    </div>
  );
};
