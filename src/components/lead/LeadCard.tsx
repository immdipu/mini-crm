'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lead, Status, TeamMember } from '@/types';

import { Card } from '@/components/ui/card';
import { useLeadDrag, useLeadDrop } from '@/hooks/useLeadDragDrop';
import { initializeTeamMembers } from '@/utils/storage';
import { AtSign, Phone, Globe, Users, ChevronDown, Calendar } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  index: number;
  columnId: Status;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  moveCard: (dragIndex: number, hoverIndex: number, sourceColumn: Status, targetColumn: Status) => void;
}

export const LeadCard = ({ lead, index, columnId, onEdit, onDelete, moveCard }: LeadCardProps) => {
  const [showActions, setShowActions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember>>({});

  useEffect(() => {
    // Load team members
    const loadedMembers = initializeTeamMembers();
    setTeamMembers(loadedMembers);
  }, []);



  const getLeadSourceLabel = (source?: string) => {
    switch (source) {
      case 'website': return 'Website';
      case 'referral': return 'Referral';
      case 'social_media': return 'Social Media';
      case 'email_campaign': return 'Email Campaign';
      case 'event': return 'Event';
      case 'other': return 'Other';
      default: return null;
    }
  };

  const formatDate = (timestamp: number | undefined) => {
    try {
      if (typeof timestamp !== 'number' || isNaN(timestamp)) {
        return 'No date';
      }

      const date = new Date(timestamp);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date error';
    }
  };


  const { isDragging, drag } = useLeadDrag(lead, index, columnId);
  const { drop } = useLeadDrop(columnId, index, moveCard);


  const cardRef = useRef<HTMLDivElement>(null);


  const attachRefs = (element: HTMLDivElement | null) => {

    drag(element);

    drop.current = element;

    if (cardRef) {
      cardRef.current = element;
    }
  };

  return (
    <motion.div
      ref={attachRefs}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        y: 0,
        boxShadow: isDragging ? '0 10px 20px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)'
      }}
      exit={{ opacity: 0, height: 0 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 50,
        duration: 0.15
      }}
      className={`relative rounded-md ${isDragging ? 'z-10' : 'z-0'}`}
      data-lead-id={lead.id}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Card className={`p-0  rounded-md border-none bg-white cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 ${isDragging ? 'opacity-50' : 'opacity-100'} ${showDetails ? 'ring-1 ring-blue-100' : ''} relative overflow-hidden`}>
        {/* Priority vertical bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
          lead.priority === 'high' ? 'bg-red-500' :
          lead.priority === 'medium' ? 'bg-orange-500' :
          'bg-green-500'
        }`}></div>

        <div className="p-3 pl-4">
          {/* Basic info - Always visible */}
          <div className="flex items-start justify-between">
            <div className="mr-2">
              <h3 className="text-sm font-medium text-gray-900 mb-1 truncate max-w-[170px]">
                {lead.name}
              </h3>
              <p className="text-xs text-gray-500 truncate max-w-[170px]">
                {lead.company}
              </p>
            </div>

            <div className="relative h-[22px] min-w-[40px]">

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: showActions ? 1 : 0,
                  scale: showActions ? 1 : 0.8,
                  x: showActions ? 0 : 10
                }}
                transition={{
                  duration: 0.2,
                  ease: "easeInOut",
                  delay: showActions ? 0.05 : 0
                }}
                className="absolute top-0 right-0 flex gap-1 bg-white/90 backdrop-blur-sm rounded-full p-0.5 shadow-sm"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(lead);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (lead && lead.id) {
                      onDelete(lead.id);
                    }
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-50"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </motion.div>
            </div>
          </div>

          {/* Expandable Details Section - Above the arrow */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  duration: 0.3,
                  opacity: { duration: 0.2 },
                  height: { duration: 0.3 }
                }}
                className="overflow-hidden mt-3"
              >
                {/* Contact info */}
                <div className="space-y-2">
                  {lead.email && (
                    <div className="flex items-center text-xs text-gray-600 gap-1">
                      <AtSign size={12} className="text-gray-400" />
                      <span className="truncate max-w-[200px]">{lead.email}</span>
                    </div>
                  )}

                  {lead.phone && (
                    <div className="flex items-center text-xs text-gray-600 gap-1">
                      <Phone size={12} className="text-gray-400" />
                      <span>{lead.phone}</span>
                    </div>
                  )}

                  {lead.leadSource && (
                    <div className="flex items-center text-xs text-gray-600 gap-1">
                      <Globe size={12} className="text-gray-400" />
                      <span>{getLeadSourceLabel(lead.leadSource)}</span>
                    </div>
                  )}

                  {lead.assignedTo && teamMembers[lead.assignedTo] && (
                    <div className="flex items-center text-xs text-gray-600 gap-1">
                      <Users size={12} className="text-gray-400" />
                      <span>{teamMembers[lead.assignedTo].name}</span>
                    </div>
                  )}

                  <div className="flex items-center text-xs text-gray-600 gap-1">
                    <Calendar size={12} className="text-gray-400" />
                    <span>{lead.createdAt ? formatDate(lead.createdAt) : 'No date'}</span>
                  </div>
                </div>

                {lead.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600">{lead.notes}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Arrow button - Always at the bottom */}
          <div
            className="mt-3 -mb-1 flex justify-center cursor-pointer"
            onClick={() => setShowDetails(!showDetails)}
          >
            <motion.div
              animate={{
                rotate: showDetails ? 180 : 0,
              }}
              transition={{
                duration: 0.3,
                ease: "easeInOut"
              }}
              className="text-gray-300 hover:text-gray-500 transition-colors"
            >
              <ChevronDown size={16} />
            </motion.div>
          </div>
        </div>


      </Card>
    </motion.div>
  );
};
