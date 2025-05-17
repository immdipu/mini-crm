'use client';

import { motion } from 'framer-motion';
import { TeamMembers } from '@/components/team/TeamMembers';

export default function TeamPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
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
