import type { FC } from 'react'
import { useState } from 'react'
import { Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DatePickerDialogProps {
  value: string | null
  onChange: (date: string | null) => void
  label?: string
}

export const DatePickerDialog: FC<DatePickerDialogProps> = ({
  value,
  onChange,
  label = 'Select Date',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(
    value ? new Date(value) : new Date()
  )
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth())
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear())

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day)
    const dateString = newDate.toISOString().split('T')[0]
    onChange(dateString)
    setSelectedDate(newDate)
    setIsOpen(false)
  }

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setViewYear(parseInt(e.target.value, 10))
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setViewMonth(parseInt(e.target.value, 10))
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const daysInMonth = getDaysInMonth(viewMonth, viewYear)
  const firstDay = getFirstDayOfMonth(viewMonth, viewYear)
  const days = []

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  // Days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const selectedDateString = value ? value.split('T')[0] : null
  const isToday = selectedDateString === new Date().toISOString().split('T')[0]

  const displayDate = value
    ? new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Select date'

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full h-10 justify-start text-left font-normal bg-slate-800 border-slate-700 text-gray-100 hover:bg-slate-700"
      >
        <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
        <span className="flex-1 truncate">{displayDate}</span>
        {value && (
          <X
            className="h-4 w-4 flex-shrink-0 opacity-50 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
          />
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="!bg-slate-900 border-slate-700 w-fit p-0 gap-0">
          <DialogHeader className="bg-slate-800 border-b border-slate-700 p-4">
            <DialogTitle className="text-gray-100">{label}</DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {/* Month and Year Selectors */}
            <div className="flex gap-2">
              <select
                value={viewMonth}
                onChange={handleMonthChange}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {months.map((month, idx) => (
                  <option key={month} value={idx}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={viewYear}
                onChange={handleYearChange}
                className="w-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {Array.from({ length: 20 }, (_, i) => viewYear - 10 + i).map(
                  (year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold text-gray-400 py-2"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                  const isSelected =
                    day &&
                    selectedDateString ===
                      `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => day && handleDateSelect(day)}
                      disabled={!day}
                      className={`
                        h-8 rounded-md text-sm font-medium transition-all
                        ${
                          !day
                            ? 'opacity-0 cursor-default'
                            : isSelected
                              ? 'bg-purple-600 text-white hover:bg-purple-700'
                              : isToday && day
                                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                : 'text-gray-300 hover:bg-slate-700'
                        }
                      `}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2 border-t border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 h-9"
              >
                Cancel
              </Button>
              {value && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onChange(null)
                    setIsOpen(false)
                  }}
                  className="flex-1 h-9 text-red-400 hover:bg-red-900/20 border-red-900/50"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
