import { Metadata } from 'next';
import { Board } from '@/components/board/Board';
import DndContext from '@/context/DndContext';

export const metadata: Metadata = {
  title: 'Mini CRM Board | Manage Your Sales Pipeline',
  description: 'A lightweight CRM board for managing sales leads and tracking deals through your pipeline',
  keywords: 'CRM, sales, leads, pipeline, kanban, sales pipeline',
};

export default function Home() {
  return (
    <main className="min-h-screen h-screen flex flex-col overflow-hidden bg-[#f8f9fa]">
      <DndContext>
        <Board />
      </DndContext>
    </main>
  );
}
