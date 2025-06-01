import { floor, ceil, clamp } from './math';
import {
  float,
  integer,
  Position,
  Dimensions,
  Padding,
  Context,
  Approach,
  ScrollDirection,
  SwapArray,
} from './primitives';
import { setImmediate } from './setImmediate';

const TIME_ORIGIN = performance.timeOrigin;

type Options = {
  rootNode: HTMLElement;
  rowLength: number;
  columnLength: number;
  rowHeight: number;
  columnWidth: number;
  layout?: Partial<VirtualContainer['layout']>;
  render: (row: number, column: number, node: HTMLElement) => void;
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

  scrollTimestamp: integer;
  /** High-precision timestamp */
  scrollTimestampHP: float;
  scrollPosition: Position;
  scrollDirection: ScrollDirection;

  ignoreNextScroll: boolean;
  wheelDeltaY: float;
  wheelDeltaX: float;

  padding: Padding;
  currentContext: Context;

  // PERF: find a better data structure
  renderedRows: Map<integer, RowEntry>;

  render: (row: number, column: number, node: HTMLElement) => void;

  tasks: SwapArray<Function>;
  tasksScheduled: boolean;

  disposables: Set<Function>;

  constructor(options: Options) {
    this.options = options;

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

    this.scrollTimestamp = 0;
    this.scrollTimestampHP = NaN;
    this.scrollPosition = { ...Position.EMPTY };
    this.scrollPosition.x = 0;
    this.scrollPosition.y = 0;
    this.scrollDirection = ScrollDirection.NONE;

    this.ignoreNextScroll = false;
    this.wheelDeltaX = NaN;
    this.wheelDeltaX = 0;
    this.wheelDeltaY = NaN;
    this.wheelDeltaY = 0;

    this.padding = { ...Padding.DEFAULT };
    this.currentContext = Context.EMPTY;

    this.renderedRows = new Map();

    this.render = options.render;

    this.tasks = new SwapArray();
    this.tasksScheduled = false;

    this.disposables = new Set();

    this.setup();
  }

  setup() {
    this.readDimensions();
    this.attachEventHandlers();

    this.writeDimensions();
    this.writeNodes();
  }

  attachEventHandlers() {
    this.rootNode.addEventListener('wheel', this.onWheel);
    this.rootNode.addEventListener('scroll', this.onScroll);
    this.disposables.add(() => {
      this.rootNode.removeEventListener('wheel', this.onWheel);
      this.rootNode.removeEventListener('scroll', this.onScroll);
    });
  }

  readDimensions() {
    const { options, layout, dimensions } = this;

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
  }

  writeDimensions() {
    const { content, root } = this.dimensions;
    this.fillerNode.style.width = Math.max(content.width, root.width) + 'px';
    this.fillerNode.style.height = Math.max(content.height, root.height) + 'px';
  }

  onWheel = (event: WheelEvent) => {
    performance.mark(`dy: ${event.deltaY}`);
    // const dy = event.deltaY;
    // console.log(dy, Math.abs(dy) > 40 ? 'prevent' : undefined, event);
    // if (Math.abs(dy) > 40) {
    //   event.preventDefault();
    //   this.wheelDeltaY += dy;
    //   this.onScroll(event);
    //   this.ignoreNextScroll = true;
    // }
  };

  onScroll = (event: Event) => {
    if (this.ignoreNextScroll) {
      this.ignoreNextScroll = false;
      return;
    }

    if (this.wheelDeltaY) {
      this.rootNode.scrollTop += this.wheelDeltaY;
      this.wheelDeltaY = 0;
    }

    const tPrevious = this.scrollTimestampHP;
    const tNext = event.timeStamp;

    const dt = tNext - tPrevious;

    const xPrevious = this.scrollPosition.x;
    const yPrevious = this.scrollPosition.y;
    const xNext = this.rootNode.scrollLeft;
    const yNext = this.rootNode.scrollTop;

    // TODO: clamp for scroll bounce
    const dx = xNext - xPrevious;
    const dy = yNext - yPrevious;

    const ds = Math.abs(dx) > Math.abs(dy) ? dx : dy;
    const scrollSpeed = dt === 0 ? 0 : ds / dt;
    performance.mark(ds + 'px, ' + scrollSpeed.toPrecision(4) + 'px / ms');

    this.scrollTimestamp = ~~(event.timeStamp - TIME_ORIGIN);
    this.scrollTimestampHP = event.timeStamp;

    // PERF: don't change direction too fast for small diagonal deviations
    this.scrollDirection = ScrollDirection.forDelta(dx, dy);

    this.scrollPosition.x = xNext;
    this.scrollPosition.y = yNext;

    this.padding = Padding.forDirection(this.scrollDirection, 800, false);

    this.writeNodes();
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

  writeNodes() {
    const { layout, dimensions, padding, scrollPosition, renderedRows } = this;

    const viewport = dimensions.viewport;

    const yMin = scrollPosition.y - padding.top;
    const yMax = scrollPosition.y + viewport.height + padding.bottom;

    const xMin = scrollPosition.x - padding.left;
    const xMax = scrollPosition.x + viewport.width + padding.right;

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
        this.render(r, 1, rowEntry.node);
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

            this.render(r, c, column);

            rowEntry.node.appendChild(column);
          }
        }
      }
    }

    performance.mark(renderedRows.size + ' rows, ' + newRowsCount + ' added');
    performance.mark(ScrollDirection[this.scrollDirection]);

    this.currentContext = nextContext;
    this.scheduleWork(this.removeNodes);
  }

  removeNodes = () => {
    const { renderedRows, rootNode, currentContext: context } = this;

    for (const [rowIndex, rowEntry] of renderedRows.entries()) {
      if (!isInInterval(rowIndex, context.rowFirst, context.rowLast)) {
        rootNode.removeChild(rowEntry.node);
        renderedRows.delete(rowIndex);
      } else {
        for (const [columnIndex, columnEntry] of rowEntry.columns.entries()) {
          if (!isInInterval(columnIndex, context.columnFirst, context.columnLast)) {
            rowEntry.node.removeChild(columnEntry.node);
            rowEntry.columns.delete(columnIndex);
          }
        }
      }
    }
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

  cleanup = () => {
    this.disposables.forEach((f) => f());
    this.rootNode.innerHTML = '';
  };
}

function isInInterval(index: integer, first: integer, last: integer) {
  return index >= first && index < last;
}
