/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import ContentLibrary from './components/ContentLibrary'
import { TasksHub } from './components/tasks/TasksHub'
import { DeepWorkSessions } from './components/tasks/DeepWorkSessions'
import { DeepWorkSidebar } from './components/tasks/DeepWorkSidebar'
import { BusinessDashboard } from './components/business/BusinessDashboard'
import FinanceDashboard from './components/finance/FinanceDashboard'
import NotesBoard from './components/notes/NotesBoard'

type Area = 'Full Stack' | 'S4' | '808' | 'Personal' | 'Huge Capital' | 'Golf' | 'Health'
type EffortLevel = '$$$ Printer $$$' | '$ Makes Money $' | '-$ Save Dat $-' | ':( No Money ):' | '8) Vibing (8'
type Priority = 'Low' | 'Medium' | 'High'
type RecurringType = 'none' | 'daily' | 'daily_weekdays' | 'weekly' | 'monthly' | 'custom'

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

interface Task {
  id: string
  task_name: string
  description: string
  area: Area
  task_type: string
  status: string
  priority: Priority | undefined
  due_date: string | null
  completed_at: string | null
  hours_projected: number | null
  effort_level: EffortLevel | undefined
  updated_at: string | null
  hours_worked: number | undefined
  recurring_template: string | null
  recurring_type: RecurringType | undefined
  created_at: string | null
  checklist: ChecklistItem[]
}

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('tgrassmick@gmail.com')
  const [password, setPassword] = useState('Grassmick1')
  const [error, setError] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [deepWorkSessions, setDeepWorkSessions] = useState<any[]>([])
  const [selectedArea, _setSelectedArea] = useState<Area | 'All Areas'>('All Areas')
  const [activeMainTab, setActiveMainTab] = useState<'tasks' | 'business' | 'content' | 'finance' | 'notes' | 'review'>('tasks')
  const [activeTasksSubTab, setActiveTasksSubTab] = useState<'tasks-list' | 'deepwork'>('tasks-list') // NEW: Tasks Hub subtabs
  const [selectedTimePeriod, _setSelectedTimePeriod] = useState<'All Time' | 'Today' | 'This Week' | 'This Month'>('All Time')
  const [selectedDWArea, _setSelectedDWArea] = useState<Area | 'All Areas'>('All Areas')
  const [selectedEffortLevel, _setSelectedEffortLevel] = useState<string>('All Levels')
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<any>({})
  // const [chartView, setChartView] = useState<'areas' | 'effort'>('areas')
  // const [chartDateRange, setChartDateRange] = useState<'all' | 'monthly' | 'weekly' | 'custom'>('all')
  // const [customStartDate, setCustomStartDate] = useState<string>('')
  // const [customEndDate, setCustomEndDate] = useState<string>('')
  // const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [taskFormData, setTaskFormData] = useState<Partial<Task>>({})
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePickerTask, setDatePickerTask] = useState<Task | null>(null)
  const [selectedStatusFilter, _setSelectedStatusFilter] = useState<'all' | 'active' | 'completed' | 'recurring' | 'overdue' | 'dueToday' | 'completedToday' | 'dueTomorrow'>('dueToday')
  const [dwSessionTask, setDwSessionTask] = useState<Task | null>(null)
  const [dwSessionTaskType, setDwSessionTaskType] = useState<string>('')
  const [dwSessionFocusArea, setDwSessionFocusArea] = useState<Area | ''>('')
  const [_dwTaskSearchTerm, setDwTaskSearchTerm] = useState<string>('')
  const [_showDwTaskDropdown, _setShowDwTaskDropdown] = useState<boolean>(false)
  const [timerRunning, setTimerRunning] = useState<boolean>(false)
  const [timerPaused, setTimerPaused] = useState<boolean>(false)
  const [timerSeconds, setTimerSeconds] = useState<number>(0)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [pausedDuration, setPausedDuration] = useState<number>(0)
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null)
  const [editTaskSearchTerm, setEditTaskSearchTerm] = useState<string>('')
  const [showEditTaskDropdown, setShowEditTaskDropdown] = useState<boolean>(false)
  const [_editingTaskField, setEditingTaskField] = useState<{taskId: string, field: string} | null>(null)

  // Load persisted timer state on mount
  useEffect(() => {
    // Load Deep Work session
    const storedSession = localStorage.getItem('deepWorkSession')
    if (storedSession) {
      const sessionData = JSON.parse(storedSession)
      if (sessionData.isRunning) {
        setTimerRunning(true)
        setSessionStartTime(new Date(sessionData.startTime))
        setDwSessionTask(sessionData.task)
        setDwSessionTaskType(sessionData.taskType || '')
        setDwSessionFocusArea(sessionData.focusArea)
        setPausedDuration(sessionData.pausedDuration || 0)

        if (sessionData.isPaused) {
          setTimerPaused(true)
          setPauseStartTime(sessionData.pauseStartTime ? new Date(sessionData.pauseStartTime) : null)
        }
      }
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      if (session) {
        fetchTasks(session.user.id)
        fetchDeepWorkSessions(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchTasks(session.user.id)
        fetchDeepWorkSessions(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (timerRunning && !timerPaused) {
      // Calculate elapsed time based on actual timestamps
      interval = setInterval(() => {
        if (sessionStartTime) {
          const now = new Date()
          const elapsed = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000)
          setTimerSeconds(elapsed - pausedDuration)
        }
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerRunning, timerPaused, sessionStartTime, pausedDuration])

  // Save session state to localStorage whenever it changes
  useEffect(() => {
    if (timerRunning) {
      const sessionData = {
        isRunning: timerRunning,
        isPaused: timerPaused,
        startTime: sessionStartTime?.toISOString(),
        pauseStartTime: pauseStartTime?.toISOString(),
        pausedDuration,
        task: dwSessionTask,
        taskType: dwSessionTaskType,
        focusArea: dwSessionFocusArea
      }
      localStorage.setItem('deepWorkSession', JSON.stringify(sessionData))
    } else {
      localStorage.removeItem('deepWorkSession')
    }
  }, [timerRunning, timerPaused, sessionStartTime, pauseStartTime, pausedDuration, dwSessionTask, dwSessionTaskType, dwSessionFocusArea])

  const fetchTasks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // For now, just set the tasks directly without transformation
      // We'll handle checklist parsing when displaying
      setTasks(data || [])
      console.log('Fetched tasks:', data?.length || 0, 'tasks')
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _toggleChecklistItem = async (taskId: string, checklistItemId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const updatedChecklist = task.checklist.map(item =>
        item.id === checklistItemId ? { ...item, completed: !item.completed } : item
      )

      const { error } = await supabase
        .from('tasks')
        .update({
          checklist: JSON.stringify(updatedChecklist)
        })
        .eq('id', taskId)

      if (error) throw error

      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, checklist: updatedChecklist } : t
      ))
    } catch (error) {
      console.error('Error toggling checklist item:', error)
    }
  }

  const fetchDeepWorkSessions = async (userId: string) => {
    console.log('🔵 fetchDeepWorkSessions called for user:', userId)
    try {
      const { data, error } = await supabase
        .from('deep_work_log')
        .select(`
          *,
          task:task_id (
            task_name
          )
        `)
        .eq('user_id', userId)
        .order('start_time', { ascending: false })

      if (error) {
        console.error('🔴 Fetch error:', error)
        throw error
      }

      console.log('✅ Fetched sessions:', data?.length || 0, 'sessions')
      console.log('📊 Sessions data:', data)
      setDeepWorkSessions(data || [])
    } catch (error) {
      console.error('Error fetching deep work sessions:', error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (error: any) {
      setError(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const _toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Done' ? 'Not started' : 'Done'
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'Done' ? new Date().toISOString() : null
        })
        .eq('id', taskId)

      if (error) throw error
      if (session) fetchTasks(session.user.id)
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const _updateTaskFieldInline = async (taskId: string, field: string, value: any) => {
    try {
      const updateData: any = {}

      // Map field names to database column names
      if (field === 'hours_projected') {
        updateData['Hours Projected'] = value ? Number(value) : null
      } else if (field === 'hours_worked') {
        updateData['Hours Worked'] = value ? Number(value) : null
      } else {
        updateData[field] = value
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

      if (error) throw error

      if (session) fetchTasks(session.user.id)
      setEditingTaskField(null)
    } catch (error) {
      console.error('Error updating task field:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      if (session) fetchTasks(session.user.id)
      setEditingTask(null)
      setShowAddTaskModal(false)
      setTaskFormData({})
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const updateTaskDueDate = async (taskId: string, newDate: string, isCompleted: boolean = false) => {
    try {
      const updateData = isCompleted
        ? { completed_at: newDate, updated_at: new Date().toISOString() }
        : { due_date: newDate }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

      if (error) throw error
      if (session) fetchTasks(session.user.id)
      setShowDatePicker(false)
      setDatePickerTask(null)
    } catch (error) {
      console.error('Error updating task date:', error)
    }
  }

  const _startTimer = () => {
    const now = new Date()
    setTimerRunning(true)
    setTimerPaused(false)
    setSessionStartTime(now)
    setPausedDuration(0)
    setPauseStartTime(null)
  }

  const _pauseTimer = () => {
    if (timerPaused) {
      // Resuming from pause
      if (pauseStartTime) {
        const pauseEnd = new Date()
        const pauseDiff = Math.floor((pauseEnd.getTime() - pauseStartTime.getTime()) / 1000)
        setPausedDuration(prev => prev + pauseDiff)
      }
      setPauseStartTime(null)
      setTimerPaused(false)
    } else {
      // Pausing
      setPauseStartTime(new Date())
      setTimerPaused(true)
    }
  }

  const _saveSession = async () => {
    // Calculate final elapsed time
    let finalSeconds = timerSeconds
    if (sessionStartTime) {
      const now = new Date()
      finalSeconds = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000) - pausedDuration

      // If currently paused, add the current pause duration
      if (timerPaused && pauseStartTime) {
        const currentPauseDuration = Math.floor((now.getTime() - pauseStartTime.getTime()) / 1000)
        finalSeconds -= currentPauseDuration
      }
    }

    console.log('🔵 saveSession called', {
      hasSession: !!session,
      sessionStartTime,
      dwSessionFocusArea,
      finalSeconds,
      durationMinutes: Math.floor(finalSeconds / 60)
    })

    if (session && sessionStartTime && dwSessionFocusArea) {
      try {
        const sessionData = {
          user_id: session.user.id,
          task_id: dwSessionTask?.id || null,
          area: dwSessionFocusArea,
          task_type: dwSessionTaskType || null,
          start_time: sessionStartTime.toISOString(),
          end_time: new Date().toISOString(),
          duration_minutes: Math.floor(finalSeconds / 60)
        }

        console.log('🔵 Inserting session data:', sessionData)

        const { data, error } = await supabase
          .from('deep_work_log')
          .insert(sessionData)
          .select()

        if (error) {
          console.error('🔴 Insert error:', error)
          throw error
        }

        console.log('✅ Session saved successfully:', data)

        if (session) {
          console.log('🔵 Fetching updated sessions for user:', session.user.id)
          await fetchDeepWorkSessions(session.user.id)
        }
      } catch (error) {
        console.error('Error saving deep work session:', error)
      }
    } else {
      console.log('🔴 Cannot save - missing required data:', {
        hasSession: !!session,
        hasStartTime: !!sessionStartTime,
        hasFocusArea: !!dwSessionFocusArea
      })
    }

    setTimerRunning(false)
    setTimerPaused(false)
    setTimerSeconds(0)
    setSessionStartTime(null)
    setPausedDuration(0)
    setPauseStartTime(null)
    setDwSessionTask(null)
    setDwSessionTaskType('')
    setDwSessionFocusArea('')
    setDwTaskSearchTerm('')
    localStorage.removeItem('deepWorkSession')
  }

  const _cancelTimerSession = () => {
    setTimerRunning(false)
    setTimerPaused(false)
    setTimerSeconds(0)
    setSessionStartTime(null)
    setPausedDuration(0)
    setPauseStartTime(null)
    setDwSessionTask(null)
    setDwSessionTaskType('')
    setDwSessionFocusArea('')
    setDwTaskSearchTerm('')
    localStorage.removeItem('deepWorkSession')
  }

  const _formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const _startEditingSession = (sessionData: any) => {
    setEditingSessionId(sessionData.id)
    setEditFormData({
      area: sessionData.area,
      task_type: sessionData.task_type,
      task_id: sessionData.task_id,
      task_name: sessionData.task?.task_name || '',  // Store the task name
      effort_level: sessionData.effort_level,
      notes: sessionData.notes,
      duration_minutes: sessionData.duration_minutes,
      start_time: sessionData.start_time,
      end_time: sessionData.end_time
    })
    setEditTaskSearchTerm(sessionData.task?.task_name || '')
  }

  const roundToQuarterHour = (date: Date): Date => {
    const roundedDate = new Date(date)
    const minutes = roundedDate.getMinutes()
    const remainder = minutes % 15
    const roundedMinutes = remainder < 8 ? minutes - remainder : minutes + (15 - remainder)
    roundedDate.setMinutes(roundedMinutes, 0, 0)
    return roundedDate
  }

  const _startAddingNewSession = () => {
    const now = roundToQuarterHour(new Date())
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    setEditingSessionId('new')
    setEditFormData({
      area: 'Full Stack',
      task_type: '',
      task_name: '',
      task_id: null,
      effort_level: '',
      duration_minutes: 60,
      start_time: oneHourAgo.toISOString(),
      end_time: now.toISOString(),
      notes: ''
    })
    setEditTaskSearchTerm('')
  }

  const cancelEditingSession = () => {
    setEditingSessionId(null)
    setEditFormData({})
    setEditTaskSearchTerm('')
    setShowEditTaskDropdown(false)
  }

  const saveEditedSession = async (sessionId: string) => {
    try {
      // Calculate duration from start and end times
      const startTime = new Date(editFormData.start_time)
      const endTime = new Date(editFormData.end_time)
      const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))

      const sessionData = {
        area: editFormData.area,
        task_type: editFormData.task_type,
        task_id: editFormData.task_id,
        effort_level: editFormData.effort_level,
        notes: editFormData.notes,
        duration_minutes: durationMinutes,
        start_time: editFormData.start_time,
        end_time: editFormData.end_time
      }

      if (sessionId === 'new') {
        // Create new session
        const { error } = await supabase
          .from('deep_work_log')
          .insert({
            ...sessionData,
            user_id: session?.user.id
          })

        if (error) throw error
      } else {
        // Update existing session
        const { error } = await supabase
          .from('deep_work_log')
          .update(sessionData)
          .eq('id', sessionId)

        if (error) throw error
      }

      if (session) fetchDeepWorkSessions(session.user.id)
      setEditingSessionId(null)
      setEditFormData({})
      setEditTaskSearchTerm('')
      setShowEditTaskDropdown(false)
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return

    try {
      const { error } = await supabase
        .from('deep_work_log')
        .delete()
        .eq('id', sessionId)

      if (error) throw error
      if (session) fetchDeepWorkSessions(session.user.id)
      setEditingSessionId(null)
      setEditFormData({})
      setEditTaskSearchTerm('')
      setShowEditTaskDropdown(false)
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  const getAreaColor = (area: Area) => {
    const colors: Record<Area, string> = {
      'Full Stack': '#10b981',
      'Huge Capital': '#a855f7',
      'S4': '#3b82f6',
      '808': '#eab308',
      'Personal': '#ec4899',
      'Golf': '#f97316',
      'Health': '#14b8a6'
    }
    return colors[area] || '#6b7280'
  }

  const _getEffortLevelColor = (effortLevel: EffortLevel | undefined | string) => {
    const colors: Record<string, string> = {
      '$$$ Printer $$$': '#22c55e',  // Bright Green
      '$ Makes Money $': '#15803d',   // Dark Green
      '-$ Save Dat $-': '#fb923c',    // Orange
      ':( No Money ):': '#ef4444',    // Red
      '8) Vibing (8': '#a855f7'       // Purple
    }
    return colors[effortLevel || ''] || '#6b7280'
  }

  const _getTaskTypesByArea = (area: Area | '') => {
    if (area === 'S4') return ['Data', 'Marketing', 'New Build', 'Update Build', 'Sales', 'Planning']
    if (area === 'Huge Capital') return ['Admin', 'New Build', 'Update Build', 'Planning']
    if (area === 'Full Stack') return ['Admin', 'Internal Build', 'Client Build', 'Team', 'Internal Update', 'Client Update', 'Marketing', 'Sales']
    if (area === '808') return ['Online', 'Artists', 'Cost Savings', 'Customer Service', 'Data', 'Fulfillment', 'Automation']
    if (area === 'Personal') return ['Arya', 'Car', 'Cheypow', 'Finances', 'Friends', 'House', 'Life']
    if (area === 'Golf') return ['Content', 'Equipment', 'Practice', 'Golfing', 'Admin']
    if (area === 'Health') return ['Gym', 'Sleep', 'Stretching', 'Walk', 'Yoga']
    return []
  }

  const isToday = (dateStr: string | null) => {
    if (!dateStr) return false
    const taskDateParts = dateStr.split('T')[0].split('-')
    const taskDate = new Date(parseInt(taskDateParts[0]), parseInt(taskDateParts[1]) - 1, parseInt(taskDateParts[2]))
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    taskDate.setHours(0, 0, 0, 0)
    return taskDate.getTime() === today.getTime()
  }

  const isTomorrow = (dateStr: string | null) => {
    if (!dateStr) return false
    const taskDateParts = dateStr.split('T')[0].split('-')
    const taskDate = new Date(parseInt(taskDateParts[0]), parseInt(taskDateParts[1]) - 1, parseInt(taskDateParts[2]))
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    taskDate.setHours(0, 0, 0, 0)
    return taskDate.getTime() === tomorrow.getTime()
  }

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false
    const taskDateParts = dateStr.split('T')[0].split('-')
    const taskDate = new Date(parseInt(taskDateParts[0]), parseInt(taskDateParts[1]) - 1, parseInt(taskDateParts[2]))
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    taskDate.setHours(0, 0, 0, 0)
    return taskDate < today
  }

  let filteredTasks = selectedArea === 'All Areas'
    ? tasks
    : tasks.filter(t => t.area === selectedArea)

  // Apply status filter
  if (selectedStatusFilter !== 'all') {
    switch (selectedStatusFilter) {
      case 'active':
        filteredTasks = filteredTasks.filter(t => t.status !== 'Done')
        break
      case 'completed':
        filteredTasks = filteredTasks.filter(t => t.status === 'Done')
        break
      case 'recurring':
        filteredTasks = filteredTasks.filter(t => t.recurring_type !== undefined && t.recurring_type !== null && t.recurring_type !== 'none')
        break
      case 'overdue':
        filteredTasks = filteredTasks.filter(t => isOverdue(t.due_date) && t.status !== 'Done')
        break
      case 'dueToday':
        filteredTasks = filteredTasks.filter(t => isToday(t.due_date) && t.status !== 'Done')
        break
      case 'completedToday':
        filteredTasks = filteredTasks.filter(t => t.status === 'Done' && t.updated_at && isToday(t.updated_at))
        break
      case 'dueTomorrow':
        filteredTasks = filteredTasks.filter(t => isTomorrow(t.due_date) && t.status !== 'Done')
        break
    }
  }

  const todayTasks = tasks.filter(t => isToday(t.due_date))
  const todayCompleted = todayTasks.filter(t => t.status === 'Done').length
  const todayTotal = todayTasks.length
  const dailyCompletion = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0

  const stats = {
    active: tasks.filter(t => t.status !== 'Done').length,
    completed: tasks.filter(t => t.status === 'Done').length,
    recurring: tasks.filter(t => t.recurring_type !== undefined && t.recurring_type !== null && t.recurring_type !== 'none').length,
    overdue: tasks.filter(t => isOverdue(t.due_date) && t.status !== 'Done').length,
    dueToday: tasks.filter(t => isToday(t.due_date) && t.status !== 'Done').length,
    completedToday: tasks.filter(t => t.status === 'Done' && t.updated_at && isToday(t.updated_at)).length,
    dueTomorrow: tasks.filter(t => isTomorrow(t.due_date) && t.status !== 'Done').length,
    dailyCompletion,
    todayCompleted,
    todayTotal,
  }

  const _areaStats = {
    'All Areas': { count: filteredTasks.length, hours: filteredTasks.reduce((sum, t) => sum + (t.hours_projected || 0), 0) },
    'Full Stack': { count: filteredTasks.filter(t => t.area === 'Full Stack').length, hours: filteredTasks.filter(t => t.area === 'Full Stack').reduce((sum, t) => sum + (t.hours_projected || 0), 0) },
    'Huge Capital': { count: filteredTasks.filter(t => t.area === 'Huge Capital').length, hours: filteredTasks.filter(t => t.area === 'Huge Capital').reduce((sum, t) => sum + (t.hours_projected || 0), 0) },
    'S4': { count: filteredTasks.filter(t => t.area === 'S4').length, hours: filteredTasks.filter(t => t.area === 'S4').reduce((sum, t) => sum + (t.hours_projected || 0), 0) },
    'Personal': { count: filteredTasks.filter(t => t.area === 'Personal').length, hours: filteredTasks.filter(t => t.area === 'Personal').reduce((sum, t) => sum + (t.hours_projected || 0), 0) },
    '808': { count: filteredTasks.filter(t => t.area === '808').length, hours: filteredTasks.filter(t => t.area === '808').reduce((sum, t) => sum + (t.hours_projected || 0), 0) },
    'Health': { count: filteredTasks.filter(t => t.area === 'Health').length, hours: filteredTasks.filter(t => t.area === 'Health').reduce((sum, t) => sum + (t.hours_projected || 0), 0) },
    'Golf': { count: filteredTasks.filter(t => t.area === 'Golf').length, hours: filteredTasks.filter(t => t.area === 'Golf').reduce((sum, t) => sum + (t.hours_projected || 0), 0) },
  }

  // Deep Work Session Calculations
  const getFilteredSessions = () => {
    let filtered = deepWorkSessions

    // Filter by time period
    const now = new Date()
    if (selectedTimePeriod === 'Today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      filtered = filtered.filter(s => new Date(s.start_time) >= todayStart)
    } else if (selectedTimePeriod === 'This Week') {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      weekStart.setHours(0, 0, 0, 0)
      filtered = filtered.filter(s => new Date(s.start_time) >= weekStart)
    } else if (selectedTimePeriod === 'This Month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      filtered = filtered.filter(s => new Date(s.start_time) >= monthStart)
    }

    // Filter by area
    if (selectedDWArea !== 'All Areas') {
      filtered = filtered.filter(s => s.area === selectedDWArea)
    }

    // Filter by effort level
    if (selectedEffortLevel !== 'All Levels') {
      filtered = filtered.filter(s => s.effort_level === selectedEffortLevel)
    }

    return filtered
  }

  const filteredDWSessions = getFilteredSessions()

  const dwStats = {
    totalSessions: filteredDWSessions.length,
    totalMinutes: filteredDWSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
    avgMinutes: filteredDWSessions.length > 0
      ? Math.round(filteredDWSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / filteredDWSessions.length)
      : 0
  }

  const _formatHoursMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const _dwAreaCountsArray = [
    { area: 'All Areas', count: filteredDWSessions.length },
    { area: 'Personal', count: filteredDWSessions.filter(s => s.area === 'Personal').length },
    { area: 'Full Stack', count: filteredDWSessions.filter(s => s.area === 'Full Stack').length },
    { area: 'Huge Capital', count: filteredDWSessions.filter(s => s.area === 'Huge Capital').length },
    { area: 'S4', count: filteredDWSessions.filter(s => s.area === 'S4').length },
    { area: '808', count: filteredDWSessions.filter(s => s.area === '808').length },
    { area: 'Health', count: filteredDWSessions.filter(s => s.area === 'Health').length },
    { area: 'Golf', count: filteredDWSessions.filter(s => s.area === 'Golf').length }
  ]

  const _effortLevelCounts = {
    'All Levels': filteredDWSessions.length,
    '$$$ Printer $$$': filteredDWSessions.filter(s => s.effort_level === '$$$ Printer $$$').length,
    '$ Makes Money $': filteredDWSessions.filter(s => s.effort_level === '$ Makes Money $').length,
    '-$ Save Dat $-': filteredDWSessions.filter(s => s.effort_level === '-$ Save Dat $-').length,
    ':( No Money ):': filteredDWSessions.filter(s => s.effort_level === ':( No Money ):').length,
    '8) Vibing (8': filteredDWSessions.filter(s => s.effort_level === '8) Vibing (8').length
  }

  // Top 5 tasks by duration
  const taskDurations: { [key: string]: { minutes: number, sessions: number, area: string, taskType: string } } = {}
  filteredDWSessions.forEach(session => {
    const taskName = session.task?.task_name || 'Unknown Task'
    if (!taskDurations[taskName]) {
      taskDurations[taskName] = { minutes: 0, sessions: 0, area: session.area, taskType: session.task_type || '' }
    }
    taskDurations[taskName].minutes += session.duration_minutes || 0
    taskDurations[taskName].sessions += 1
  })

  const _top5Tasks = Object.entries(taskDurations)
    .sort((a, b) => b[1].minutes - a[1].minutes)
    .slice(0, 5)
    .map(([taskName, data]) => ({
      taskName,
      minutes: data.minutes,
      sessions: data.sessions,
      area: data.area,
      taskType: data.taskType,
      percent: dwStats.totalMinutes > 0 ? Math.round((data.minutes / dwStats.totalMinutes) * 100) : 0
    }))

  if (loading && !session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a' }}>
        <div style={{ color: '#9ca3af' }}>Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #3b82f6, #a855f7, #ec4899)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '32px',
          width: '100%',
          maxWidth: '448px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #2563eb, #9333ea)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>
              TG Dashboard
            </h1>
            <p style={{ color: '#6b7280' }}>Deep work focused task management</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                required
              />
            </div>

            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(to right, #2563eb, #9333ea)',
                color: 'white',
                borderRadius: '8px',
                fontWeight: '500',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Suppress TS6133 errors for intentionally unused legacy functions
  void _toggleChecklistItem;
  void _toggleTask;
  void _updateTaskFieldInline;
  void _startTimer;
  void _pauseTimer;
  void _saveSession;
  void _cancelTimerSession;
  void _formatTime;
  void _startEditingSession;
  void _startAddingNewSession;
  void _getEffortLevelColor;
  void _getTaskTypesByArea;
  void _areaStats;
  void _formatHoursMinutes;
  void _dwAreaCountsArray;
  void _effortLevelCounts;
  void _top5Tasks;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#1a1a1a', color: '#fff' }}>
      {/* Sticky Sidebar */}
      <div style={{
        width: '240px',
        backgroundColor: '#0f0f0f',
        borderRight: '1px solid #2a2a2a',
        position: 'sticky',
        top: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        {/* Logo/Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #2a2a2a' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            background: 'linear-gradient(to right, #f97316, #eab308)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '4px'
          }}>
            TG Dashboard
          </h1>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>Personal Performance Center</p>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, padding: '16px' }}>
          {/* Main Tab - Tasks */}
          <div style={{ marginBottom: '8px' }}>
            <button
              onClick={() => {
                setActiveMainTab('tasks');
                setActiveTasksSubTab('tasks-list');
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: activeMainTab === 'tasks' ? '#f97316' : 'transparent',
                color: activeMainTab === 'tasks' ? 'white' : '#f97316',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '15px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
              Tasks
            </button>

            {/* Submenu - Deep Work (only show when Tasks is active) */}
            {activeMainTab === 'tasks' && (
              <div style={{ marginTop: '4px', marginLeft: '28px' }}>
                <button
                  onClick={() => setActiveTasksSubTab('deepwork')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    backgroundColor: '#fb923c',
                    color: 'white',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Deep Work
                </button>
              </div>
            )}
          </div>

          {/* Main Tab - Business */}
          <div style={{ marginBottom: '8px' }}>
            <button
              onClick={() => setActiveMainTab('business')}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: activeMainTab === 'business' ? '#a855f7' : 'transparent',
                color: activeMainTab === 'business' ? 'white' : '#a855f7',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '15px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="12" height="12" rx="2" />
                <path d="M2 6h12M6 2v12" />
              </svg>
              Projects
            </button>
          </div>

          {/* Main Tab - Content Library */}
          <div style={{ marginBottom: '8px' }}>
            <button
              onClick={() => setActiveMainTab('content')}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: activeMainTab === 'content' ? '#10b981' : 'transparent',
                color: activeMainTab === 'content' ? 'white' : '#10b981',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '15px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h12M2 8h12M2 13h12" />
                <circle cx="5" cy="3" r="1" fill="currentColor" />
                <circle cx="5" cy="8" r="1" fill="currentColor" />
                <circle cx="5" cy="13" r="1" fill="currentColor" />
              </svg>
              Content Library
            </button>
          </div>

          {/* Main Tab - Finance */}
          <div style={{ marginBottom: '8px' }}>
            <button
              onClick={() => setActiveMainTab('finance')}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: activeMainTab === 'finance' ? '#eab308' : 'transparent',
                color: activeMainTab === 'finance' ? 'white' : '#eab308',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '15px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v6M6 8h4" />
              </svg>
              Finance
            </button>
          </div>

          {/* Main Tab - Notes */}
          <div style={{ marginBottom: '8px' }}>
            <button
              onClick={() => setActiveMainTab('notes')}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: activeMainTab === 'notes' ? '#8b5cf6' : 'transparent',
                color: activeMainTab === 'notes' ? 'white' : '#8b5cf6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '15px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="2" width="10" height="12" rx="1" />
                <path d="M6 6h4M6 9h4M6 12h2" />
              </svg>
              Notes
            </button>
          </div>

          {/* Main Tab - Review Dashboard */}
          <div style={{ marginBottom: '8px' }}>
            <button
              onClick={() => setActiveMainTab('review')}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: activeMainTab === 'review' ? '#ec4899' : 'transparent',
                color: activeMainTab === 'review' ? 'white' : '#ec4899',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '15px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="12" height="12" rx="2" />
                <rect x="5" y="5" width="6" height="2" fill="currentColor" />
                <rect x="5" y="9" width="4" height="2" fill="currentColor" />
              </svg>
              Review
            </button>
          </div>
        </div>

        {/* Deep Work Timer */}
        <div style={{ padding: '16px', borderTop: '1px solid #2a2a2a', borderBottom: '1px solid #2a2a2a' }}>
          <DeepWorkSidebar tasks={tasks} />
        </div>

      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Tasks Hub Tab */}
        {activeMainTab === 'tasks' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Subtab Buttons - Hidden since we now use sidebar submenu */}
            <div style={{ display: 'none' }}>
            </div>

            {/* Tasks List Content */}
            {activeTasksSubTab === 'tasks-list' && (
              <TasksHub />
            )}

            {/* Deep Work Content */}
            {activeTasksSubTab === 'deepwork' && (
              <div style={{ padding: '0 20px' }}>
                <DeepWorkSessions />
              </div>
            )}
          </div>
        )}

        {/* Business Tab */}
        {activeMainTab === 'business' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <BusinessDashboard />
          </div>
        )}

        {/* Content Library Tab */}
        {activeMainTab === 'content' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ContentLibrary />
          </div>
        )}

        {/* Finance Tab */}
        {activeMainTab === 'finance' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <FinanceDashboard />
          </div>
        )}

        {/* Notes Tab */}
        {activeMainTab === 'notes' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <NotesBoard />
          </div>
        )}

        {activeMainTab === 'review' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', color: 'white' }}>
                📊 Review Dashboard
              </h1>

              {/* Area Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

                {/* TASKS Card */}
                <button
                  onClick={() => setActiveMainTab('tasks')}
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: '2px solid #f97316',
                    borderRadius: '12px',
                    padding: '24px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#fb923c'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#f97316'}
                >
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f97316', marginBottom: '12px' }}>
                    ✓ TASKS
                  </div>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                    {Math.round((stats.completed / (stats.active + stats.completed)) * 100) || 0}%
                  </div>
                  <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '12px' }}>
                    {stats.active} active · {stats.completed} complete
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#374151',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.round((stats.completed / (stats.active + stats.completed)) * 100) || 0}%`,
                      height: '100%',
                      backgroundColor: '#3b82f6',
                      transition: 'all 0.3s'
                    }} />
                  </div>
                </button>

                {/* BUSINESS Card - Expanded */}
                <div style={{
                  backgroundColor: '#1a1a1a',
                  border: '2px solid #a855f7',
                  borderRadius: '12px',
                  padding: '24px',
                  gridColumn: 'span 2'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#a855f7', marginBottom: '16px' }}>
                    💼 BUSINESS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {['Full Stack AI', 'Huge Capital', 'S4', '808', 'Service SaaS'].map((businessName) => {
                      const businessTasks = tasks.filter(t => {
                        if (businessName === 'Full Stack AI') return t.area === 'Full Stack'
                        if (businessName === 'Huge Capital') return t.area === 'Huge Capital'
                        if (businessName === 'S4') return t.area === 'S4'
                        if (businessName === '808') return t.area === '808'
                        return false
                      })
                      const totalTasks = businessTasks.length
                      const completedTasks = businessTasks.filter(t => t.status === 'Done').length
                      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

                      return (
                        <div key={businessName} style={{ padding: '12px', backgroundColor: '#0a0a0a', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: 'white' }}>{businessName}</span>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: progress < 33 ? '#ef4444' : progress < 67 ? '#eab308' : '#22c55e' }}>
                              {progress}%
                            </span>
                          </div>
                          <div style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: '#374151',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${progress}%`,
                              height: '100%',
                              backgroundColor: progress < 33 ? '#ef4444' : progress < 67 ? '#eab308' : '#22c55e',
                              transition: 'all 0.3s'
                            }} />
                          </div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                            {completedTasks} of {totalTasks} tasks
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* CONTENT Card */}
                <button
                  onClick={() => setActiveMainTab('content')}
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: '2px solid #10b981',
                    borderRadius: '12px',
                    padding: '24px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#34d399'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#10b981'}
                >
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981', marginBottom: '12px' }}>
                    📚 CONTENT
                  </div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                    Click to view content library
                  </div>
                </button>

                {/* HEALTH Placeholder Card */}
                <div style={{
                  backgroundColor: '#1a1a1a',
                  border: '2px solid #444',
                  borderRadius: '12px',
                  padding: '24px',
                  opacity: 0.5
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '12px' }}>
                    💪 HEALTH
                  </div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                    Coming soon
                  </div>
                </div>

                {/* FINANCES Placeholder Card */}
                <div style={{
                  backgroundColor: '#1a1a1a',
                  border: '2px solid #444',
                  borderRadius: '12px',
                  padding: '24px',
                  opacity: 0.5
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '12px' }}>
                    💰 FINANCES
                  </div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                    Coming soon
                  </div>
                </div>

                {/* LIFE Placeholder Card */}
                <div style={{
                  backgroundColor: '#1a1a1a',
                  border: '2px solid #444',
                  borderRadius: '12px',
                  padding: '24px',
                  opacity: 0.5
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '12px' }}>
                    🌟 LIFE
                  </div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                    Coming soon
                  </div>
                </div>

                {/* GOLF Placeholder Card */}
                <div style={{
                  backgroundColor: '#1a1a1a',
                  border: '2px solid #444',
                  borderRadius: '12px',
                  padding: '24px',
                  opacity: 0.5
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '12px' }}>
                    ⛳ GOLF
                  </div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                    Coming soon
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Deep Work Session Modal */}
      {editingSessionId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={cancelEditingSession}
        >
          <div
            style={{
              backgroundColor: '#1f1f1f',
              borderRadius: '12px',
              width: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                {editingSessionId === 'new' ? 'Add New Deep Work Session' : 'Edit Deep Work Session'}
              </h3>
              <button
                onClick={cancelEditingSession}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Task */}
              <div style={{ marginBottom: '20px', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#fff', marginBottom: '8px', fontWeight: '500' }}>
                  Task
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={editTaskSearchTerm}
                    onChange={(e) => {
                      setEditTaskSearchTerm(e.target.value)
                      setShowEditTaskDropdown(true)
                      setEditFormData({ ...editFormData, task_name: e.target.value, task_id: null })
                    }}
                    onFocus={() => setShowEditTaskDropdown(true)}
                    onBlur={() => setTimeout(() => setShowEditTaskDropdown(false), 200)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      paddingLeft: editFormData.task_id ? '32px' : '12px',
                      backgroundColor: '#2a2a2a',
                      color: 'white',
                      border: '1px solid #444',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                  {editFormData.task_id && (
                    <div style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: (() => {
                        const task = tasks.find(t => t.id === editFormData.task_id)
                        return task ? getAreaColor(task.area) : '#6b7280'
                      })()
                    }} />
                  )}
                </div>

                {/* Task Dropdown */}
                {showEditTaskDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 100
                  }}>
                    {tasks
                      .filter(t =>
                        t.task_name.toLowerCase().includes(editTaskSearchTerm.toLowerCase()) &&
                        t.status !== 'completed'
                      )
                      .slice(0, 5)
                      .map(task => (
                        <div
                          key={task.id}
                          onClick={() => {
                            setEditFormData({
                              ...editFormData,
                              task_id: task.id,
                              task_name: task.task_name,
                              area: task.area,
                              task_type: task.task_type
                            })
                            setEditTaskSearchTerm(task.task_name)
                            setShowEditTaskDropdown(false)
                          }}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #333'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: getAreaColor(task.area),
                              flexShrink: 0
                            }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', color: '#fff' }}>{task.task_name}</div>
                              <div style={{ fontSize: '11px', color: '#6b7280' }}>{task.area}</div>
                            </div>
                          </div>
                        </div>
                      ))}

                    {editTaskSearchTerm && (
                      <div
                        onClick={() => {
                          setEditFormData({
                            ...editFormData,
                            task_id: null,
                            task_name: editTaskSearchTerm
                          })
                          setShowEditTaskDropdown(false)
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#60a5fa'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        + Use "{editTaskSearchTerm}" as custom task
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Focus Area */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#fff', marginBottom: '8px', fontWeight: '500' }}>
                  Focus Area
                </label>
                <select
                  value={editFormData.area || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, area: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#2a2a2a',
                    color: 'white',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Full Stack">Full Stack</option>
                  <option value="Huge Capital">Huge Capital</option>
                  <option value="S4">S4</option>
                  <option value="808">808</option>
                  <option value="Personal">Personal</option>
                  <option value="Golf">Golf</option>
                  <option value="Health">Health</option>
                </select>
              </div>

              {/* Task Type */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#fff', marginBottom: '8px', fontWeight: '500' }}>
                  Task Type
                </label>
                <input
                  type="text"
                  value={editFormData.task_type || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, task_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#2a2a2a',
                    color: 'white',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Money Maker Level */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#fff', marginBottom: '8px', fontWeight: '500' }}>
                  Money Maker Level (Optional)
                </label>
                <select
                  value={editFormData.effort_level || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, effort_level: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#2a2a2a',
                    color: 'white',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select level...</option>
                  <option value="$$$ Printer $$$" style={{ color: '#22c55e' }}>$$$ Printer $$$</option>
                  <option value="$ Makes Money $" style={{ color: '#15803d' }}>$ Makes Money $</option>
                  <option value="-$ Save Dat $-" style={{ color: '#fb923c' }}>-$ Save Dat $-</option>
                  <option value=":( No Money ):" style={{ color: '#ef4444' }}>:( No Money ):</option>
                  <option value="8) Vibing (8" style={{ color: '#a855f7' }}>8) Vibing (8</option>
                </select>
              </div>

              {/* Duration */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#fff', marginBottom: '8px', fontWeight: '500' }}>
                  Duration (minutes) - Auto-calculated
                </label>
                <input
                  type="number"
                  value={editFormData.duration_minutes || 0}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#2a2a2a',
                    color: '#9ca3af',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
                  Duration is automatically calculated from start and end times
                </div>
              </div>

              {/* Start Time */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#fff', marginBottom: '8px', fontWeight: '500' }}>
                  Start Time
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div
                    onClick={() => {
                      const input = document.getElementById('start-date-input') as HTMLInputElement
                      if (input) input.showPicker()
                    }}
                    style={{
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      id="start-date-input"
                      type="date"
                      value={editFormData.start_time ? new Date(editFormData.start_time).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        if (!e.target.value) return
                        const currentTime = editFormData.start_time ? new Date(editFormData.start_time) : new Date()
                        const [year, month, day] = e.target.value.split('-')
                        const newDate = new Date(currentTime)
                        newDate.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day))
                        const newStartTime = newDate.toISOString()

                        // Calculate new duration if end time exists
                        let newFormData = { ...editFormData, start_time: newStartTime }
                        if (editFormData.end_time) {
                          const endTime = new Date(editFormData.end_time)
                          const duration = Math.floor((endTime.getTime() - newDate.getTime()) / (1000 * 60))
                          newFormData.duration_minutes = Math.max(0, duration)
                        }
                        setEditFormData(newFormData)
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#2a2a2a',
                        color: 'white',
                        border: '1px solid #444',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>
                  <div
                    onClick={() => {
                      const input = document.getElementById('start-time-input') as HTMLInputElement
                      if (input) input.showPicker()
                    }}
                    style={{
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      id="start-time-input"
                      type="time"
                      step="900"
                      value={editFormData.start_time ? new Date(editFormData.start_time).toTimeString().slice(0, 5) : ''}
                      onChange={(e) => {
                        if (!e.target.value) return
                        const [hours, minutes] = e.target.value.split(':')
                        const date = editFormData.start_time ? new Date(editFormData.start_time) : new Date()
                        date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
                        const newStartTime = date.toISOString()

                        // Calculate new duration if end time exists
                        let newFormData = { ...editFormData, start_time: newStartTime }
                        if (editFormData.end_time) {
                          const endTime = new Date(editFormData.end_time)
                          const duration = Math.floor((endTime.getTime() - date.getTime()) / (1000 * 60))
                          newFormData.duration_minutes = Math.max(0, duration)
                        }
                        setEditFormData(newFormData)
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#2a2a2a',
                        color: 'white',
                        border: '1px solid #444',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Current: {editFormData.start_time ? new Date(editFormData.start_time).toLocaleString() : 'N/A'}
                </div>
              </div>

              {/* End Time */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#fff', marginBottom: '8px', fontWeight: '500' }}>
                  End Time
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div
                    onClick={() => {
                      const input = document.getElementById('end-date-input') as HTMLInputElement
                      if (input) input.showPicker()
                    }}
                    style={{
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      id="end-date-input"
                      type="date"
                      value={editFormData.end_time ? new Date(editFormData.end_time).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        if (!e.target.value) return
                        const currentTime = editFormData.end_time ? new Date(editFormData.end_time) : new Date()
                        const [year, month, day] = e.target.value.split('-')
                        const newDate = new Date(currentTime)
                        newDate.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day))
                        const newEndTime = newDate.toISOString()

                        // Calculate new duration if start time exists
                        let newFormData = { ...editFormData, end_time: newEndTime }
                        if (editFormData.start_time) {
                          const startTime = new Date(editFormData.start_time)
                          const duration = Math.floor((newDate.getTime() - startTime.getTime()) / (1000 * 60))
                          newFormData.duration_minutes = Math.max(0, duration)
                        }
                        setEditFormData(newFormData)
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#2a2a2a',
                        color: 'white',
                        border: '1px solid #444',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>
                  <div
                    onClick={() => {
                      const input = document.getElementById('end-time-input') as HTMLInputElement
                      if (input) input.showPicker()
                    }}
                    style={{
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      id="end-time-input"
                      type="time"
                      step="900"
                      value={editFormData.end_time ? new Date(editFormData.end_time).toTimeString().slice(0, 5) : ''}
                      onChange={(e) => {
                        if (!e.target.value) return
                        const [hours, minutes] = e.target.value.split(':')
                        const date = editFormData.end_time ? new Date(editFormData.end_time) : new Date()
                        date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
                        const newEndTime = date.toISOString()

                        // Calculate new duration if start time exists
                        let newFormData = { ...editFormData, end_time: newEndTime }
                        if (editFormData.start_time) {
                          const startTime = new Date(editFormData.start_time)
                          const duration = Math.floor((date.getTime() - startTime.getTime()) / (1000 * 60))
                          newFormData.duration_minutes = Math.max(0, duration)
                        }
                        setEditFormData(newFormData)
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#2a2a2a',
                        color: 'white',
                        border: '1px solid #444',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Current: {editFormData.end_time ? new Date(editFormData.end_time).toLocaleString() : 'N/A'}
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#fff', marginBottom: '8px', fontWeight: '500' }}>
                  Notes
                </label>
                <textarea
                  value={editFormData.notes || ''}
                  placeholder="Session notes..."
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#2a2a2a',
                    color: 'white',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              {editingSessionId !== 'new' ? (
                <button
                  onClick={() => deleteSession(editingSessionId)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Delete Session
                </button>
              ) : (
                <div></div>
              )}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={cancelEditingSession}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: '#9ca3af',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveEditedSession(editingSessionId)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {editingSessionId === 'new' ? 'Add Session' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Edit/Add Modal */}
      {(editingTask || showAddTaskModal) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => {
            setEditingTask(null)
            setShowAddTaskModal(false)
            setTaskFormData({})
          }}
        >
          <div
            style={{
              backgroundColor: '#0f1419',
              borderRadius: '12px',
              padding: '28px',
              width: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              border: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', margin: 0 }}>
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button
                onClick={() => {
                  setEditingTask(null)
                  setShowAddTaskModal(false)
                  setTaskFormData({})
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  fontSize: '28px',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>

            {/* Task Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#9ca3af', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Task Name</label>
              <input
                type="text"
                value={taskFormData.task_name || (editingTask?.task_name || '')}
                onChange={(e) => setTaskFormData({ ...taskFormData, task_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#1a1f2e',
                  border: '1px solid #2d3748',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
                placeholder="Enter task name..."
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#9ca3af', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Description</label>
              <textarea
                value={taskFormData.description || (editingTask?.description || '')}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#1a1f2e',
                  border: '1px solid #2d3748',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  minHeight: '70px',
                  outline: 'none',
                  resize: 'vertical'
                }}
                placeholder="Task description..."
              />
            </div>

            {/* Area and Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Area</label>
                <select
                  value={taskFormData.area || (editingTask?.area || '')}
                  onChange={(e) => setTaskFormData({ ...taskFormData, area: e.target.value as Area })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1a1f2e',
                    border: '1px solid #2d3748',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="">Select area...</option>
                  <option value="Personal">Personal</option>
                  <option value="Full Stack">Full Stack</option>
                  <option value="Huge Capital">Huge Capital</option>
                  <option value="S4">S4</option>
                  <option value="808">808</option>
                  <option value="Golf">Golf</option>
                  <option value="Health">Health</option>
                </select>
              </div>
              <div>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Type</label>
                <select
                  value={taskFormData.task_type || (editingTask?.task_type || '')}
                  onChange={(e) => setTaskFormData({ ...taskFormData, task_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1a1f2e',
                    border: '1px solid #2d3748',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="">Select type...</option>
                  {(taskFormData.area || editingTask?.area) === 'Health' && (
                    <>
                      <option value="Admin">Admin</option>
                      <option value="Meditation">Meditation</option>
                      <option value="Workout">Workout</option>
                      <option value="Walk">Walk</option>
                      <option value="Yoga">Yoga</option>
                    </>
                  )}
                  {(taskFormData.area || editingTask?.area) === 'S4' && (
                    <>
                      <option value="Data">Data</option>
                      <option value="Marketing">Marketing</option>
                      <option value="New Build">New Build</option>
                      <option value="Update Build">Update Build</option>
                      <option value="Sales">Sales</option>
                      <option value="Planning">Planning</option>
                    </>
                  )}
                  {(taskFormData.area || editingTask?.area) === 'Huge Capital' && (
                    <>
                      <option value="Admin">Admin</option>
                      <option value="New Build">New Build</option>
                      <option value="Update Build">Update Build</option>
                      <option value="Planning">Planning</option>
                    </>
                  )}
                  {(taskFormData.area || editingTask?.area) === 'Golf' && (
                    <>
                      <option value="Content">Content</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Practice">Practice</option>
                      <option value="Golfing">Golfing</option>
                      <option value="Admin">Admin</option>
                    </>
                  )}
                  {(taskFormData.area || editingTask?.area) === 'Full Stack' && (
                    <>
                      <option value="Admin">Admin</option>
                      <option value="Internal Build">Internal Build</option>
                      <option value="Client Build">Client Build</option>
                      <option value="Team">Team</option>
                      <option value="Internal Update">Internal Update</option>
                      <option value="Client Update">Client Update</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                    </>
                  )}
                  {(taskFormData.area || editingTask?.area) === '808' && (
                    <>
                      <option value="Online">Online</option>
                      <option value="Artists">Artists</option>
                      <option value="Cost Savings">Cost Savings</option>
                      <option value="Customer Service">Customer Service</option>
                      <option value="Data">Data</option>
                      <option value="Fulfillment">Fulfillment</option>
                      <option value="Automation">Automation</option>
                    </>
                  )}
                  {(taskFormData.area || editingTask?.area) === 'Personal' && (
                    <>
                      <option value="Arya">Arya</option>
                      <option value="Car">Car</option>
                      <option value="Cheypow">Cheypow</option>
                      <option value="Finances">Finances</option>
                      <option value="Friends">Friends</option>
                      <option value="House">House</option>
                      <option value="Life">Life</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Priority and Effort Level */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Priority</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {['Low', 'Medium', 'High'].map((level) => (
                    <label key={level} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'white' }}>
                      <input
                        type="radio"
                        name="priority"
                        value={level}
                        checked={(taskFormData.priority || editingTask?.priority) === level}
                        onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value as Priority })}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px' }}>{level}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Money Maker</label>
                <select
                  value={taskFormData.effort_level || (editingTask?.effort_level || '')}
                  onChange={(e) => setTaskFormData({ ...taskFormData, effort_level: e.target.value as EffortLevel })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1a1f2e',
                    border: '1px solid #2d3748',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="">Select money maker...</option>
                  <option value="$$$ Printer $$$" style={{ color: '#22c55e' }}>$$$ Printer $$$</option>
                  <option value="$ Makes Money $" style={{ color: '#15803d' }}>$ Makes Money $</option>
                  <option value="-$ Save Dat $-" style={{ color: '#fb923c' }}>-$ Save Dat $-</option>
                  <option value=":( No Money ):" style={{ color: '#ef4444' }}>:( No Money ):</option>
                  <option value="8) Vibing (8" style={{ color: '#a855f7' }}>8) Vibing (8</option>
                </select>
              </div>
            </div>

            {/* Hours */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Hours Projected</label>
                <input
                  type="number"
                  value={taskFormData.hours_projected ?? (editingTask?.hours_projected || 0)}
                  onChange={(e) => setTaskFormData({ ...taskFormData, hours_projected: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1a1f2e',
                    border: '1px solid #2d3748',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Hours Worked</label>
                <input
                  type="number"
                  value={taskFormData.hours_worked ?? (editingTask?.hours_worked || 0)}
                  onChange={(e) => setTaskFormData({ ...taskFormData, hours_worked: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1a1f2e',
                    border: '1px solid #2d3748',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Due Date */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#9ca3af', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Due Date</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  value={taskFormData.due_date ? new Date(taskFormData.due_date).toISOString().split('T')[0] : (editingTask?.due_date ? new Date(editingTask.due_date).toISOString().split('T')[0] : '')}
                  onChange={(e) => setTaskFormData({ ...taskFormData, due_date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    backgroundColor: '#1a1f2e',
                    border: '1px solid #2d3748',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>📅</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              {editingTask && (
                <button
                  onClick={() => deleteTask(editingTask.id)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#dc2626',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}
                >
                  Delete Task
                </button>
              )}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setEditingTask(null)
                    setShowAddTaskModal(false)
                    setTaskFormData({})
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#e5e7eb',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (editingTask) {
                      // Update task
                      await supabase.from('tasks').update({
                        task_name: taskFormData.task_name || editingTask.task_name,
                        description: taskFormData.description || editingTask.description,
                        area: taskFormData.area || editingTask.area,
                        task_type: taskFormData.task_type || editingTask.task_type,
                        priority: taskFormData.priority || editingTask.priority,
                        effort_level: taskFormData.effort_level || editingTask.effort_level,
                        due_date: taskFormData.due_date || editingTask.due_date,
                        'Hours Projected': taskFormData.hours_projected ?? editingTask.hours_projected,
                        'Hours Worked': taskFormData.hours_worked ?? editingTask.hours_worked
                      }).eq('id', editingTask.id)
                      if (session) fetchTasks(session.user.id)
                    } else {
                      // Create new task
                      await supabase.from('tasks').insert({
                        task_name: taskFormData.task_name,
                        description: taskFormData.description || '',
                        area: taskFormData.area || 'Personal',
                        task_type: taskFormData.task_type || '',
                        status: 'Not started',
                        automation: 'Manual',
                        priority: taskFormData.priority || 'Medium',
                        effort_level: taskFormData.effort_level || '$ Makes Money $',
                        due_date: taskFormData.due_date || null,
                        user_id: session?.user.id,
                        'Hours Projected': taskFormData.hours_projected || 0,
                        'Hours Worked': taskFormData.hours_worked || 0
                      })
                      if (session) fetchTasks(session.user.id)
                    }
                    setEditingTask(null)
                    setShowAddTaskModal(false)
                    setTaskFormData({})
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#60a5fa',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && datePickerTask && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => {
            setShowDatePicker(false)
            setDatePickerTask(null)
          }}
        >
          <div
            style={{
              backgroundColor: '#0f1419',
              borderRadius: '12px',
              padding: '28px',
              width: '400px',
              border: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', margin: 0 }}>
                {datePickerTask.status === 'Done' ? 'Change Completion Date' : 'Change Due Date'}
              </h2>
              <button
                onClick={() => {
                  setShowDatePicker(false)
                  setDatePickerTask(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  fontSize: '28px',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#9ca3af', display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Task: {datePickerTask.task_name}
              </label>
              <label style={{ color: '#9ca3af', display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                {datePickerTask.status === 'Done' ? 'New Completion Date' : 'New Due Date'}
              </label>
              <input
                type="date"
                defaultValue={datePickerTask.status === 'Done' ? (datePickerTask.completed_at?.split('T')[0] || '') : (datePickerTask.due_date || '')}
                onChange={(e) => {
                  if (e.target.value) {
                    updateTaskDueDate(datePickerTask.id, e.target.value, datePickerTask.status === 'Done')
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#1a1f2e',
                  border: '1px solid #2d3748',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>

            <button
              onClick={() => {
                setShowDatePicker(false)
                setDatePickerTask(null)
              }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#60a5fa',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

