import { useState } from 'react'
import { Bell, Search, Download, Menu } from 'lucide-react'
import { exportAndDownload } from '../utils/dataExport'

interface HeaderProps {
  onMenuClick?: () => void
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const [isExporting, setIsExporting] = useState(false)
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const handleExport = async () => {
    if (isExporting) return

    setIsExporting(true)
    try {
      await exportAndDownload()
      alert('✅ Data exported successfully!')
    } catch (error) {
      console.error('Export failed:', error)
      alert('❌ Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 md:px-8 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          )}

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Good Evening, Tyler</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{currentDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-40 sm:w-52 md:w-64"
            />
          </div>

          {/* Export Data */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-2 sm:px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium"
            title="Export all data as JSON backup"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export Data'}</span>
            <span className="sm:hidden">{isExporting ? '...' : 'Export'}</span>
          </button>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
