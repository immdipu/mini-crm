'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { TeamMemberForm } from './TeamMemberForm';
import { TeamMember } from '@/types';
import { 
  createTeamMember, 
  updateTeamMember, 
  deleteTeamMember,
  initializeTeamMembers
} from '@/utils/storage';
import { User, Trash2, Edit, UserPlus } from 'lucide-react';

export const TeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedMembers = initializeTeamMembers();
    setTeamMembers(loadedMembers);
    setIsLoaded(true);
  }, []);

  const handleOpenAddModal = () => {
    setEditingMember(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(undefined);
  };

  const handleAddTeamMember = (teamMember: Omit<TeamMember, 'id' | 'createdAt'>) => {
    const { teamMembers: updatedTeamMembers } = createTeamMember(teamMember, teamMembers);
    setTeamMembers(updatedTeamMembers);
  };

  const handleUpdateTeamMember = (teamMember: TeamMember) => {
    const { teamMembers: updatedTeamMembers } = updateTeamMember(teamMember, teamMembers);
    setTeamMembers(updatedTeamMembers);
  };

  const handleDeleteTeamMember = (id: string) => {
    if (window.confirm('Are you sure you want to delete this team member?')) {
      const { teamMembers: updatedTeamMembers } = deleteTeamMember(id, teamMembers, {});
      setTeamMembers(updatedTeamMembers);
    }
  };

  const handleSubmit = (data: Omit<TeamMember, 'id' | 'createdAt'> | TeamMember) => {
    if ('id' in data) {
      handleUpdateTeamMember(data as TeamMember);
    } else {
      handleAddTeamMember(data);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const sortedMembers = Object.values(teamMembers).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-semibold text-gray-700">Team Members</h2>
        <Button 
          onClick={handleOpenAddModal} 
          size="sm" 
          className="text-xs flex items-center gap-1"
        >
          <UserPlus size={14} />
          <span>Add Member</span>
        </Button>
      </div>

      <AnimatePresence>
        {sortedMembers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-50 rounded-md p-6 text-center text-gray-500 text-xs"
          >
            No team members yet. Click &apos;Add Member&apos; to create your first team member.
          </motion.div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {sortedMembers.map(member => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-gray-200 rounded-md p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden text-gray-500">
                    {member.avatarUrl ? (
                      <Image 
                        src={member.avatarUrl} 
                        alt={member.name} 
                        width={32} 
                        height={32}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to a user icon if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                        }}
                      />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">{member.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">{member.role}</p>
                      <span className="text-gray-300">•</span>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(member)}
                    className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Edit team member"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteTeamMember(member.id)}
                    className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                    aria-label="Delete team member"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <TeamMemberForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={editingMember}
      />
    </div>
  );
};
