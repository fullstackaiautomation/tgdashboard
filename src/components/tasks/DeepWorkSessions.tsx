import type { FC } from 'react';
import { useState, useMemo } from 'react';
import { Timer, Clock, TrendingUp, BarChart3, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Area } from '../../types/task';
import { useDeepWorkSessions } from '../../hooks/useDeepWorkSessions';

interface DeepWorkSessionsProps {
  sessions?: never; // Deprecated prop - now using hook
}

type TimePeriod = 'All Time' | 'Today' | 'This Week' | 'This Month';

// Area colors mapping
const AREA_COLORS: Record<string, string> = {
  'All Areas': 'bg-blue-500',
  'Personal': 'bg-pink-500',
  'Full Stack': 'bg-green-500',
  'Huge Capital': 'bg-purple-500',
  '808': 'bg-yellow-500',
  'S4': 'bg-blue-600',
  'Golf': 'bg-orange-500',
  'Health': 'bg-teal-500',
};

const AREA_TEXT_COLORS: Record<string, string> = {
  'All Areas': 'text-blue-400',
  'Personal': 'text-pink-400',
  'Full Stack': 'text-green-400',
  'Huge Capital': 'text-purple-400',
  '808': 'text-yellow-400',
  'S4': 'text-blue-400',
  'Golf': 'text-orange-400',
  'Health': 'text-teal-400',
};

const EFFORT_COLORS: Record<string, string> = {
  'All Levels': 'bg-blue-500',
  '$$$ Printer $$$': 'bg-green-500',
  '$ Makes Money $': 'bg-green-700',
  '-$ Save Dat $-': 'bg-orange-500',
  ':( No Money ):': 'bg-red-500',
  '8) Vibing (8': 'bg-purple-500',
};

