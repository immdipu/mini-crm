'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  contentClassName?: string;
  delay?: number;
  trigger?: 'hover' | 'click';
  maxWidth?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  className = '',
  contentClassName = '',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  delay = 300,
  trigger = 'hover',
  maxWidth = 250,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  // coords state is used in the useEffect but not directly in the render
  const [, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      trigger === 'click' &&
      isVisible &&
      triggerRef.current &&
      !triggerRef.current.contains(e.target as Node) &&
      tooltipRef.current &&
      !tooltipRef.current.contains(e.target as Node)
    ) {
      setIsVisible(false);
    }
  }, [trigger, isVisible]);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();

      switch (position) {
        case 'top':
          setCoords({
            x: rect.left + rect.width / 2,
            y: rect.top,
          });
          break;
        case 'bottom':
          setCoords({
            x: rect.left + rect.width / 2,
            y: rect.bottom,
          });
          break;
        case 'left':
          setCoords({
            x: rect.left,
            y: rect.top + rect.height / 2,
          });
          break;
        case 'right':
          setCoords({
            x: rect.right,
            y: rect.top + rect.height / 2,
          });
          break;
      }
    }
  }, [isVisible, position]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, handleClickOutside]);

  const getTooltipStyles = () => {
    switch (position) {
      case 'top':
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
        };
      case 'bottom':
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px',
        };
      case 'left':
        return {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: '8px',
        };
      case 'right':
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '8px',
        };
      default:
        return {};
    }
  };

  return (
    <div
      ref={triggerRef}
      className={cn('relative inline-block', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            className={cn(
              'absolute z-50',
              contentClassName
            )}
            style={{
              ...getTooltipStyles(),
              maxWidth: `${maxWidth}px`,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-gray-800 text-white text-xs rounded-md py-2 px-3 shadow-lg">
              {content}
              <div
                className={cn(
                  'absolute w-2 h-2 bg-gray-800 transform rotate-45',
                  position === 'top' && 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
                  position === 'bottom' && 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
                  position === 'left' && 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2',
                  position === 'right' && 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2'
                )}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
