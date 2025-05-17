'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Lead, Priority, Status } from '@/types';

interface LeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> | Lead) => void;
  initialData?: Lead;
}

export const LeadForm = ({ isOpen, onClose, onSubmit, initialData }: LeadFormProps) => {
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: initialData?.name || '',
    company: initialData?.company || '',
    priority: initialData?.priority || 'medium',
    notes: initialData?.notes || '',
    status: initialData?.status || 'new',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.company?.trim()) {
      newErrors.company = 'Company is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear the error for this field if it exists
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    if (initialData) {
      onSubmit({
        ...initialData,
        ...formData as Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>,
      });
    } else {
      onSubmit(formData as Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>);
    }
    
    onClose();
  };

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Lead' : 'Add New Lead'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          name="name"
          value={formData.name || ''}
          onChange={handleChange}
          error={errors.name}
          fullWidth
          placeholder="Contact name"
          required
        />
        
        <Input
          label="Company"
          name="company"
          value={formData.company || ''}
          onChange={handleChange}
          error={errors.company}
          fullWidth
          placeholder="Company name"
          required
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Priority"
            name="priority"
            value={formData.priority as string}
            onChange={handleChange}
            options={priorityOptions}
            fullWidth
          />
          
          <Select
            label="Status"
            name="status"
            value={formData.status as string}
            onChange={handleChange}
            options={statusOptions}
            fullWidth
          />
        </div>
        
        <Textarea
          label="Notes"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          rows={3}
          fullWidth
          placeholder="Additional notes about this lead..."
        />
        
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
