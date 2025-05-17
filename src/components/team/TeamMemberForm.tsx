'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TeamMember } from '@/types';
import { User, AtSign, Briefcase } from 'lucide-react';

interface TeamMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (teamMember: Omit<TeamMember, 'id' | 'createdAt'> | TeamMember) => void;
  initialData?: TeamMember;
}

export const TeamMemberForm = ({ isOpen, onClose, onSubmit, initialData }: TeamMemberFormProps) => {
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    role: initialData?.role || '',
    avatarUrl: initialData?.avatarUrl || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.role?.trim()) {
      newErrors.role = 'Role is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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
        ...formData as Omit<TeamMember, 'id' | 'createdAt'>,
      });
    } else {
      onSubmit(formData as Omit<TeamMember, 'id' | 'createdAt'>);
    }
    
    onClose();
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validate();
  };

  return (
    <ModalDialog isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Team Member' : 'Add Team Member'}>
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
              placeholder="Team member name"
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
          <label htmlFor="email" className="text-xs font-medium mb-1 text-gray-700 flex items-center gap-1.5">
            <AtSign size={14} strokeWidth={1.5} className="text-gray-500" />
            <span>Email</span>
          </label>
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              className={`text-xs ${touched.email && errors.email ? 'border-red-500 focus-visible:ring-red-200' : ''}`}
              placeholder="Email address"
              required
            />
          </motion.div>
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
          <label htmlFor="role" className="text-xs font-medium mb-1 text-gray-700 flex items-center gap-1.5">
            <Briefcase size={14} strokeWidth={1.5} className="text-gray-500" />
            <span>Role</span>
          </label>
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Input
              id="role"
              name="role"
              value={formData.role || ''}
              onChange={handleChange}
              onBlur={() => handleBlur('role')}
              className={`text-xs ${touched.role && errors.role ? 'border-red-500 focus-visible:ring-red-200' : ''}`}
              placeholder="Job role or title"
              required
            />
          </motion.div>
          <AnimatePresence>
            {touched.role && errors.role && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-red-500 text-xs mt-1"
              >
                {errors.role}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        
        <div className="space-y-1">
          <label htmlFor="avatarUrl" className="text-xs font-medium mb-1 text-gray-700 flex items-center gap-1.5">
            <User size={14} strokeWidth={1.5} className="text-gray-500" />
            <span>Avatar URL (Optional)</span>
          </label>
          <Input
            id="avatarUrl"
            name="avatarUrl"
            value={formData.avatarUrl || ''}
            onChange={handleChange}
            className="text-xs"
            placeholder="https://example.com/avatar.jpg"
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
