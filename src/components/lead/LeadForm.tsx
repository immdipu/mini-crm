'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/Select';
import { Lead } from '@/types';

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
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
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
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium mb-1 block">Name</label>
          <Input
            id="name"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            className={errors.name ? 'border-red-500' : ''}
            placeholder="Contact name"
            required
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        
        <div className="space-y-1">
          <label htmlFor="company" className="text-sm font-medium mb-1 block">Company</label>
          <Input
            id="company"
            name="company"
            value={formData.company || ''}
            onChange={handleChange}
            className={errors.company ? 'border-red-500' : ''}
            placeholder="Company name"
            required
          />
          {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium mb-1 block">Priority</label>
            <Select
              name="priority"
              value={formData.priority as string}
              onValueChange={(value) => handleSelectChange('priority', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium mb-1 block">Status</label>
            <Select
              name="status"
              value={formData.status as string}
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-1">
          <label htmlFor="notes" className="text-sm font-medium mb-1 block">Notes</label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            rows={3}
            className="w-full"
            placeholder="Additional notes about this lead..."
          />
        </div>
        
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
