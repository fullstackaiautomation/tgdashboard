import * as React from 'react';
import { Search, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { AutomationModal } from '@/components/automations';
import { useAutomations } from '@/hooks/useAutomations';
import { useCreateAutomation } from '@/hooks/useAutomations';
import type { Automation, CreateAutomationDTO, UpdateAutomationDTO } from '@/types/automation';

interface AutomationsSelectorProps {
  selectedIds: string[];
  onChange: (automationIds: string[]) => void;
}

export const AutomationsSelector: React.FC<AutomationsSelectorProps> = ({
  selectedIds,
  onChange,
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { data: automations = [] } = useAutomations();
  const createAutomation = useCreateAutomation();

  const selectedAutomations = automations.filter((a) =>
    selectedIds.includes(a.id)
  );

  const filteredAutomations = automations.filter((a) => {
    if (selectedIds.includes(a.id)) return false;
    return a.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelectAutomation = (automation: Automation) => {
    const newIds = [...selectedIds, automation.id];
    onChange(newIds);
    setSearchQuery('');
    // Keep popover open to allow adding more automations
  };

  const handleRemoveAutomation = (id: string) => {
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  const handleCreateAutomation = async (
    data: CreateAutomationDTO | (UpdateAutomationDTO & { id?: string })
  ) => {
    await createAutomation.mutateAsync(data as CreateAutomationDTO);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Selected Automations */}
      {selectedAutomations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedAutomations.map((automation) => (
            <div
              key={automation.id}
              className="flex items-center gap-2 bg-gray-800/50 rounded-full px-3 py-1 border border-gray-700 text-sm text-gray-300"
            >
              <span className="max-w-xs truncate">{automation.name}</span>
              <button
                onClick={() => handleRemoveAutomation(automation.id)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search and Selection Popover */}
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal text-xs bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-300"
          >
            <Search className="mr-2 h-3 w-3" />
            {selectedAutomations.length === 0
              ? 'Search automations...'
              : 'Add more automations'}
          </Button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            className="z-50 w-80 rounded-md border border-gray-700 bg-gray-900 p-3 shadow-lg"
            sideOffset={4}
            align="start"
          >
            <div className="space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search automations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 bg-gray-800 border-gray-700 text-gray-100 text-xs focus:ring-purple-500"
                  autoFocus
                />
              </div>

              {/* Automations List */}
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredAutomations.length === 0 ? (
                  <div className="text-center text-xs text-gray-500 py-4">
                    {automations.length === 0
                      ? 'No automations yet'
                      : 'No automations match your search'}
                  </div>
                ) : (
                  filteredAutomations.map((automation) => (
                    <button
                      key={automation.id}
                      type="button"
                      onClick={() => handleSelectAutomation(automation)}
                      className="w-full text-left px-3 py-2 rounded text-xs hover:bg-gray-700 text-gray-300 hover:text-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="font-medium truncate">{automation.name}</div>
                      <div className="text-gray-500 text-xs mt-1">
                        {automation.purpose} • {automation.platform}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setOpen(false)}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-300"
                >
                  Done
                </Button>
                <Button
                  onClick={() => {
                    setIsModalOpen(true);
                    setOpen(false);
                  }}
                  size="sm"
                  className="flex-1 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add New
                </Button>
              </div>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {/* Automation Modal */}
      <AutomationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateAutomation}
        automation={null}
      />
    </div>
  );
};
