'use client';

import { motion } from 'framer-motion';
import { TeamMembers } from '@/components/team/TeamMembers';
import { Navigation } from '@/components/ui/Navigation';

export default function TeamPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <motion.header 
        className="bg-white border-b border-gray-200 px-5 py-3 flex flex-col items-center justify-between sticky top-0 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full flex items-center justify-between mb-2">
          <h1 className="text-lg font-medium">Team Management</h1>
        </div>
        
        <Navigation />
      </motion.header>
      
      <motion.div 
        className="flex-1 overflow-auto p-5 bg-[#f8f9fa]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="max-w-4xl mx-auto">
          <TeamMembers />
        </div>
      </motion.div>
    </div>
  );
}
