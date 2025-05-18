'use client';

import { useState, useRef, useCallback } from 'react';
import { Status } from '@/types';

interface DragItem {
  id: string;
  status: Status;
}

interface UseDragAndDropProps {
  onMoveItem: (
    sourceColumnId: Status,
    destinationColumnId: Status,
    sourceIndex: number,
    destinationIndex: number,
    itemId: string
  ) => void;
  onReorderItem: (columnId: Status, sourceIndex: number, destinationIndex: number) => void;
}

export function useDragAndDrop({ onMoveItem, onReorderItem }: UseDragAndDropProps) {
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);
  const [sourceColumnId, setSourceColumnId] = useState<Status | null>(null);
  const [sourceIndex, setSourceIndex] = useState<number | null>(null);
  const [hoverColumnId, setHoverColumnId] = useState<Status | null>(null);
  const [dropPosition, setDropPosition] = useState<number | null>(null);
  const dropIndicator = useRef<HTMLElement | null>(null);

  const handleDragStart = useCallback((
    e: React.DragEvent<HTMLElement>, 
    item: DragItem, 
    columnId: Status,
    index: number
  ) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';

    setActiveItem(item);
    setSourceColumnId(columnId);
    setSourceIndex(index);
    
    document.body.classList.add('is-dragging');
    
    if (e.currentTarget) {
      e.currentTarget.classList.add('is-being-dragged');
    }
  }, []);
  
  const handleDragOver = useCallback((
    e: React.DragEvent<HTMLElement>,
    columnId: Status,
    columnItems: string[]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!activeItem || !sourceColumnId) return;
    
    setHoverColumnId(columnId);
    
    const columns = document.querySelectorAll('.board-column');
    columns.forEach(column => {
      if ((column as HTMLElement).dataset.columnId === columnId) {
        column.classList.add('drag-over');
      } else {
        column.classList.remove('drag-over');
      }
    });
    
    const itemCount = columnItems.length;
    
    if (itemCount === 0) {
      setDropPosition(0);
      // Hide all indicators
      document.querySelectorAll('.drop-indicator').forEach(indicator => {
        (indicator as HTMLElement).style.opacity = '0';
      });
      return;
    }
    
    const cardElements = Array.from(
      document.querySelectorAll(`.board-column[data-column-id="${columnId}"] [data-lead-id]`)
    );
    
    if (cardElements.length === 0) {
      setDropPosition(0);
      return;
    }
    
    const mouseY = e.clientY;
    
    const indicatorAreas = Array.from(
      document.querySelectorAll(`.drop-indicator-area[data-column="${columnId}"]`) as NodeListOf<HTMLElement>
    );
    
    if (indicatorAreas.length === 0) return;
    
    document.querySelectorAll('.drop-indicator').forEach(indicator => {
      (indicator as HTMLElement).style.opacity = '0';
    });
    
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    indicatorAreas.forEach((area, index) => {
      const rect = area.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const distance = Math.abs(mouseY - centerY);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    
    setDropPosition(closestIndex);

    const indicator = indicatorAreas[closestIndex]?.querySelector('.drop-indicator') as HTMLElement;
    if (indicator) {
      indicator.style.opacity = '1';
      dropIndicator.current = indicator.parentElement as HTMLElement;
    }
  }, [activeItem, sourceColumnId]);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    
    // Only clear if leaving to an area outside a column
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('.board-column')) {
      clearDragState();
    }
  }, []);
  
  const handleDrop = useCallback((
    e: React.DragEvent<HTMLElement>,
    columnId: Status,
    columnItems: string[]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear visual states immediately
    clearDragState();
    
    // If no active item or source column, return
    if (!activeItem || sourceColumnId === null || sourceIndex === null) return;
    
    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId) return;
    
    // If dropping in the same column
    if (sourceColumnId === columnId) {
      // If drop position is available and different from source
      if (dropPosition !== null && dropPosition !== sourceIndex && dropPosition !== sourceIndex + 1) {
        const adjustedDestIndex = dropPosition > sourceIndex ? dropPosition - 1 : dropPosition;
        onReorderItem(columnId, sourceIndex, adjustedDestIndex);
      }
    } else {
      if (dropPosition !== null) {
        onMoveItem(
          sourceColumnId,
          columnId,
          sourceIndex,
          dropPosition,
          itemId
        );
      } else {
        onMoveItem(
          sourceColumnId,
          columnId,
          sourceIndex,
          columnItems.length,
          itemId
        );
      }
    }

    resetDragState();
  }, [activeItem, sourceColumnId, sourceIndex, dropPosition, onMoveItem, onReorderItem]);
  
  // Handle drag end
  const handleDragEnd = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    clearDragState();

    resetDragState();
  }, []);

  const clearDragState = () => {
    document.querySelectorAll('.drop-indicator').forEach(indicator => {
      (indicator as HTMLElement).style.opacity = '0';
    });

    document.querySelectorAll('.board-column').forEach(column => {
      column.classList.remove('drag-over');
    });

    document.body.classList.remove('is-dragging');

    document.querySelectorAll('.is-being-dragged').forEach(item => {
      item.classList.remove('is-being-dragged');
    });
  };
  
  const resetDragState = () => {
    setActiveItem(null);
    setSourceColumnId(null);
    setSourceIndex(null);
    setHoverColumnId(null);
    setDropPosition(null);
    dropIndicator.current = null;
  };
  
  return {
    activeItem,
    hoverColumnId,
    dropPosition,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDragEnd,
    handleDrop,
    clearDragState,
    resetDragState
  };
}
