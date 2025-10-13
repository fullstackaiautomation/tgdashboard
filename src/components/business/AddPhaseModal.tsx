import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreatePhase, usePhases } from '../../hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddPhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export const AddPhaseModal: FC<AddPhaseModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'paused' | 'completed' | 'archived'>('active');
  const [sequenceOrder, setSequenceOrder] = useState<number>(1);

  const createPhase = useCreatePhase();
  const { data: existingPhases } = usePhases(projectId);

  // Calculate the next sequence number when modal opens
  useEffect(() => {
    if (isOpen && existingPhases) {
      const maxSequence = existingPhases.length > 0
        ? Math.max(...existingPhases.map(p => p.sequence_order))
        : 0;
      setSequenceOrder(maxSequence + 1);
    }
  }, [isOpen, existingPhases]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Phase name is required');
      return;
    }

    try {
      await createPhase.mutateAsync({
        project_id: projectId,
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        sequence_order: sequenceOrder,
      });

      // Reset form
      setName('');
      setDescription('');
      setStatus('active');
      setSequenceOrder(1);

      onClose();
    } catch (error) {
      console.error('Failed to create phase:', error);
      alert('Failed to create phase. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-100">Add Phase</h2>
            <p className="text-sm text-gray-400 mt-1">to {projectName}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 p-0 hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Phase Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phase Name *
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Planning, Development, Testing"
              className="bg-gray-900 border-gray-700 text-white"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this phase..."
              rows={3}
              className="bg-gray-900 border-gray-700 text-white resize-none"
            />
          </div>

          {/* Status and Sequence */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Order
              </label>
              <Input
                type="number"
                value={sequenceOrder}
                onChange={(e) => setSequenceOrder(parseInt(e.target.value) || 1)}
                min="1"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPhase.isPending || !name.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createPhase.isPending ? 'Creating...' : 'Create Phase'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
