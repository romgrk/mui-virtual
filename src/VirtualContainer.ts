import { ceil, floor, clamp } from './math';
import {
  float,
  integer,
  Dimensions,
  Padding,
  Position,
  Context,
  Approach,
  ScrollDirection,
  WheelBehavior,
  SwapArray,
  Vector,
} from './primitives';
import { setImmediate } from './setImmediate';

type Options = {
  rootNode: HTMLElement;
  rowLength: number;
  columnLength: number;
  rowHeight: number;
  columnWidth: number;
  layout?: Partial<VirtualContainer['layout']>;
  behavior?: WheelBehavior;
  renderNode: (row: number, column: number, node: HTMLElement) => void;
};

type RowEntry = {
  node: HTMLElement;
  columns: Map<integer, ColumnEntry>;
};

type ColumnEntry = {
  node: HTMLElement;
};

const LAYOUT_DEFAULT = { hasColumns: true, hasRows: true };

const dom = {
  createRow: () => {
    const node = document.createElement('div');
    node.className = 'virtual--row';
    return node;
  },
  createColumn: () => {
    const node = document.createElement('div');
    node.className = 'virtual--column';
    return node;
  },
};

export class VirtualContainer {
  options: Options;
  disposables: Set<Function>;

  rowLength: number;
  columnLength: number;

  rootNode: HTMLElement;
  fillerNode: HTMLElement;

  layout: {
    hasColumns: boolean;
    hasRows: boolean;
  };

  dimensions: {
    root: Dimensions;
    /** root minus pinned rows/columns */
    viewport: Dimensions;
    content: Dimensions;
    row: Dimensions;
    column: Dimensions;
    rendered: Dimensions;
  };

  scroll: {
    behavior: WheelBehavior;
    position: Position;
    maxPosition: Position;
    direction: ScrollDirection;
    timestamp: float;
    deltaSinceLastRender: Vector;
    ignoreNext: boolean;
  };

  padding: Padding;
  context: Context;

  // PERF: find a better data structure
  renderedRows: Map<integer, RowEntry>;

  renderNode: (row: number, column: number, node: HTMLElement) => void;

  tasks: SwapArray<Function>;
  tasksScheduled: boolean;

  constructor(options: Options) {
    this.options = options;
    this.disposables = new Set();

    this.rowLength = options.rowLength;
    this.columnLength = options.columnLength;

    this.rootNode = options.rootNode;
    this.fillerNode = document.createElement('div');
    this.fillerNode.className = 'virtual--filler';
    this.rootNode.appendChild(this.fillerNode);

    this.layout = {
      ...LAYOUT_DEFAULT,
      ...options.layout,
    };

    this.dimensions = {
      root: Dimensions.EMPTY,
      viewport: Dimensions.EMPTY,
      content: Dimensions.EMPTY,
      row: Dimensions.EMPTY,
      column: Dimensions.EMPTY,
      /** Approximate rendered area. Guaranteed to be smaller than
       * the actual rendered content, but less than one cell smaller. */
      rendered: Dimensions.EMPTY,
    };

    this.scroll = {
      behavior: options.behavior ?? WheelBehavior.NATIVE,
      position: Position.create(0, 0),
      maxPosition: Position.create(0, 0),
      direction: ScrollDirection.NONE,
      timestamp: NaN,
      deltaSinceLastRender: Vector.create(0, 0),
      ignoreNext: false,
    };

    this.padding = { ...Padding.DEFAULT };
    this.context = Context.EMPTY;

    this.renderedRows = new Map();

    this.renderNode = options.renderNode;

    this.tasks = new SwapArray();
    this.tasksScheduled = false;

    this.setup();
  }

  setup() {
    this.readDimensions();
    this.attachEventHandlers();

    this.writeDimensions();
    this.writeNodes();
  }

  attachEventHandlers() {
    this.rootNode.addEventListener('scroll', this.onScroll);
    if (this.scroll.behavior === WheelBehavior.CONTROLLED) {
      this.rootNode.addEventListener('wheel', this.onWheel);
    }
    this.disposables.add(() => {
      this.rootNode.removeEventListener('wheel', this.onWheel);
      this.rootNode.removeEventListener('scroll', this.onScroll);
    });
  }

