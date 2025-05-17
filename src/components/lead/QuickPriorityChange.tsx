'use client';

import { Flag, Check } from 'lucide-react';
import { Lead, Priority } from '@/types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface QuickPriorityChangeProps {
  lead: Lead;
  onPriorityChange: (lead: Lead, newPriority: Priority) => void;
}

// Priority options with colors
const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
  { value: 'medium', label: 'Medium', color: 'bg-orange-100 text-orange-700', dotColor: 'bg-orange-500' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500' },
];

export const QuickPriorityChange = ({ lead, onPriorityChange }: QuickPriorityChangeProps) => {
  const handlePriorityChange = (newPriority: Priority) => {
    if (newPriority !== lead.priority) {
      onPriorityChange(lead, newPriority);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50 flex items-center"
            title="Change Priority"
          >
            <Flag size={12} />
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[180px] p-0" 
          align="end" 
          sideOffset={5}
        >
          <div className="text-xs font-medium text-gray-500 px-2 py-2 border-b">
            Change Priority
          </div>
          <div className="py-1">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePriorityChange(option.value as Priority)}
                className={cn(
                  "w-full text-left px-2 py-1.5 text-xs flex items-center gap-2 hover:bg-gray-50",
                  lead.priority === option.value && "bg-gray-50"
                )}
              >
                <span className={`w-2 h-2 rounded-full ${option.dotColor}`}></span>
                <span>{option.label}</span>
                {lead.priority === option.value && (
                  <Check className="ml-auto h-3 w-3 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
