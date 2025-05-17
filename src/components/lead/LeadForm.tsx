'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModalDialog } from '@/components/ui/ModalDialog';
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
import { Lead, TeamMember, LeadSource } from '@/types';
import { 
  User, 
  Building2, 
  Flag, 
  ClipboardList, 
  BarChart3,
  Phone,
  AtSign,
  Globe,
  Users
} from 'lucide-react';
import { initializeTeamMembers } from '@/utils/storage';

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
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    priority: initialData?.priority || 'medium',
    notes: initialData?.notes || '',
    status: initialData?.status || 'new',
    leadSource: initialData?.leadSource || undefined,
    assignedTo: initialData?.assignedTo || undefined,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember>>({});

  useEffect(() => {
    const loadedMembers = initializeTeamMembers();
    setTeamMembers(loadedMembers);
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.company?.trim()) {
      newErrors.company = 'Company is required';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleSelectChange = (name: string, value: string | undefined) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched when submitting
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);
    
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

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validate();
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-50 text-green-700' },
    { value: 'medium', label: 'Medium', color: 'bg-orange-50 text-orange-700' },
    { value: 'high', label: 'High', color: 'bg-red-50 text-red-700' },
  ];

  const statusOptions = [
    { value: 'new', label: 'New', color: 'bg-blue-50 text-blue-700' },
    { value: 'contacted', label: 'Contacted', color: 'bg-purple-50 text-purple-700' },
    { value: 'qualified', label: 'Qualified', color: 'bg-indigo-50 text-indigo-700' },
    { value: 'won', label: 'Won', color: 'bg-green-50 text-green-700' },
    { value: 'lost', label: 'Lost', color: 'bg-gray-50 text-gray-700' },
  ];

  const leadSourceOptions = [
    { value: 'website', label: 'Website', color: 'bg-blue-50 text-blue-700' },
    { value: 'referral', label: 'Referral', color: 'bg-green-50 text-green-700' },
    { value: 'social_media', label: 'Social Media', color: 'bg-purple-50 text-purple-700' },
    { value: 'email_campaign', label: 'Email Campaign', color: 'bg-yellow-50 text-yellow-700' },
    { value: 'event', label: 'Event', color: 'bg-pink-50 text-pink-700' },
    { value: 'other', label: 'Other', color: 'bg-gray-50 text-gray-700' },
  ];

  const getPriorityColor = (priority: string) => {
    return priorityOptions.find(option => option.value === priority)?.color || '';
  };

  const getStatusColor = (status: string) => {
    return statusOptions.find(option => option.value === status)?.color || '';
  };

  return (
    <ModalDialog isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Lead' : 'Add New Lead'}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-1">
          <label htmlFor="name" className="text-xs font-medium mb-1 text-gray-700 flex items-center gap-1.5">
            <User size={14} strokeWidth={1.5} className="text-gray-500" />
            <span>Name</span>
          </label>
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Input
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              className={`text-xs ${touched.name && errors.name ? 'border-red-500 focus-visible:ring-red-200' : ''}`}
              placeholder="Contact name"
              required
            />
          </motion.div>
          <AnimatePresence>
            {touched.name && errors.name && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-red-500 text-xs mt-1"
              >
                {errors.name}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        
        <div className="space-y-1">
          <label htmlFor="company" className="text-xs font-medium mb-1  text-gray-700 flex items-center gap-1.5">
            <Building2 size={14} strokeWidth={1.5} className="text-gray-500" />
            <span>Company</span>
          </label>
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Input
              id="company"
              name="company"
              value={formData.company || ''}
              onChange={handleChange}
              onBlur={() => handleBlur('company')}
              className={`text-xs ${touched.company && errors.company ? 'border-red-500 focus-visible:ring-red-200' : ''}`}
              placeholder="Company name"
              required
            />
          </motion.div>
          <AnimatePresence>
            {touched.company && errors.company && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-red-500 text-xs mt-1"
              >
                {errors.company}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-medium mb-1 text-gray-700 flex items-center gap-1.5">
              <AtSign size={14} strokeWidth={1.5} className="text-gray-500" />
              <span>Email (Optional)</span>
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              className={`text-xs ${touched.email && errors.email ? 'border-red-500 focus-visible:ring-red-200' : ''}`}
              placeholder="Email address"
            />
            <AnimatePresence>
              {touched.email && errors.email && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-red-500 text-xs mt-1"
                >
                  {errors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          
          <div className="space-y-1">
            <label htmlFor="phone" className="text-xs font-medium mb-1 text-gray-700 flex items-center gap-1.5">
              <Phone size={14} strokeWidth={1.5} className="text-gray-500" />
              <span>Phone (Optional)</span>
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={handleChange}
              className="text-xs"
              placeholder="Phone number"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium mb-1  text-gray-700 flex items-center gap-1.5">
              <Flag size={14} strokeWidth={1.5} className="text-gray-500" />
              <span>Priority</span>
            </label>
            <Select
              name="priority"
              value={formData.priority as string}
              onValueChange={(value) => handleSelectChange('priority', value)}
            >
              <SelectTrigger 
                className={`w-full text-xs ${getPriorityColor(formData.priority as string)}`} 
                onClick={(e) => e.stopPropagation()}
              >
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent onClick={(e) => e.stopPropagation()} className="text-xs">
                {priorityOptions.map(option => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className={`text-xs hover:bg-gray-50 ${option.value === formData.priority ? option.color : 'bg-transparent'}`}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium mb-1  text-gray-700 flex items-center gap-1.5">
              <BarChart3 size={14} strokeWidth={1.5} className="text-gray-500" />
              <span>Status</span>
            </label>
            <Select
              name="status"
              value={formData.status as string}
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger 
                className={`w-full text-xs ${getStatusColor(formData.status as string)}`} 
                onClick={(e) => e.stopPropagation()}
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent onClick={(e) => e.stopPropagation()} className="text-xs">
                {statusOptions.map(option => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className={`text-xs hover:bg-gray-50 ${option.value === formData.status ? option.color : 'bg-transparent'}`}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium mb-1 text-gray-700 flex items-center gap-1.5">
              <Globe size={14} strokeWidth={1.5} className="text-gray-500" />
              <span>Lead Source (Optional)</span>
            </label>
            <Select
              name="leadSource"
              value={formData.leadSource || "none"}
              onValueChange={(value) => handleSelectChange('leadSource', value === "none" ? undefined : value as LeadSource)}
            >
              <SelectTrigger 
                className="w-full text-xs" 
                onClick={(e) => e.stopPropagation()}
              >
                <SelectValue placeholder="Select lead source" />
              </SelectTrigger>
              <SelectContent onClick={(e) => e.stopPropagation()} className="text-xs">
                <SelectItem value="none" className="text-xs hover:bg-gray-50">
                  Not specified
                </SelectItem>
                {leadSourceOptions.map(option => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="text-xs hover:bg-gray-50"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium mb-1 text-gray-700 flex items-center gap-1.5">
              <Users size={14} strokeWidth={1.5} className="text-gray-500" />
              <span>Assigned To (Optional)</span>
            </label>
            <Select
              name="assignedTo"
              value={formData.assignedTo || "unassigned"}
              onValueChange={(value) => handleSelectChange('assignedTo', value === "unassigned" ? "" : value)}
            >
              <SelectTrigger 
                className="w-full text-xs" 
                onClick={(e) => e.stopPropagation()}
              >
                <SelectValue placeholder="Assign to team member" />
              </SelectTrigger>
              <SelectContent onClick={(e) => e.stopPropagation()} className="text-xs">
                <SelectItem value="unassigned" className="text-xs hover:bg-gray-50">
                  Unassigned
                </SelectItem>
                {Object.values(teamMembers).map(member => (
                  <SelectItem 
                    key={member.id} 
                    value={member.id}
                    className="text-xs hover:bg-gray-50"
                  >
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-1">
          <label htmlFor="notes" className="text-xs font-medium mb-1  text-gray-700 flex items-center gap-1.5">
            <ClipboardList size={14} strokeWidth={1.5} className="text-gray-500" />
            <span>Notes</span>
          </label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            rows={3}
            className="w-full text-xs"
            placeholder="Additional notes about this lead..."
          />
        </div>
        
        <motion.div 
          className="flex justify-end gap-2 pt-3"
          initial={{ opacity: 0.9, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button type="button" variant="ghost" onClick={onClose} size="sm" className="text-xs">
            Cancel
          </Button>
          <Button type="submit" size="sm" className="text-xs">
            {initialData ? 'Update' : 'Create'}
          </Button>
        </motion.div>
      </form>
    </ModalDialog>
  );
};
