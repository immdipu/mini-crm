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
  // Store the actively dragged item info
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);
  const [sourceColumnId, setSourceColumnId] = useState<Status | null>(null);
  const [sourceIndex, setSourceIndex] = useState<number | null>(null);
  
  // Store the destination info
  const [hoverColumnId, setHoverColumnId] = useState<Status | null>(null);
  const [dropPosition, setDropPosition] = useState<number | null>(null);
  
  // Track the element where the drop indicator should appear
  const dropIndicator = useRef<HTMLElement | null>(null);
  
  // Start dragging
  const handleDragStart = useCallback((
    e: React.DragEvent<HTMLElement>, 
    item: DragItem, 
    columnId: Status,
    index: number
  ) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Set active item info
    setActiveItem(item);
    setSourceColumnId(columnId);
    setSourceIndex(index);
    
    // Add dragging styles
    document.body.classList.add('is-dragging');
    
    // Add dragging style to the element
    if (e.currentTarget) {
      e.currentTarget.classList.add('is-being-dragged');
    }
  }, []);
  
  // Handle dragging over columns
  const handleDragOver = useCallback((
    e: React.DragEvent<HTMLElement>,
    columnId: Status,
    columnItems: string[]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!activeItem || !sourceColumnId) return;
    
    // Show we're over this column
    setHoverColumnId(columnId);
    
    // Highlight current column
    const columns = document.querySelectorAll('.board-column');
    columns.forEach(column => {
      if ((column as HTMLElement).dataset.columnId === columnId) {
        column.classList.add('drag-over');
      } else {
        column.classList.remove('drag-over');
      }
    });
    
    // Get the column's item count
    const itemCount = columnItems.length;
    
    // If column is empty, just set position to 0
    if (itemCount === 0) {
      setDropPosition(0);
      // Hide all indicators
      document.querySelectorAll('.drop-indicator').forEach(indicator => {
        (indicator as HTMLElement).style.opacity = '0';
      });
      return;
    }
    
    // Find all card elements in this column
    const cardElements = Array.from(
      document.querySelectorAll(`.board-column[data-column-id="${columnId}"] [data-lead-id]`)
    );
    
    // If no cards, set position to end
    if (cardElements.length === 0) {
      setDropPosition(0);
      return;
    }
    
    // Find the closest card to drop position
    const mouseY = e.clientY;
    
    // Add all drop indicator areas in this column
    const indicatorAreas = Array.from(
      document.querySelectorAll(`.drop-indicator-area[data-column="${columnId}"]`) as NodeListOf<HTMLElement>
    );
    
    // If there are no indicator areas, return
    if (indicatorAreas.length === 0) return;
    
    // Hide all indicators first
    document.querySelectorAll('.drop-indicator').forEach(indicator => {
      (indicator as HTMLElement).style.opacity = '0';
    });
    
    // Find closest indicator area
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
    
    // Set position for drop
    setDropPosition(closestIndex);
    
    // Highlight the indicator
    const indicator = indicatorAreas[closestIndex]?.querySelector('.drop-indicator') as HTMLElement;
    if (indicator) {
      indicator.style.opacity = '1';
      dropIndicator.current = indicator.parentElement as HTMLElement;
    }
  }, [activeItem, sourceColumnId]);
  
  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    
    // Only clear if leaving to an area outside a column
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('.board-column')) {
      clearDragState();
    }
  }, []);
  
  // Handle dropping
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
        // Handle edge case when dragging an item down
        const adjustedDestIndex = dropPosition > sourceIndex ? dropPosition - 1 : dropPosition;
        onReorderItem(columnId, sourceIndex, adjustedDestIndex);
      }
    } else {
      // Moving between columns
      if (dropPosition !== null) {
        onMoveItem(
          sourceColumnId,
          columnId,
          sourceIndex,
          dropPosition,
          itemId
        );
      } else {
        // If no position is determined, add to the end
        onMoveItem(
          sourceColumnId,
          columnId,
          sourceIndex,
          columnItems.length,
          itemId
        );
      }
    }
    
    // Reset drag state
    resetDragState();
  }, [activeItem, sourceColumnId, sourceIndex, dropPosition, onMoveItem, onReorderItem]);
  
  // Handle drag end
  const handleDragEnd = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear all drag-related visual effects
    clearDragState();
    
    // Reset all state
    resetDragState();
  }, []);
  
  // Clear visual drag effects
  const clearDragState = () => {
    // Clear drop indicators
    document.querySelectorAll('.drop-indicator').forEach(indicator => {
      (indicator as HTMLElement).style.opacity = '0';
    });
    
    // Clear column highlights
    document.querySelectorAll('.board-column').forEach(column => {
      column.classList.remove('drag-over');
    });
    
    // Remove dragging class from body
    document.body.classList.remove('is-dragging');
    
    // Clear dragging style from all items
    document.querySelectorAll('.is-being-dragged').forEach(item => {
      item.classList.remove('is-being-dragged');
    });
  };
  
  // Reset drag state
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
