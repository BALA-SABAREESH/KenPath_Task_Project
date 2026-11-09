import { TimeSlot } from '../types';

export interface GlucoseCategory {
  label: 'Low' | 'In Range' | 'Elevated' | 'High';
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
}

export const getGlucoseCategory = (value: number, slot: TimeSlot): GlucoseCategory => {
  const isFasting = slot === 'Morning (fasting)';

  if (value < 70) {
    return {
      label: 'Low',
      color: '#dc2626',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      textColor: 'text-rose-700',
      description: 'Hypoglycemia alert (<70 mg/dl)',
    };
  }

  if (isFasting) {
    if (value <= 99) {
      return {
        label: 'In Range',
        color: '#16a34a',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-700',
        description: 'Normal fasting range (70–99 mg/dl)',
      };
    }
    if (value <= 125) {
      return {
        label: 'Elevated',
        color: '#d97706',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
        description: 'Elevated fasting range (100–125 mg/dl)',
      };
    }
    return {
      label: 'High',
      color: '#e11d48',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      description: 'Above fasting target (≥126 mg/dl)',
    };
  } else {
    // Post-prandial (After meal)
    if (value <= 139) {
      return {
        label: 'In Range',
        color: '#16a34a',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-700',
        description: 'Optimal post-meal target (<140 mg/dl)',
      };
    }
    if (value <= 179) {
      return {
        label: 'Elevated',
        color: '#d97706',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
        description: 'Elevated post-meal target (140–179 mg/dl)',
      };
    }
    return {
      label: 'High',
      color: '#e11d48',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      description: 'High post-meal spike (≥180 mg/dl)',
    };
  }
};

export const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatShortDate = (dateString: string): string => {
  if (!dateString) return '';
  const [, month, day] = dateString.split('-');
  return `${month}/${day}`;
};

export const getSlotOrder = (slot: TimeSlot): number => {
  switch (slot) {
    case 'Morning (fasting)':
      return 1;
    case 'After breakfast':
      return 2;
    case 'After lunch':
      return 3;
    case 'After dinner':
      return 4;
    default:
      return 5;
  }
};

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
