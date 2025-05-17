import { Board } from '@/components/board/Board';
import { BoardProvider } from '@/context/BoardContext';

export default function Home() {
  return (
    <div className="min-h-screen h-screen flex flex-col">
      <BoardProvider>
        <Board />
      </BoardProvider>
    </div>
  );
}
