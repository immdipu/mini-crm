'use client';

import { useState } from 'react';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { Button } from '@/components/ui/Button';
import { FieldMapping } from '@/components/ui/FieldMapping';
import { FieldMapping as FieldMappingType } from '@/types';
import { FileText } from 'lucide-react';

interface FieldMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (mappings: FieldMappingType[]) => void;
  sourceFields: string[];
  sourceType: 'csv' | 'json';
  previewData?: Record<string, unknown>[];
}

const TARGET_FIELDS: {
  name: string;
  label: string;
  required: boolean;
  dataType: 'string' | 'enum' | 'number' | 'boolean' | 'date';
  enumValues?: string[];
}[] = [
  { name: 'name', label: 'Name', required: true, dataType: 'string' },
  { name: 'company', label: 'Company', required: true, dataType: 'string' },
  { name: 'email', label: 'Email', required: false, dataType: 'string' },
  { name: 'phone', label: 'Phone', required: false, dataType: 'string' },
  {
    name: 'priority',
    label: 'Priority',
    required: true,
    dataType: 'enum',
    enumValues: ['low', 'medium', 'high']
  },
  { name: 'notes', label: 'Notes', required: false, dataType: 'string' },
  {
    name: 'status',
    label: 'Status',
    required: false,
    dataType: 'enum',
    enumValues: ['new', 'contacted', 'qualified', 'won', 'lost']
  },
  {
    name: 'leadSource',
    label: 'Lead Source',
    required: false,
    dataType: 'enum',
    enumValues: ['website', 'referral', 'social_media', 'email_campaign', 'event', 'other']
  },
  { name: 'assignedTo', label: 'Assigned To', required: false, dataType: 'string' },
];

export const FieldMappingModal = ({
  isOpen,
  onClose,
  onComplete,
  sourceFields
}: FieldMappingModalProps) => {
  const [mappings, setMappings] = useState<FieldMappingType[]>([]);
  
  const handleMappingChange = (newMappings: FieldMappingType[]) => {
    setMappings(newMappings);
  };

  const handleComplete = () => {
    const validMappings = mappings.filter(
      mapping => mapping.sourceField !== '_empty' &&
                mapping.targetField !== '_empty' &&
                mapping.sourceField &&
                mapping.targetField
    );

    onComplete(validMappings);
    onClose();
  };

  return (
    <ModalDialog isOpen={isOpen} onClose={onClose} title="Map Your Data Fields" maxWidth="xl">
      <div className="space-y-4">
        <FieldMapping
          sourceFields={sourceFields}
          targetFields={TARGET_FIELDS}
          mappings={mappings}
          onChange={handleMappingChange}
        />
        <div className="flex justify-between items-center gap-2 pt-4 border-t mt-4">
          <div className="text-xs text-gray-500">
            {mappings.filter(m => m.targetField !== '_empty' && m.sourceField !== '_empty').length} fields mapped
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} size="sm" className="text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={handleComplete}
              disabled={mappings.length === 0}
            >
              <FileText size={12} className="mr-1" />
              Import with This Mapping
            </Button>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
};
