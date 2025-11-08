/**
 * Review Dashboard Area Configuration
 * Story 2.6: Review Dashboard Progress Aggregation
 */

import { Calendar, Briefcase, Video, Heart, DollarSign, Home, Flag } from 'lucide-react';
import type { AreaType } from '@/hooks/useReviewProgress';
import type { LucideIcon } from 'lucide-react';

export interface ReviewAreaConfig {
  area: AreaType;
  icon: LucideIcon;
  color: string;
  route: string;
  expandable?: boolean;
}

export const REVIEW_AREAS: ReviewAreaConfig[] = [
  { area: 'DAILY', icon: Calendar, color: 'blue', route: '/dailytime' },
  { area: 'BIZNESS', icon: Briefcase, color: 'purple', route: '/business', expandable: true },
  { area: 'CONTENT', icon: Video, color: 'red', route: '/content' },
  { area: 'HEALTH', icon: Heart, color: 'green', route: '/health' },
  { area: 'FINANCES', icon: DollarSign, color: 'yellow', route: '/finance' },
  { area: 'LIFE', icon: Home, color: 'pink', route: '/life' },
  { area: 'GOLF', icon: Flag, color: 'orange', route: '/golf' },
];
