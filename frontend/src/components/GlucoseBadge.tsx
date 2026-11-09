import React from 'react';
import { TimeSlot } from '../types';
import { getGlucoseCategory } from '../utils/glucose';

interface GlucoseBadgeProps {
  value: number;
  slot: TimeSlot;
  showDetails?: boolean;
}

export const GlucoseBadge: React.FC<GlucoseBadgeProps> = ({ value, slot, showDetails = false }) => {
  const category = getGlucoseCategory(value, slot);

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${category.bgColor} ${category.textColor} ${category.borderColor}`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full mr-1.5"
          style={{ backgroundColor: category.color }}
          aria-hidden="true"
        />
        {category.label}
      </span>
      {showDetails && (
        <span className="text-xs text-slate-500 hidden sm:inline">
          {category.description}
        </span>
      )}
    </div>
  );
};
