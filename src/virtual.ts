type Options = {
  rootNode: HTMLElement;
  rowLength: number;
  columnLength: number;
  rowSize: number;
  columnSize: number;
  layout?: Partial<VirtualContainer['layout']>;
  render: (row: number, column: number, node: HTMLElement) => void;
};

type Dimensions = { width: number; height: number };

const DIMENSIONS_EMPTY = { width: 0, height: 0 };

const LAYOUT_DEFAULT = { hasColumns: true, hasRows: true };

export class VirtualContainer {
  options: Options;

  rowLength: number;
  columnLength: number;
  rowWidth: number;
  columnHeight: number;

  rootNode: HTMLElement;
  fillerNode: HTMLElement;

  layout: {
    hasColumns: boolean;
    hasRows: boolean;
  };

  dimensions: {
    root: Dimensions;
    content: Dimensions;
  };

  render: (row: number, column: number, node: HTMLElement) => void;

  disposables: Function[];

  constructor(options: Options) {
    this.options = options;

    this.rowLength = options.rowLength;
    this.columnLength = options.columnLength;
    this.rowWidth = options.rowSize;
    this.columnHeight = options.columnSize;
    this.render = options.render;

    this.rootNode = options.rootNode;
    this.fillerNode = document.createElement('div');
    this.fillerNode.className = 'virtual--filler';
    this.rootNode.appendChild(this.fillerNode);

    this.layout = {
      ...LAYOUT_DEFAULT,
      ...options.layout,
    };

    this.dimensions = {
      root: DIMENSIONS_EMPTY,
      content: DIMENSIONS_EMPTY,
    };
    this.disposables = [];

    this.setup();
  }

  setup() {
    this.readDimensions();
    this.attachEventHandlers();

    const rowsToRender = Math.ceil(this.dimensions.root.height / this.rowWidth);

    for (let i = 0; i < rowsToRender; i += 1) {
      const row = document.createElement('div');
      row.className = 'virtual--row';
      row.style.width = this.columnHeight + 'px';
      row.style.height = this.rowWidth + 'px';

      this.render(i, 1, row);
      this.rootNode.appendChild(row);
    }

    this.writeDimensions();
  }

  attachEventHandlers() {
    this.rootNode.addEventListener('scroll', this.onScroll);
    this.disposables.push(() => {
      this.rootNode.removeEventListener('scroll', this.onScroll);
    });
  }

  readDimensions() {
    const { options, layout, dimensions } = this;
    const rect = this.rootNode.getBoundingClientRect();

    dimensions.root = { width: rect.width, height: rect.height };
    dimensions.content = {
      width: this.layout.hasColumns ? this.columnLength * this.columnHeight : dimensions.root.width,
      height: this.layout.hasRows ? this.rowLength * this.rowWidth : dimensions.root.height,
    };

    this.rowWidth = layout.hasColumns ? options.rowSize : dimensions.root.width;
    this.columnHeight = layout.hasRows ? options.columnSize : dimensions.root.height;
  }

  writeDimensions() {
    this.fillerNode.style.width = this.dimensions.content.width + 'px';
    this.fillerNode.style.height = this.dimensions.content.height + 'px';
  }

  onScroll = (event: Event) => {
    console.log(event);
  };

  cleanup = () => {
    this.disposables.forEach((f) => f());
    this.rootNode.innerHTML = '';
  };
}
