import {
  memo,
  forwardRef,
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
} from 'react';
import { createPortal, flushSync } from 'react-dom';
import { WheelBehavior } from './primitives';
import { Virtualizer } from './Virtualizer';
import './Demo.css';

const options = Array.from({ length: 1_000_000 }).map((_, i) => ({
  value: i,
  label: `Item ${i}`,
}));

// eslint-disable-next-line
const CellContainer = memo(
  forwardRef((_, forwardRef) => {
    const [elements, setElements] = useState([]);
    useImperativeHandle(forwardRef, () => ({ setElements }), []);
    return elements;
  }),
);

function findListeningMarker() {
  const elements = document.querySelectorAll('body *');

  for (let i = 0; i < elements.length; i += 1) {
    const element = elements[i];
    for (const key in element) {
      if (key.startsWith('_reactListening')) {
        return key;
      }
    }
  }

  return '_reactListening_notFound';
}

export default function Demo() {
  const ref = useRef<HTMLDivElement>(null);
  const cellContainerRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const renderedCells = new Map<string, any>();
    const listeningMarker = findListeningMarker();

    const virtual = new Virtualizer({
      rootNode: ref.current!,
      rowLength: options.length,
      columnLength: 100,
      rowHeight: 24,
      columnWidth: 50,
      layout: {
        hasColumns: true,
      },
      wheelBehavior: WheelBehavior.NATIVE,
      renderNode: (row, column, node) => {
        // const option = options[row];
        // const span = document.createElement('span');
        // span.style.fontSize = '0.8em';
        // span.textContent = `[${row},${column}]`;
        // node.appendChild(span);
        // node.textContent = (option.label ?? option.value)
        const key = row + ':' + column;
        // (node as any)[listeningMarker] = true;
        renderedCells.set(
          key,
          createPortal(
            <span className="test-cell-small" onClick={() => console.log(key)}>
              {key}
            </span>,
            node,
            key,
          ),
        );
      },
      removeNode: (row, column) => {
        const key = row + ':' + column;
        renderedCells.delete(key);
      },
      finishRender: () => {
        flushSync(() => {
          const elements = Array.from(renderedCells.values());
          cellContainerRef.current.setElements(elements);
        });
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
        <CellContainer ref={cellContainerRef} />
      </div>
    </div>
  );
}
