import { abs } from './math';

export type float = number;
export type integer = number;
export type Timestamp = float;

export type Position = { x: float; y: float };
export namespace Position {
  export const EMPTY = create(0, 0);
  export function create(x: float, y: float) {
    const point = { x: NaN, y: NaN };
    point.x = x;
    point.y = y;
    return point;
  }
}

export type Vector = { x: float; y: float };
export namespace Vector {
  export const EMPTY = create(0, 0);
  export function create(x: float, y: float) {
    const vector = { x: NaN, y: NaN };
    vector.x = x;
    vector.y = y;
    return vector;
  }
  export function clone(v: Vector) {
    return create(v.x, v.y);
  }
  export function getMainDimension(v: Vector) {
    return abs(v.x) > abs(v.y) ? v.x : v.y;
  }
}

export type Dimensions = { width: float; height: float };
export namespace Dimensions {
  export const EMPTY = create(0, 0);
  export function create(width: float, height: float) {
    const dimensions = { width: NaN, height: NaN };
    dimensions.width = width;
    dimensions.height = height;
    return dimensions;
  }
}

/** If we're trying to find a value at the start of a range or at the end of it. */
export enum Approach {
  FIRST,
  LAST,
}

export enum ScrollDirection {
  NONE,
  UP,
  DOWN,
  LEFT,
  RIGHT,
}
export namespace ScrollDirection {
  export function forDelta(dx: number, dy: number) {
    if (dx === 0 && dy === 0) {
      return ScrollDirection.NONE;
    }
    /* eslint-disable */
    if (abs(dy) >= abs(dx)) {
      if (dy > 0) {
        return ScrollDirection.DOWN;
      } else {
        return ScrollDirection.UP;
      }
    } else {
      if (dx > 0) {
        return ScrollDirection.RIGHT;
      } else {
        return ScrollDirection.LEFT;
      }
    }
    /* eslint-enable */
  }
}

export enum WheelBehavior {
  NATIVE,
  CONTROLLED,
}

/**
 * First to last intervals:
 *   [first, last[
 *
 * Represented as such to fit in:
 *  - `array.slice(first, last)`
 *  - `for (let i = first; i < last; i++)`.
 */
export type Context = {
  rowFirst: integer;
  rowLast: integer;
  columnFirst: integer;
  columnLast: integer;
};
export namespace Context {
  export const EMPTY = {
    rowFirst: 0,
    rowLast: 0,
    columnFirst: 0,
    columnLast: 0,
  };
}

export type Padding = {
  top: integer;
  right: integer;
  bottom: integer;
  left: integer;
};
export namespace Padding {
  export const DEFAULT = { top: 200, right: 100, bottom: 200, left: 100 };

  export function forDirection(
    direction: ScrollDirection,
    scrollPadding: integer,
    isRtl: boolean,
  ): Padding {
    if (isRtl) {
      switch (direction) {
        case ScrollDirection.LEFT:
          direction = ScrollDirection.RIGHT;
          break;
        case ScrollDirection.RIGHT:
          direction = ScrollDirection.LEFT;
          break;
        default:
      }
    }

    switch (direction) {
      case ScrollDirection.NONE:
        return Padding.DEFAULT;
      case ScrollDirection.LEFT:
        return {
          top: 0,
          right: 0,
          bottom: 0,
          left: scrollPadding,
        };
      case ScrollDirection.RIGHT:
        return {
          top: 0,
          right: scrollPadding,
          bottom: 0,
          left: 0,
        };
      case ScrollDirection.UP:
        return {
          top: scrollPadding,
          right: 0,
          bottom: 0,
          left: 0,
        };
      case ScrollDirection.DOWN:
        return {
          top: 0,
          right: 0,
          bottom: scrollPadding,
          left: 0,
        };
      default:
        throw new Error('unreachable');
    }
  }
}

/** An array that swaps between two instances to avoid allocations */
export class SwapArray<T> {
  current = [] as T[];
  previous = [] as T[];
  swap() {
    const current = this.current;
    const previous = this.previous;
    this.previous = current;
    this.current = previous;
    this.current.length = 0;
    return current;
  }
}
