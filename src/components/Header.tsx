import { useState } from 'react'
import { Bell, Search, Download, Menu, X } from 'lucide-react'
import { exportAndDownload } from '../utils/dataExport'

interface HeaderProps {
  onMobileSidebarToggle?: () => void
}

const Header = ({ onMobileSidebarToggle }: HeaderProps) => {
  const [isExporting, setIsExporting] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
    <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Good Evening, Tyler</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">{currentDate}</p>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>

          {/* Export Data */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            title="Export all data as JSON backup"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export Data'}
          </button>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>

        {/* Mobile Menu Button - Double icon for sidebar + mobile menu */}
        <div className="md:hidden flex items-center gap-2">
          {/* Sidebar Toggle */}
          <button
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={onMobileSidebarToggle}
            aria-label="Toggle sidebar"
            title="Open navigation"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          {/* Mobile Actions Toggle */}
          <button
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Bell className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Actions Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-gray-200 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="flex gap-2">
            {/* Export Data */}
            <button
              onClick={() => {
                handleExport()
                setMobileMenuOpen(false)
              }}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              title="Export all data as JSON backup"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>

            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
