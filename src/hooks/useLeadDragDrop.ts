'use client';

import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd/dist/hooks';
import type { DropTargetMonitor, DragSourceMonitor } from 'react-dnd/dist/types/monitors';
import { Lead, Status } from '@/types';

export const ItemTypes = {
  LEAD: 'lead',
};

export interface DragItem {
  id: string;
  index: number;
  columnId: Status;
  type: string;
}

export function useLeadDrag(lead: Lead, index: number, columnId: Status) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.LEAD,
    item: () => {
      return { id: lead.id, index, columnId, type: ItemTypes.LEAD };
    },
    collect: (monitor: DragSourceMonitor<DragItem>) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return { isDragging, drag };
}

export function useLeadDrop(
  columnId: Status,
  index: number,
  moveLeadCard: (dragIndex: number, hoverIndex: number, sourceColumn: Status, targetColumn: Status) => void
) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.LEAD,
    collect: (monitor: DropTargetMonitor<DragItem>) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    hover(item: DragItem, monitor: DropTargetMonitor<DragItem>) {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      const sourceColumn = item.columnId;
      const targetColumn = columnId;
      
      if (dragIndex === hoverIndex && sourceColumn === targetColumn) {
        return;
      }
      
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      const clientOffset = monitor.getClientOffset();
      
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;
       if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

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
    collect: (monitor: DropTargetMonitor<DragItem>) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return { isOver, canDrop, drop };
}
