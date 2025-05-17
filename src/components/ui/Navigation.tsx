'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, LayoutGrid, Plug } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export const Navigation = () => {
  const pathname = usePathname();
  
  const links = [
    {
      href: '/',
      label: 'Board',
      icon: LayoutGrid,
      active: pathname === '/',
    },
    {
      href: '/team',
      label: 'Team',
      icon: Users,
      active: pathname === '/team',
    },
    {
      href: '/integration',
      label: 'Integration',
      icon: Plug,
      active: pathname === '/integration',
    }
  ];

  return (
    
    <div className="flex justify-center">
      <div className="backdrop-blur-md bg-white/80 rounded-full shadow-md px-1 py-1 flex items-center gap-1 border border-gray-100">
        {links.map((link) => (
          <Link 
            key={link.href}
            href={link.href}
            className="relative"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full transition-all",
                link.active 
                  ? "text-white" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <link.icon size={15} strokeWidth={1.8} />
              <span className="text-xs font-medium">{link.label}</span>
              
              {link.active && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full -z-10 shadow-md"
                  initial={false}
                  transition={{ 
                    type: "spring", 
                    bounce: 0.2,
                    duration: 0.6 
                  }}
                />
              )}
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
};