  readDimensions() {
    const { options, layout, dimensions, scroll } = this;

    dimensions.root = {
      width: this.rootNode.clientWidth,
      height: this.rootNode.clientHeight,
    };
    // TODO: pinned rows/columns
    dimensions.viewport = dimensions.root;
    dimensions.content = {
      width: this.layout.hasColumns
        ? this.columnLength * options.columnWidth
        : dimensions.root.width,
      height: this.layout.hasRows
        ? this.rowLength * options.rowHeight
        : dimensions.root.height,
    };

    dimensions.row = {
      width: layout.hasColumns
        ? dimensions.root.width / this.columnLength
        : dimensions.root.width,
      height: options.rowHeight,
    };
    dimensions.column = {
      width: options.columnWidth,
      height: layout.hasRows ? options.rowHeight : dimensions.root.height,
    };

    scroll.maxPosition.x = dimensions.content.width - dimensions.root.width;
    scroll.maxPosition.y = dimensions.content.height - dimensions.root.height;
  }

  writeDimensions() {
    const { content, root } = this.dimensions;
    this.fillerNode.style.width = Math.max(content.width, root.width) + 'px';
    this.fillerNode.style.height = Math.max(content.height, root.height) + 'px';
  }

  onWheel = (event: WheelEvent) => {
    const { scroll } = this;
    // scroll.behavior === ScrollBehavior.CONTROLLED

    const { deltaSinceLastRender } = scroll;

    deltaSinceLastRender.x += event.deltaX;
    deltaSinceLastRender.y += event.deltaY;

    event.preventDefault();
    scroll.ignoreNext = true;

    scroll.position.x = clamp(
      scroll.position.x + scroll.deltaSinceLastRender.x,
      0,
      scroll.maxPosition.x,
    );
    scroll.position.y = clamp(
      scroll.position.y + scroll.deltaSinceLastRender.y,
      0,
      scroll.maxPosition.y,
    );
    this.render();
    this.rootNode.scrollLeft = scroll.position.x;
    this.rootNode.scrollTop = scroll.position.y;
  };

  onScroll = (event: Event) => {
    const { scroll } = this;

    if (scroll.ignoreNext) {
      scroll.ignoreNext = false;
      return;
    }

    const xPrevious = scroll.position.x;
    const yPrevious = scroll.position.y;
    const xNext = this.rootNode.scrollLeft;
    const yNext = this.rootNode.scrollTop;

    scroll.position.x = xNext;
    scroll.position.y = yNext;

    // TODO: clamp for scroll bounce
    const dx = xNext - xPrevious;
    const dy = yNext - yPrevious;

    scroll.timestamp = event.timeStamp;

    // PERF: don't change direction too fast for small diagonal deviations
    scroll.direction = ScrollDirection.forDelta(dx, dy);

    this.padding = Padding.forDirection(scroll.direction, 800, false);

    this.render();
  };

  render = () => {
    const { scroll } = this;
    scroll.deltaSinceLastRender.x = 0;
    scroll.deltaSinceLastRender.y = 0;
    this.writeNodes();
  };

