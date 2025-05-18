'use client';

import { useState, useEffect } from 'react';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { Button } from '@/components/ui/Button';
import { FieldMapping } from '@/components/ui/FieldMapping';
import { FieldMapping as FieldMappingType } from '@/types';
import { Loader } from '@/components/ui/Loader';

interface IntegrationFieldMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (mappings: FieldMappingType[]) => void;
  sourceFields: string[];
  providerName: string;
  isLoadingFields: boolean;
}

// Define the target fields structure
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

export const IntegrationFieldMappingModal = ({
  isOpen,
  onClose,
  onComplete,
  sourceFields,
  providerName,
  isLoadingFields
}: IntegrationFieldMappingModalProps) => {
  const [mappings, setMappings] = useState<FieldMappingType[]>([]);

  // Try to auto-map fields when source fields are loaded
  useEffect(() => {
    if (sourceFields.length > 0) {
      const newMappings: FieldMappingType[] = [];
      
      // Try to map fields based on name similarity
      TARGET_FIELDS.forEach(targetField => {
        // First try exact match (case insensitive)
        let sourceField = sourceFields.find(
          sf => sf.toLowerCase() === targetField.name.toLowerCase()
        );

        // If no exact match, try to find a field that contains the target field name
        if (!sourceField) {
          sourceField = sourceFields.find(
            sf => sf.toLowerCase().includes(targetField.name.toLowerCase()) ||
                  targetField.name.toLowerCase().includes(sf.toLowerCase())
          );
        }

        if (sourceField) {
          newMappings.push({
            sourceField,
            targetField: targetField.name,
            required: targetField.required,
            dataType: targetField.dataType,
            enumValues: targetField.enumValues,
          });
        }
      });
      
      setMappings(newMappings);
    }
  }, [sourceFields]);

  // Handle mapping changes
  const handleMappingChange = (newMappings: FieldMappingType[]) => {
    setMappings(newMappings);
  };

  // Handle completion
  const handleComplete = () => {
    // Filter out any mappings with _empty values
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
    <ModalDialog 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Map Fields from ${providerName}`} 
      maxWidth="xl"
    >
      <div className="space-y-4">
        {isLoadingFields ? (
          <div className="flex justify-center py-8">
            <Loader variant="spinner" text={`Loading fields from ${providerName}...`} />
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Match fields from your {providerName} data to your CRM board fields. This mapping will be used when syncing data.
            </p>

            {/* Field mapping component */}
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
                  Import with This Mapping
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </ModalDialog>
  );
}; 