export const DeepWorkSessions: FC<DeepWorkSessionsProps> = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('All Time');
  const [selectedArea, setSelectedArea] = useState<Area | 'All Areas'>('All Areas');
  const [selectedEffort, setSelectedEffort] = useState<string>('All Levels');

  // Fetch all sessions from Supabase
  const { data: allSessions = [], isLoading, error } = useDeepWorkSessions();

  console.log('🟣 DeepWorkSessions rendering with sessions:', allSessions);
  console.log('🟣 Sessions length:', allSessions.length);
  console.log('🟣 Loading:', isLoading, 'Error:', error);

  // Filter sessions by time period
  const sessions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return allSessions.filter(session => {
      const sessionDate = new Date(session.start_time);

      switch (selectedPeriod) {
        case 'Today':
          return sessionDate >= startOfToday;
        case 'This Week':
          return sessionDate >= startOfWeek;
        case 'This Month':
          return sessionDate >= startOfMonth;
        case 'All Time':
        default:
          return true;
      }
    });
  }, [allSessions, selectedPeriod]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const avgMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

    return {
      totalSessions,
      totalTime: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      avgSession: `${avgMinutes}m`,
      percentOfTotal: '100%',
    };
  }, [sessions]);

  // Calculate area counts
  const areaCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All Areas': sessions.length };
    sessions.forEach(s => {
      if (s.area) {
        counts[s.area] = (counts[s.area] || 0) + 1;
      }
    });
    return counts;
  }, [sessions]);

  // Calculate effort level counts (note: effort_level may not exist in deep_work_log table)
  const effortCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All Levels': sessions.length };
    // The deep_work_log table doesn't have effort_level yet
    // This will be empty for now until we add that field
    return counts;
  }, [sessions]);

  // Get top 5 tasks
  const top5Tasks = useMemo(() => {
    const taskMap = new Map<string, { area: string; minutes: number; sessions: number; taskName: string }>();

    sessions.forEach(s => {
      const key = s.task?.task_name || 'Unknown';
      const existing = taskMap.get(key);
      if (existing) {
        existing.minutes += s.duration_minutes || 0;
        existing.sessions += 1;
      } else {
        taskMap.set(key, {
          area: s.area || 'Unknown',
          minutes: s.duration_minutes || 0,
          sessions: 1,
          taskName: key,
        });
      }
    });

    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

    return Array.from(taskMap.values())
      .map(task => ({
        ...task,
        percent: totalMinutes > 0 ? Math.round((task.minutes / totalMinutes) * 100) : 0,
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);
  }, [sessions]);

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-lg">Loading sessions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400 text-lg">Error loading sessions: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-100 mb-2">Deep Work Sessions</h2>
        <p className="text-gray-400 text-sm">Track your focused work sessions and productivity</p>
      </div>

      {/* Time Period Filters */}
      <div className="grid grid-cols-4 gap-4">
        {(['All Time', 'Today', 'This Week', 'This Month'] as const).map((period) => (
          <Button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            className={`h-14 text-base font-semibold transition-all ${
              selectedPeriod === period
                ? 'bg-blue-600 hover:bg-blue-700 border-blue-500 shadow-lg shadow-blue-500/30'
                : 'bg-gray-800 hover:bg-gray-750 border-gray-700 text-gray-300'
            }`}
          >
            {period}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-5">
        <Card className="bg-gradient-to-br from-gray-800 to-gray-850 border-gray-700 p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-500/20 rounded-lg">
              <Timer className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Sessions</span>
          </div>
          <div className="text-4xl font-bold text-white">{stats.totalSessions}</div>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800 to-gray-850 border-gray-700 p-6 hover:shadow-xl hover:shadow-pink-500/10 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-pink-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-pink-400" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Time</span>
          </div>
          <div className="text-4xl font-bold text-white">{stats.totalTime}</div>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800 to-gray-850 border-gray-700 p-6 hover:shadow-xl hover:shadow-green-500/10 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-green-500/20 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Session</span>
          </div>
          <div className="text-4xl font-bold text-white">{stats.avgSession}</div>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800 to-gray-850 border-gray-700 p-6 hover:shadow-xl hover:shadow-yellow-500/10 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-yellow-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">% Of Total Hours</span>
          </div>
          <div className="text-4xl font-bold text-white">{stats.percentOfTotal}</div>
        </Card>
      </div>

      {/* Area Filters */}
      <div className="grid grid-cols-8 gap-3">
        {Object.entries(areaCounts).map(([area, count]) => (
          <Button
            key={area}
            onClick={() => setSelectedArea(area as Area | 'All Areas')}
            variant="outline"
            className={`h-auto py-3 px-4 text-sm font-medium transition-all ${
              selectedArea === area
                ? `${AREA_COLORS[area]} border-transparent text-white shadow-lg`
                : `bg-gray-800 hover:bg-gray-750 border-gray-700 ${AREA_TEXT_COLORS[area]}`
            }`}
          >
            <span className="truncate">{area} ({count})</span>
          </Button>
        ))}
      </div>

      {/* Effort Level Filters */}
      <div className="grid grid-cols-6 gap-3">
        {Object.entries(effortCounts).map(([level, count]) => (
          <Button
            key={level}
            onClick={() => setSelectedEffort(level)}
            variant="outline"
            className={`h-auto py-3 px-4 text-sm font-medium transition-all ${
              selectedEffort === level
                ? `${EFFORT_COLORS[level]} border-transparent text-white shadow-lg`
                : 'bg-gray-800 hover:bg-gray-750 border-gray-700 text-gray-300'
            }`}
          >
            <span className="truncate">{level} ({count})</span>
          </Button>
        ))}
      </div>

      {/* Top 5 Tasks Cards */}
      <div className="grid grid-cols-5 gap-3">
        {top5Tasks.map((task, idx) => (
          <Card
            key={idx}
            className={`${AREA_COLORS[task.area]} border-none p-4 text-white shadow-xl hover:scale-105 transition-transform`}
          >
            <div className="flex justify-between items-start mb-2">
              <Badge variant="secondary" className="bg-black/30 text-white border-none">
                #{idx + 1}
              </Badge>
              <Badge variant="secondary" className="bg-black/30 text-white text-xs border-none">
                {task.area}
              </Badge>
            </div>
            <div className="text-2xl font-bold mb-1">{formatTime(task.minutes)}</div>
            <div className="text-sm opacity-90 mb-1">{task.percent}%</div>
            <div className="text-sm opacity-90 mb-2">{task.sessions} sessions</div>
            <div className="text-xs opacity-80 truncate" title={task.taskName}>
              {task.taskName}
            </div>
          </Card>
        ))}
      </div>

      {/* Session Log */}
      <Card className="bg-gray-800 border-gray-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Deep Work Session Log</h3>
          <Button className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Session
          </Button>
        </div>

        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              No sessions found for the selected filters
            </div>
          ) : (
            sessions.map((session) => {
              const startTime = new Date(session.start_time);
              const endTime = session.end_time ? new Date(session.end_time) : null;
              const dateStr = startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const timeStr = endTime
                ? `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                : startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

              const areaColor = AREA_COLORS[session.area || ''] || 'bg-gray-600';

              return (
                <div
                  key={session.id}
                  className={`${areaColor} rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity`}
                >
                  <div className="flex-none w-28 text-white text-sm">📅 {dateStr}</div>
                  <div className="flex-none w-36 text-white text-sm">🕐 {timeStr}</div>
                  <div className="flex-none w-20 text-white text-sm font-bold">
                    ⏱️ {formatTime(session.duration_minutes || 0)}
                  </div>
                  <Badge className={`${areaColor} border-white/20`}>
                    {session.area || 'Unknown'}
                  </Badge>
                  <Badge className="bg-amber-500 border-none">
                    {session.task_type || 'N/A'}
                  </Badge>
                  <Badge className="bg-white text-gray-900 border-none">
                    {session.task?.task_name || 'Unknown Task'}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};
