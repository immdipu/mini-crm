'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    }
  ];

  return (
    <nav className="flex items-center gap-5">
      {links.map((link) => (
        <Link 
          key={link.href}
          href={link.href}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium transition-colors py-1 hover:text-gray-800 relative",
            link.active ? "text-gray-800" : "text-gray-500"
          )}
        >
          <link.icon size={15} strokeWidth={1.8} />
          <span>{link.label}</span>
          {link.active && (
            <span className="absolute bottom-0 left-0 h-0.5 w-full bg-gray-800 rounded-full" />
          )}
        </Link>
      ))}
    </nav>
  );
};