  writeNodes() {
    const { layout, dimensions, padding, scroll, renderedRows } = this;

    const viewport = dimensions.viewport;

    const yMin = scroll.position.y - padding.top;
    const yMax = scroll.position.y + viewport.height + padding.bottom;

    const xMin = scroll.position.x - padding.left;
    const xMax = scroll.position.x + viewport.width + padding.right;

    // prettier-ignore
    const nextContext = {
      rowFirst: this.getRowIndexAtY(yMin, Approach.FIRST),
      rowLast:  this.getRowIndexAtY(yMax, Approach.LAST) + 1,
      columnFirst: this.getColumnIndexAtX(xMin, Approach.FIRST),
      columnLast:  this.getColumnIndexAtX(xMax, Approach.LAST) + 1,
    };

    // TODO: Might be worth calculating accurately, but that would require
    // get-dimension-for-index functions, which could be more expensive in dynamic cases.
    dimensions.rendered = {
      width: xMax - xMin,
      height: yMax - yMin,
    };

    let newRowsCount = 0;

    for (let r = nextContext.rowFirst; r < nextContext.rowLast; r += 1) {
      let rowEntry = renderedRows.get(r);

      if (rowEntry === undefined) {
        newRowsCount += 1;

        const row = dom.createRow();
        const y = r * dimensions.row.height;

        rowEntry = {
          node: row,
          columns: new Map(),
        };
        renderedRows.set(r, rowEntry);

        // PERF: set as a string?
        row.style.width =
          (layout.hasColumns ? dimensions.content.width : dimensions.row.width) + 'px';
        row.style.height = dimensions.row.height + 'px';
        row.style.transform = 'translateY(' + y + 'px)';

        this.rootNode.appendChild(row);
      }

      if (layout.hasColumns === false) {
        this.renderNode(r, 1, rowEntry.node);
      } else {
        for (let c = nextContext.columnFirst; c < nextContext.columnLast; c += 1) {
          let columnEntry = rowEntry.columns.get(c);
          const isColumnRendered = columnEntry !== undefined;
          if (!isColumnRendered) {
            const column = dom.createColumn();
            const x = c * dimensions.column.width;

            columnEntry = {
              node: column,
            };
            rowEntry.columns.set(c, columnEntry);

            // PERF: set as a string?
            column.style.width = dimensions.column.width + 'px';
            column.style.height = dimensions.column.height + 'px';
            column.style.transform = 'translateX(' + x + 'px)';

            this.renderNode(r, c, column);

            rowEntry.node.appendChild(column);
          }
        }
      }
    }

    // performance.mark(
    //   renderedRows.size +
    //     ' rows, ' +
    //     newRowsCount +
    //     ' added, ' +
    //     ScrollDirection[this.scroll.direction],
    // );

    this.context = nextContext;
    this.scheduleWork(this.removeNodes);
  }

  removeNodes = () => {
    let count = 0;

    const { renderedRows, rootNode, context: context } = this;

    for (const [rowIndex, rowEntry] of renderedRows.entries()) {
      if (!isInInterval(rowIndex, context.rowFirst, context.rowLast)) {
        rootNode.removeChild(rowEntry.node);
        renderedRows.delete(rowIndex);
        count++;
      } else {
        for (const [columnIndex, columnEntry] of rowEntry.columns.entries()) {
          if (!isInInterval(columnIndex, context.columnFirst, context.columnLast)) {
            rowEntry.node.removeChild(columnEntry.node);
            rowEntry.columns.delete(columnIndex);
            count++;
          }
        }
      }
    }
    // performance.mark(count + ' deleted nodes');
  };

  scheduleWork(task: Function) {
    this.tasks.current.push(task);
    if (!this.tasksScheduled) {
      this.tasksScheduled = true;
      setImmediate(this.scheduleCallback);
    }
  }

  scheduleCallback = () => {
    this.tasksScheduled = false;
    const tasks = this.tasks.swap();
    for (let i = 0; i < tasks.length; i += 1) {
      tasks[i]();
    }
    tasks.length = 0;
  };

  getRowIndexAtY(y: float, approach: Approach) {
    return clamp(
      approach === Approach.FIRST
        ? floor(y / this.dimensions.row.height)
        : ceil(y / this.dimensions.row.height),
      0,
      this.rowLength,
    );
  }

  getColumnIndexAtX(x: float, approach: Approach) {
    return clamp(
      approach === Approach.FIRST
        ? floor(x / this.dimensions.column.width)
        : ceil(x / this.dimensions.column.width),
      0,
      this.columnLength,
    );
  }

  cleanup = () => {
    this.disposables.forEach((f) => f());
    this.rootNode.innerHTML = '';
  };
}

function isInInterval(index: integer, first: integer, last: integer) {
  return index >= first && index < last;
}
