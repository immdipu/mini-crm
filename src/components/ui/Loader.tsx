'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

export type LoaderVariant = 'spinner' | 'pulse' | 'dots' | 'skeleton';
export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg';
export type LoaderPosition = 'center' | 'left' | 'right' | 'inline';

interface LoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize;
  color?: string;
  text?: string;
  className?: string;
  textClassName?: string;
  fullScreen?: boolean;
  position?: LoaderPosition;
  skeletonHeight?: number;
  skeletonWidth?: number | string;
}

export const Loader: React.FC<LoaderProps> = ({
  variant = 'spinner',
  size = 'md',
  color = 'primary',
  text,
  className = '',
  textClassName = '',
  fullScreen = false,
  position = 'center',
  skeletonHeight,
  skeletonWidth,
}) => {
  // Size mappings
  const sizeMap = {
    xs: {
      spinner: 'h-3 w-3 border-[1.5px]',
      pulse: 'h-3 w-3',
      dots: 'h-1 w-1 mx-0.5',
      text: 'text-xs',
    },
    sm: {
      spinner: 'h-4 w-4 border-2',
      pulse: 'h-4 w-4',
      dots: 'h-1.5 w-1.5 mx-0.5',
      text: 'text-xs',
    },
    md: {
      spinner: 'h-6 w-6 border-2',
      pulse: 'h-6 w-6',
      dots: 'h-2 w-2 mx-1',
      text: 'text-sm',
    },
    lg: {
      spinner: 'h-8 w-8 border-2',
      pulse: 'h-8 w-8',
      dots: 'h-2.5 w-2.5 mx-1',
      text: 'text-base',
    },
  };

  // Color mappings
  const colorMap: Record<string, string> = {
    primary: 'border-primary bg-primary text-primary',
    secondary: 'border-secondary bg-secondary text-secondary',
    blue: 'border-blue-600 bg-blue-600 text-blue-600',
    green: 'border-green-600 bg-green-600 text-green-600',
    red: 'border-red-600 bg-red-600 text-red-600',
    yellow: 'border-yellow-500 bg-yellow-500 text-yellow-500',
    gray: 'border-gray-500 bg-gray-500 text-gray-500',
  };

  // Position mappings
  const positionMap: Record<LoaderPosition, string> = {
    center: 'justify-center items-center',
    left: 'justify-start items-center',
    right: 'justify-end items-center',
    inline: 'inline-flex items-center',
  };

  // Extract color classes
  const borderColor = colorMap[color]?.split(' ')[0] || `border-${color}-600`;
  const bgColor = colorMap[color]?.split(' ')[1] || `bg-${color}-600`;
  const textColor = colorMap[color]?.split(' ')[2] || `text-${color}-600`;

  // Container classes
  const containerClasses = cn(
    'flex gap-2',
    positionMap[position],
    fullScreen && 'fixed inset-0 z-50 bg-white/80 backdrop-blur-sm',
    className
  );

  // Render the appropriate loader variant
  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div
            className={cn(
              'animate-spin rounded-full border-t-transparent',
              sizeMap[size].spinner,
              borderColor
            )}
          />
        );
      case 'pulse':
        return (
          <motion.div
            className={cn('rounded-full', sizeMap[size].pulse, bgColor, 'opacity-75')}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        );
      case 'dots':
        return (
          <div className="flex">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={cn('rounded-full', sizeMap[size].dots, bgColor)}
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        );
      case 'skeleton':
        return (
          <Skeleton
            className={cn(
              skeletonHeight ? `h-${skeletonHeight}` : 'h-4',
              typeof skeletonWidth === 'string'
                ? skeletonWidth
                : skeletonWidth
                ? `w-${skeletonWidth}`
                : 'w-full'
            )}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={containerClasses}>
      {renderLoader()}
      {text && (
        <span className={cn(sizeMap[size].text, textColor, textClassName)}>
          {text}
        </span>
      )}
    </div>
  );
};
