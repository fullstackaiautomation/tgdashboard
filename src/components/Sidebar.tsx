import { useState } from 'react'
import {
  ListTodo,
  FolderKanban,
  DollarSign,
  Heart,
  BarChart3,
  BookMarked,
  Calendar,
  Clock,
  TrendingUp,
  FileText,
  Target,
  ChevronRight
} from 'lucide-react'

interface SubPage {
  id: string
  label: string
  icon: any
}

interface MainPage {
  id: string
  label: string
  icon: any
  color: string
  subPages?: SubPage[]
}

interface SidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
}

const Sidebar = ({ activeSection, setActiveSection }: SidebarProps) => {
  const [hoveredPage, setHoveredPage] = useState<string | null>(null)

  const mainPages: MainPage[] = [
    {
      id: 'tasks',
      label: 'Tasks',
      icon: ListTodo,
      color: '#f97316', // orange
      subPages: [
        { id: 'tasks', label: 'Tasks', icon: ListTodo },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'dailytime', label: 'Daily Time', icon: Clock }
      ]
    },
    {
      id: 'business',
      label: 'Projects',
      icon: FolderKanban,
      color: '#a855f7', // purple
      subPages: []
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: DollarSign,
      color: '#eab308', // yellow
      subPages: []
    },
    {
      id: 'health',
      label: 'Health',
      icon: Heart,
      color: '#14b8a6', // teal
      subPages: []
    },
    {
      id: 'review',
      label: 'Review',
      icon: BarChart3,
      color: '#ec4899', // pink
      subPages: [
        { id: 'review', label: 'Review Dashboard', icon: BarChart3 },
        { id: 'analytics', label: 'Deep Work Sessions', icon: Clock },
        { id: 'insights', label: 'Insights', icon: TrendingUp },
        { id: 'planning', label: 'Time Allocation Planning', icon: Target }
      ]
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: BookMarked,
      color: '#10b981', // green
      subPages: [
        { id: 'content', label: 'Content Library', icon: BookMarked },
        { id: 'notes', label: 'Notes', icon: FileText }
      ]
    }
  ]

  const handleMainPageClick = (page: MainPage) => {
    // If page has subpages, navigate to first subpage, otherwise navigate to page itself
    if (page.subPages && page.subPages.length > 0) {
      setActiveSection(page.subPages[0].id)
    } else {
      setActiveSection(page.id)
    }
  }

  const isPageActive = (page: MainPage) => {
    if (activeSection === page.id) return true
    if (page.subPages) {
      return page.subPages.some(sub => sub.id === activeSection)
    }
    return false
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col relative">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          TG Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">Personal Command Center</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {mainPages.map((page) => {
          const Icon = page.icon
          const isActive = isPageActive(page)

          return (
            <div
              key={page.id}
              className="relative"
              onMouseEnter={() => setHoveredPage(page.id)}
              onMouseLeave={() => setHoveredPage(null)}
            >
              <button
                onClick={() => handleMainPageClick(page)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  isActive
                    ? 'font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: isActive ? page.color : 'transparent',
                  color: isActive ? 'white' : page.color
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{page.label}</span>
                </div>
                {page.subPages && page.subPages.length > 0 && (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* Submenu on hover */}
              {page.subPages && page.subPages.length > 0 && hoveredPage === page.id && (
                <div
                  className="absolute left-full top-0 ml-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-[200px]"
                  onMouseEnter={() => setHoveredPage(page.id)}
                  onMouseLeave={() => setHoveredPage(null)}
                >
                  {page.subPages.map((subPage) => {
                    const SubIcon = subPage.icon
                    const isSubActive = activeSection === subPage.id

                    return (
                      <button
                        key={subPage.id}
                        onClick={() => setActiveSection(subPage.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                          isSubActive
                            ? 'bg-gray-100 font-medium'
                            : 'hover:bg-gray-50'
                        }`}
                        style={{
                          color: isSubActive ? page.color : '#374151'
                        }}
                      >
                        <SubIcon className="w-4 h-4" />
                        <span className="text-sm">{subPage.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            TG
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Tyler Grassmick</p>
            <p className="text-xs text-gray-500">Premium</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
