// Goal Areas Configuration
// Maps goal areas to their display colors and styling

export type GoalAreaType = 'Health' | 'Relationships' | 'Finance' | 'Full Stack' | 'Huge Capital' | 'S4';

export interface GoalAreaConfig {
  name: GoalAreaType;
  color: string; // Tailwind color class
  bgColor: string; // Background variant
  borderColor: string;
  textColor: string;
  hoverBg: string;
}

export const GOAL_AREA_CONFIG: Record<GoalAreaType, GoalAreaConfig> = {
  'Health': {
    name: 'Health',
    color: 'emerald',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    hoverBg: 'hover:bg-emerald-500/20',
  },
  'Relationships': {
    name: 'Relationships',
    color: 'pink',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    textColor: 'text-pink-400',
    hoverBg: 'hover:bg-pink-500/20',
  },
  'Finance': {
    name: 'Finance',
    color: 'amber',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    hoverBg: 'hover:bg-amber-500/20',
  },
  'Full Stack': {
    name: 'Full Stack',
    color: 'purple',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    hoverBg: 'hover:bg-purple-500/20',
  },
  'Huge Capital': {
    name: 'Huge Capital',
    color: 'violet',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    textColor: 'text-violet-400',
    hoverBg: 'hover:bg-violet-500/20',
  },
  'S4': {
    name: 'S4',
    color: 'cyan',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    textColor: 'text-cyan-400',
    hoverBg: 'hover:bg-cyan-500/20',
  },
};

export const getGoalAreaConfig = (area: GoalAreaType): GoalAreaConfig => {
  return GOAL_AREA_CONFIG[area];
};
