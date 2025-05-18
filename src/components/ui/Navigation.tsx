'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, LayoutGrid, Plug, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button } from './Button';
import { Container } from './Container';
import { LeadForm } from '@/components/lead/LeadForm';
import { ImportModal } from '@/components/board/ImportModal';
import { useBoard } from '@/context/BoardContext';
import { Lead, Status } from '@/types';

export const Navigation = () => {
  const pathname = usePathname();
  const { addLead, editLead } = useBoard();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [leadBeingEdited, setLeadBeingEdited] = useState<Lead | undefined>(undefined);
  const [selectedStatus] = useState<Status>('new');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAddLead = () => {
    setLeadBeingEdited(undefined);
    setIsLeadFormOpen(true);
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

  const links = [
    {
      href: '/board',
      label: 'Board',
      icon: LayoutGrid,
      active: pathname === '/board',
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

  // Don't show the Add Lead button on the landing page
  const showLeadActions = pathname !== '/';
  const isLandingPage = pathname === '/';

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className="bg-gray-100 border-b border-gray-200 h-[60px] flex items-center sticky top-0 z-50"
      >
        <Container>
          <div className="flex items-center justify-between w-full">
            <Link href="/" className="text-lg block font-medium truncate">Sales CRM</Link>
            {!isLandingPage && (
              <button 
                className="md:hidden ml-2" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X size={20} className="text-gray-700" />
                ) : (
                  <Menu size={20} className="text-gray-700" />
                )}
              </button>
            )}
            {isLandingPage ? (
              <Link href="/board">
                <Button size="sm">
                  <LayoutGrid size={15} className="mr-1" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <div className="hidden md:flex backdrop-blur-md bg-white/80 rounded-full px-1 py-1 items-center gap-1 border border-gray-200">
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
                          layoutId="active-pill-desktop"
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
            )}

            {showLeadActions && (
              <div className="hidden md:flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)}>
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Import
                </Button>

                <Button size="sm" onClick={() => handleAddLead()}>
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Lead
                </Button>
              </div>
            )}
          </div>
        </Container>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && !isLandingPage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-200 shadow-sm"
          >
            <Container className="py-3">
              {/* Mobile Navigation Links */}
              <div className="flex flex-col space-y-2 mb-4">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                  >
                    <div
                      className={cn(
                        "flex items-center px-3 py-2 rounded-lg",
                        link.active
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <link.icon size={16} className="mr-3" />
                      <span className="text-sm font-medium">{link.label}</span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Mobile Action Buttons */}
              {showLeadActions && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1" 
                    onClick={() => {
                      setIsImportModalOpen(true);
                      closeMobileMenu();
                    }}
                  >
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Import
                  </Button>

                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      handleAddLead();
                      closeMobileMenu();
                    }}
                  >
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Lead
                  </Button>
                </div>
              )}
            </Container>
          </motion.div>
        )}
      </AnimatePresence>

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
    </>
  );
};
