'use client';

import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Lead, Status } from '@/types';

// Item types for drag and drop
export const ItemTypes = {
  LEAD: 'lead',
};

// Interface for draggable lead item
export interface DragItem {
  id: string;
  index: number;
  columnId: Status;
  type: string;
}

// Hook for making a card draggable
export function useLeadDrag(lead: Lead, index: number, columnId: Status) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.LEAD,
    item: () => {
      return { id: lead.id, index, columnId, type: ItemTypes.LEAD };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return { isDragging, drag };
}

// Hook for handling dropping of leads
export function useLeadDrop(
  columnId: Status,
  index: number,
  moveLeadCard: (dragIndex: number, hoverIndex: number, sourceColumn: Status, targetColumn: Status) => void
) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.LEAD,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      const sourceColumn = item.columnId;
      const targetColumn = columnId;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex && sourceColumn === targetColumn) {
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;
      
      // Dragging from top to bottom - move only when cursor crosses half of the item's height
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Dragging from bottom to top - move only when cursor crosses half of the item's height
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // Time to actually perform the action
      moveLeadCard(dragIndex, hoverIndex, sourceColumn, targetColumn);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
      item.columnId = targetColumn;
    },
  });

  drop(ref);
  
  return { isOver, canDrop, drop: ref };
}

// Hook for making a column droppable
export function useColumnDrop(
  columnId: Status,
  onDrop: (item: DragItem, columnId: Status) => void
) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.LEAD,
    drop: (item: DragItem) => {
      onDrop(item, columnId);
      return { columnId };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return { isOver, canDrop, drop };
}
