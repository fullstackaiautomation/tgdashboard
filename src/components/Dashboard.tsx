import { useState } from 'react'
import Sidebar from './Sidebar'
import TodoList from './TodoList'
import Header from './Header'
import FinanceDashboard from './finance/FinanceDashboard'
import ContentLibrary from './ContentLibrary'

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('todos')

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto bg-gray-50">
          {activeSection === 'todos' && <TodoList />}
          {activeSection === 'overview' && (
            <div className="max-w-7xl mx-auto p-8">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-4">Overview</h2>
                <p className="text-gray-600">Your dashboard overview will appear here.</p>
              </div>
            </div>
          )}
          {activeSection === 'calendar' && (
            <div className="max-w-7xl mx-auto p-8">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-4">Calendar</h2>
                <p className="text-gray-600">Your calendar will appear here.</p>
              </div>
            </div>
          )}
          {activeSection === 'content' && <ContentLibrary />}
          {activeSection === 'finance' && <FinanceDashboard />}
          {activeSection === 'health' && (
            <div className="max-w-7xl mx-auto p-8">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-4">Health & Fitness</h2>
                <p className="text-gray-600">Your health tracking will appear here.</p>
              </div>
            </div>
          )}
          {activeSection === 'settings' && (
            <div className="max-w-7xl mx-auto p-8">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-4">Settings</h2>
                <p className="text-gray-600">Your settings will appear here.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Dashboard
