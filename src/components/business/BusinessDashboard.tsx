import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useBusinesses } from '../../hooks/useBusinesses';
import { useProjects } from '../../hooks/useProjects';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { supabase } from '../../lib/supabase';
import { ProjectCard } from './ProjectCard';

export const BusinessDashboard: FC = () => {
  const { data: businesses, isLoading: businessesLoading } = useBusinesses();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID for real-time sync
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // Enable real-time sync for Business pages too
  useRealtimeSync(userId);

  const selectedBusiness = businesses?.find(b => b.id === selectedBusinessId);
  const { data: projects, isLoading: projectsLoading } = useProjects(selectedBusinessId || undefined);

  if (businessesLoading) {
    return (
      <div className="p-6">
        <div className="text-gray-400">Loading businesses...</div>
      </div>
    );
  }

  if (!businesses || businesses.length === 0) {
    return (
      <div className="p-6">
        <div className="text-gray-400 text-center py-12">
          No businesses yet. Create your first business to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Business Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Business
        </label>
        <select
          value={selectedBusinessId || ''}
          onChange={(e) => setSelectedBusinessId(e.target.value || null)}
          className="w-full md:w-1/2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose a business...</option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </select>
      </div>

      {selectedBusiness && (
        <>
          {/* Business Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: selectedBusiness.color }}
              />
              <h1 className="text-2xl font-bold text-white">{selectedBusiness.name}</h1>
            </div>
            {selectedBusiness.description && (
              <p className="text-gray-400">{selectedBusiness.description}</p>
            )}
          </div>

          {/* Projects Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Projects</h2>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                onClick={() => {
                  // TODO: Implement create project modal
                  console.log('Create project');
                }}
              >
                + New Project
              </button>
            </div>

            {projectsLoading ? (
              <div className="text-gray-400">Loading projects...</div>
            ) : !projects || projects.length === 0 ? (
              <div className="text-gray-400 text-center py-12 border border-gray-700 rounded-lg">
                No projects yet. Create your first project to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} businessId={selectedBusinessId || ''} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
