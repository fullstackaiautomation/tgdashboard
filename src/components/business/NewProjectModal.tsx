import type { FC } from 'react';
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useBusinesses } from '../../hooks/useBusinesses';
import { useCreateProject } from '../../hooks/useProjects';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBusinessId?: string;
}

export const NewProjectModal: FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  defaultBusinessId
}) => {
  const { data: businesses } = useBusinesses();
  const createProject = useCreateProject();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBusinessId, setSelectedBusinessId] = useState(defaultBusinessId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !selectedBusinessId) {
      alert('Please provide a project name and select an area');
      return;
    }

    setIsSubmitting(true);
    try {
      await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        business_id: selectedBusinessId,
        status: 'active'
      });

      // Reset form
      setName('');
      setDescription('');
      setSelectedBusinessId(defaultBusinessId || '');
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-100">Create New Project</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Area Selection */}
          <div>
            <Label htmlFor="area" className="text-gray-300 mb-2 block">
              Area <span className="text-red-500">*</span>
            </Label>
            <select
              id="area"
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select an area...</option>
              {businesses?.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Name */}
          <div>
            <Label htmlFor="name" className="text-gray-300 mb-2 block">
              Project Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Dashboard Redesign"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-500"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-gray-300 mb-2 block">
              Description (optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project..."
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 min-h-[100px]"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting || !name.trim() || !selectedBusinessId}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};