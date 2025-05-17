'use client';

import { BarChart3, Check } from 'lucide-react';
import { Lead, Status } from '@/types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface QuickStatusChangeProps {
  lead: Lead;
  onStatusChange: (lead: Lead, newStatus: Status) => void;
}

// Status options with colors
const statusOptions = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500' },
  { value: 'contacted', label: 'Contacted', color: 'bg-purple-100 text-purple-700', dotColor: 'bg-purple-500' },
  { value: 'qualified', label: 'Qualified', color: 'bg-indigo-100 text-indigo-700', dotColor: 'bg-indigo-500' },
  { value: 'won', label: 'Won', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500' },
];

export const QuickStatusChange = ({ lead, onStatusChange }: QuickStatusChangeProps) => {
  const handleStatusChange = (newStatus: Status) => {
    if (newStatus !== lead.status) {
      onStatusChange(lead, newStatus);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={`p-1 text-gray-400 transition-all duration-200 rounded-full hover:bg-gray-50 flex items-center group`}
            title="Change Status"
          >
            <BarChart3
              size={12}
              className={`transition-colors duration-200 group-hover:${
                lead.status === 'new' ? 'text-blue-500' :
                lead.status === 'contacted' ? 'text-purple-500' :
                lead.status === 'qualified' ? 'text-indigo-500' :
                lead.status === 'won' ? 'text-green-500' :
                lead.status === 'lost' ? 'text-red-500' : 'text-gray-600'
              }`}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[180px] p-0"
          align="end"
          sideOffset={5}
        >
          <div className="text-xs font-medium text-gray-500 px-2 py-2 border-b">
            Change Status
          </div>
          <div className="py-1">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value as Status)}
                className={cn(
                  "w-full text-left px-2 py-1.5 text-xs flex items-center gap-2 hover:bg-gray-50",
                  lead.status === option.value && "bg-gray-50"
                )}
              >
                <span className={`w-2 h-2 rounded-full ${option.dotColor}`}></span>
                <span>{option.label}</span>
                {lead.status === option.value && (
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
