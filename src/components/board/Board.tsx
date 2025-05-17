'use client';
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BoardColumn } from '@/components/board/BoardColumn';
import { LeadForm } from '@/components/lead/LeadForm';
import { ImportModal } from '@/components/board/ImportModal';
import { useBoard } from '@/context/BoardContext';
import { Lead, Status, Priority } from '@/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { LeadCard } from '@/components/lead/LeadCard';


export const Board = () => {
  const { board, leads, isLoading, addLead, editLead, removeLead, reorderLeads, moveLead } = useBoard();

  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [leadBeingEdited, setLeadBeingEdited] = useState<Lead | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<Status>('new');
  const [isMobile, setIsMobile] = useState(false);
  const [expandedColumns, setExpandedColumns] = useState<Record<Status, boolean>>({
    new: true,
    contacted: false,
    qualified: false,
    won: false,
    lost: false
  });

  // Check if the screen is mobile size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint in Tailwind
    };

    // Check on initial load
    checkIsMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const toggleColumn = (columnId: Status) => {
    setExpandedColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  const handleMoveCard = useCallback(
    (dragIndex: number, hoverIndex: number, sourceColumnId: Status, targetColumnId: Status) => {
      if (sourceColumnId === targetColumnId) {
        reorderLeads(sourceColumnId, dragIndex, hoverIndex);
      } else {
        const leadId = board.columns[sourceColumnId].leadIds[dragIndex];
        moveLead(sourceColumnId, targetColumnId, dragIndex, hoverIndex, leadId);
      }
    },
    [board, reorderLeads, moveLead]
  );

  const handleDropCard = useCallback(
    (leadId: string, sourceColumnId: Status, targetColumnId: Status) => {
      if (sourceColumnId !== targetColumnId) {
        const sourceIndex = board.columns[sourceColumnId].leadIds.indexOf(leadId);
        const targetIndex = board.columns[targetColumnId].leadIds.length;

        moveLead(sourceColumnId, targetColumnId, sourceIndex, targetIndex, leadId);
      }
    },
    [board, moveLead]
  );

  const handleAddLead = (status?: Status) => {
    if (status) {
      setSelectedStatus(status);
    }
    setLeadBeingEdited(undefined);
    setIsLeadFormOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setLeadBeingEdited(lead);
    setIsLeadFormOpen(true);
  };

  const handleStatusChange = (lead: Lead, newStatus: Status) => {
    if (lead.status !== newStatus) {
      const updatedLead = { ...lead, status: newStatus };
      editLead(updatedLead);
    }
  };

  const handlePriorityChange = (lead: Lead, newPriority: Priority) => {
    if (lead.priority !== newPriority) {
      const updatedLead = { ...lead, priority: newPriority };
      editLead(updatedLead);
    }
  };

  const handleLeadFormSubmit = (formData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> | Lead) => {
    if ('id' in formData) {
      editLead(formData as Lead);
    } else {
      addLead({
        ...(formData as Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>),
        status: selectedStatus,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
          <p className="text-gray-500 text-sm">Loading your leads...</p>
        </motion.div>
      </div>
    );
  }

  // Get total leads count
  const getTotalLeadsCount = () => {
    return Object.values(board.columns).reduce(
      (total, column) => total + column.leadIds.length, 
      0
    );
  };

  const renderMobileView = () => (
    <div className="flex flex-col space-y-3">
      <div className="flex justify-between items-center mb-2 px-2">
        <h2 className="text-sm font-medium">Leads ({getTotalLeadsCount()})</h2>
      </div>
      {board.columnOrder.map((columnId) => {
        const column = board.columns[columnId];
        const columnLeads = column.leadIds.map(id => leads[id]).filter(Boolean);
        const isExpanded = expandedColumns[columnId];
        
        // Get status color based on column ID
        let statusColor;
        switch (columnId) {
          case 'new': statusColor = 'bg-blue-100 text-blue-800'; break;
          case 'contacted': statusColor = 'bg-purple-100 text-purple-800'; break;
          case 'qualified': statusColor = 'bg-indigo-100 text-indigo-800'; break;
          case 'won': statusColor = 'bg-green-100 text-green-800'; break;
          case 'lost': statusColor = 'bg-red-100 text-red-800'; break;
          default: statusColor = 'bg-gray-100 text-gray-800';
        }
        
        return (
          <div 
            key={columnId} 
            className={`rounded-md border shadow-sm overflow-hidden transition-all duration-200 ${isExpanded ? 'mb-6' : ''}`}
          >
            <div 
              className={`p-3 flex justify-between items-center cursor-pointer ${statusColor}`}
              onClick={() => toggleColumn(columnId)}
            >
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-sm">{column.title}</h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/50 text-inherit">
                  {columnLeads.length}
                </span>
              </div>
              <div className="flex items-center">
                <button
                  className="p-1 rounded-full hover:bg-white/30 mr-3 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddLead(columnId);
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white"
                >
                  <div className="p-2">
                    {columnLeads.length > 0 ? (
                      <div className="space-y-2">
                        {columnLeads.map((lead, index) => (
                          <motion.div
                            key={lead.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <LeadCard
                              lead={lead}
                              index={index}
                              columnId={columnId}
                              onEdit={handleEditLead}
                              onDelete={removeLead}
                              moveCard={handleMoveCard}
                              onStatusChange={handleStatusChange}
                              onPriorityChange={handlePriorityChange}
                            />
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-sm text-gray-500">
                        No leads in this stage
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );

  const renderDesktopView = () => (
    <div className="flex justify-center gap-5 pb-4 ">
      <AnimatePresence>
        {board.columnOrder.map((columnId) => {
          const column = board.columns[columnId];

          return (
            <BoardColumn
              key={column.id}
              id={column.id}
              title={column.title}
              leadIds={column.leadIds}
              leads={leads}
              onLeadEdit={handleEditLead}
              onLeadDelete={removeLead}
              onLeadAdd={handleAddLead}
              moveCard={handleMoveCard}
              dropCard={handleDropCard}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="flex flex-col">
      <motion.div
        className="p-4 bg-[#f8f9fa]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {isMobile ? renderMobileView() : renderDesktopView()}
      </motion.div>
      <LeadForm
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
        onSubmit={handleLeadFormSubmit}
        initialData={leadBeingEdited}
      />
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};