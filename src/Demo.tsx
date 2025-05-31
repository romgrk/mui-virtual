import { useEffect, useRef } from 'react';
import { VirtualContainer } from './virtual';
import './Demo.css';

const options = Array.from({ length: 10_000 }).map((_, i) => ({
  value: i,
  label: `Item ${i}`,
}));

export default function Demo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const virtual = new VirtualContainer({
      rootNode: ref.current!,
      rowLength: options.length,
      columnLength: 1,
      rowSize: 24,
      columnSize: 0,
      layout: {
        hasColumns: false,
      },
      render: (row, _, node) => {
        const option = options[row];
        node.textContent = option.label ?? option.value;
      },
    });

    return virtual.cleanup;
  }, []);

  return (
    <div>
      <h1>Demo</h1>
      <div>
        <div ref={ref} style={{ width: 500, height: 300 }} className="virtual" />
      </div>
    </div>
  );
}
