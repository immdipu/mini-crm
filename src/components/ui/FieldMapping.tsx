'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FieldMapping as FieldMappingType } from '@/types';
import { Button } from './Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './Select';
import { Loader } from './Loader';
import {
  ArrowRight,
  Plus,
  Trash2,
  AlertCircle,
  Check,
  X,
  ArrowDownUp,
  HelpCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/shadcn-tooltip";

interface FieldMappingProps {
  sourceFields: string[];
  targetFields: {
    name: string;
    label: string;
    required: boolean;
    dataType: 'string' | 'enum' | 'number' | 'boolean' | 'date';
    enumValues?: string[];
  }[];
  mappings: FieldMappingType[];
  onChange: (mappings: FieldMappingType[]) => void;

  isLoading?: boolean;
  className?: string;
}

export const FieldMapping: React.FC<FieldMappingProps> = ({
  sourceFields,
  targetFields,
  mappings,
  onChange,
  isLoading = false,
  className = '',
}) => {
  const [localMappings, setLocalMappings] = useState<FieldMappingType[]>(mappings);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [autoMappingStatus, setAutoMappingStatus] = useState<'idle' | 'success' | 'partial' | 'failed'>('idle');

  // Update local mappings when props change
  useEffect(() => {
    setLocalMappings(mappings);
  }, [mappings]);

  // Validate and update validation errors
  useEffect(() => {
    const errors: Record<string, string> = {};

    // Check for required target fields
    targetFields.forEach(field => {
      if (field.required) {
        const isMapped = localMappings.some(m => m.targetField === field.name);
        if (!isMapped) {
          errors[field.name] = `${field.label} is required`;
        }
      }
    });

    // Check for empty or placeholder values
    localMappings.forEach((mapping, index) => {
      if (mapping.targetField === '_empty' || !mapping.targetField) {
        errors[`mapping_${index}`] = `Mapping #${index + 1} has no target field selected`;
      }
      if (mapping.sourceField === '_empty' || !mapping.sourceField) {
        errors[`mapping_source_${index}`] = `Mapping #${index + 1} has no source field selected`;
      }
    });

    // Check for duplicate target fields
    const targetFieldCounts: Record<string, number> = {};
    localMappings.forEach(mapping => {
      if (mapping.targetField !== '_empty' && mapping.targetField) {
        targetFieldCounts[mapping.targetField] = (targetFieldCounts[mapping.targetField] || 0) + 1;
      }
    });

    Object.entries(targetFieldCounts).forEach(([field, count]) => {
      if (count > 1 && field !== '_empty') {
        errors[field] = `${field} is mapped multiple times`;
      }
    });

    setValidationErrors(errors);
  }, [localMappings, targetFields]);

  // Handle mapping change
  const handleMappingChange = (index: number, field: keyof FieldMappingType, value: string) => {
    const newMappings = [...localMappings];

    if (field === 'targetField') {
      // Find the target field details
      const targetField = targetFields.find(f => f.name === value);
      if (targetField) {
        newMappings[index] = {
          ...newMappings[index],
          targetField: value,
          required: targetField.required,
          dataType: targetField.dataType,
          enumValues: targetField.enumValues,
        };
      }
    } else {
      // We know the field exists and is a string
      newMappings[index] = {
        ...newMappings[index],
        [field]: value
      };
    }

    setLocalMappings(newMappings);
    onChange(newMappings);
  };

  // Add a new mapping
  const addMapping = () => {
    const newMapping: FieldMappingType = {
      sourceField: sourceFields[0] || '_empty',
      targetField: '_empty',
      required: false,
      dataType: 'string',
    };

    setLocalMappings([...localMappings, newMapping]);
    onChange([...localMappings, newMapping]);
  };

  // Remove a mapping
  const removeMapping = (index: number) => {
    const newMappings = localMappings.filter((_, i) => i !== index);
    setLocalMappings(newMappings);
    onChange(newMappings);
  };

  // Auto-map fields based on name similarity
  const autoMapFields = () => {
    setAutoMappingStatus('idle');

    // Create a new array for mappings
    const newMappings: FieldMappingType[] = [];
    let mappedCount = 0;

    // Try to map fields with exact or similar names
    targetFields.forEach(targetField => {
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
        mappedCount++;
      }
    });

    // Set status based on how many fields were mapped
    if (mappedCount === 0) {
      setAutoMappingStatus('failed');
    } else if (mappedCount < targetFields.length) {
      setAutoMappingStatus('partial');
    } else {
      setAutoMappingStatus('success');
    }

    setLocalMappings(newMappings);
    onChange(newMappings);

    // Reset status after 3 seconds
    setTimeout(() => {
      setAutoMappingStatus('idle');
    }, 3000);
  };

  // Render the auto-mapping status message
  const renderAutoMappingStatus = () => {
    switch (autoMappingStatus) {
      case 'success':
        return (
          <span className="text-green-600 flex items-center text-xs">
            <Check size={12} className="mr-1" /> All fields mapped successfully
          </span>
        );
      case 'partial':
        return (
          <span className="text-yellow-600 flex items-center text-xs">
            <AlertCircle size={12} className="mr-1" /> Some fields mapped, please review
          </span>
        );
      case 'failed':
        return (
          <span className="text-red-600 flex items-center text-xs">
            <X size={12} className="mr-1" /> No fields could be automatically mapped
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`field-mapping ${className}`}>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader variant="spinner" text="Analyzing data..." />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">Map Your Data Fields</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-pointer text-gray-400 hover:text-gray-600">
                      <HelpCircle size={16} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[300px] p-3 text-xs">
                    <div className="space-y-2">
                      <p className="font-medium">Map fields from your source data to the CRM fields.</p>
                      <p>Required fields are marked with an asterisk (*).</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {renderAutoMappingStatus()}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={autoMapFields}
                className="text-xs h-7 px-2 flex items-center"
              >
                <ArrowDownUp size={12} className="mr-1" />
                Auto-Map Fields
              </Button>
            </div>
          </div>

          <div className="space-y-3 mb-4 bg-gray-50 p-3 rounded-md border border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <div className="text-xs text-gray-500 font-medium">Source Field</div>
              <div className="text-xs text-gray-500 font-medium">CRM Field</div>
              <div className="w-8"></div>
            </div>

            {localMappings.map((mapping, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3 p-2 rounded-md bg-white border border-gray-100 shadow-sm"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex-1">
                  <Select
                    value={mapping.sourceField}
                    onValueChange={(value) => handleMappingChange(index, 'sourceField', value)}
                  >
                    <SelectTrigger className="w-full text-xs bg-gray-50">
                      <SelectValue placeholder="Select source field" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {sourceFields.length > 0 ? (
                        sourceFields.map((field) => (
                          <SelectItem key={field} value={field || '_empty'} className="text-xs">
                            {field || 'Empty Field'}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="_empty" className="text-xs">
                          No fields available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />

                <div className="flex-1">
                  <Select
                    value={mapping.targetField}
                    onValueChange={(value) => handleMappingChange(index, 'targetField', value)}
                  >
                    <SelectTrigger className={`w-full text-xs bg-gray-50 ${validationErrors[mapping.targetField] ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select target field" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="_empty" className="text-xs">
                        Select a field
                      </SelectItem>
                      {targetFields.map((field) => (
                        <SelectItem key={field.name} value={field.name} className="text-xs">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMapping(index)}
                  className="h-7 w-7 rounded-full hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </Button>
              </motion.div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={addMapping}
            className="w-full text-xs flex items-center justify-center bg-white hover:bg-gray-50 border-dashed"
          >
            <Plus size={14} className="mr-1" />
            Add Field Mapping
          </Button>

          {Object.keys(validationErrors).length > 0 && (
            <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-xs font-medium text-red-700 mb-1">Please fix the following errors:</h4>
              <ul className="text-xs text-red-600 list-disc pl-4">
                {Object.values(validationErrors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}


        </>
      )}
    </div>
  );
};
