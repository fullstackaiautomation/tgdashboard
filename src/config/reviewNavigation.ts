// Story 5.1: Review Dashboard Navigation Configuration
// Maps review areas to their routes, icons, and colors

import { Calendar, Briefcase, Video, Heart, DollarSign, Home, Flag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AreaType = 'DAILY' | 'BIZNESS' | 'CONTENT' | 'HEALTH' | 'FINANCES' | 'LIFE' | 'GOLF';

export interface ReviewAreaConfig {
  area: AreaType;
  icon: LucideIcon;
  color: string;
  route: string;
  displayName: string;
}

export const REVIEW_AREAS: ReviewAreaConfig[] = [
  {
    area: 'DAILY',
    icon: Calendar,
    color: 'blue',
    route: '/daily',
    displayName: 'Daily'
  },
  {
    area: 'BIZNESS',
    icon: Briefcase,
    color: 'purple',
    route: '/business',
    displayName: 'Business Projects'
  },
  {
    area: 'CONTENT',
    icon: Video,
    color: 'red',
    route: '/content',
    displayName: 'Content Library'
  },
  {
    area: 'HEALTH',
    icon: Heart,
    color: 'green',
    route: '/health',
    displayName: 'Health Focus'
  },
  {
    area: 'FINANCES',
    icon: DollarSign,
    color: 'yellow',
    route: '/finances',
    displayName: 'Finances'
  },
  {
    area: 'LIFE',
    icon: Home,
    color: 'pink',
    route: '/life',
    displayName: 'Life'
  },
  {
    area: 'GOLF',
    icon: Flag,
    color: 'orange',
    route: '/golf',
    displayName: 'Golf'
  },
];

// Helper to get config by area
export const getAreaConfig = (area: AreaType): ReviewAreaConfig | undefined => {
  return REVIEW_AREAS.find(a => a.area === area);
};
