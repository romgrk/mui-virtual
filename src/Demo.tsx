import { useEffect, useRef } from 'react';
import { VirtualContainer } from './VirtualContainer';
import './Demo.css';

const options = Array.from({ length: 1_000_000 }).map((_, i) => ({
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
      columnLength: 100,
      rowHeight: 24,
      columnWidth: 50,
      layout: {
        hasColumns: true,
      },
      render: (row, column, node) => {
        const option = options[row];
        const span = document.createElement('span');
        span.style.fontSize = '0.8em';
        span.textContent = `[${row},${column}]`;
        node.appendChild(span);
        // node.textContent = (option.label ?? option.value)
      },
    });

    return virtual.cleanup;
  }, []);

  return (
    <div>
      <h1>Demo</h1>
      <div>
        <div
          ref={ref}
          style={{ width: 700, height: 700, containIntrinsicSize: '700px 700px' }}
          className="virtual"
        />
      </div>
    </div>
  );
}
