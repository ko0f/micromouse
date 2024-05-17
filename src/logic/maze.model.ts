export type MazeBoard = Cell[][];

export interface MazeUiDelegate {
  onMouseMoved(): void;
}

export interface CellWalls {
  northWall?: boolean;
  southWall?: boolean;
  westWall?: boolean;
  eastWall?: boolean;
}

export interface Cell extends CellWalls {
  x: number;
  y: number;
  explored?: boolean;
}

export interface Coords {
  y: number;
  x: number;
}

export interface EstMaze {
  est: string[];
  win: Coords;
  initialLocation: Coords;
  initialDirection: AbsDirection;
}

export enum AbsDirection {
  north,
  east,
  south,
  west
}

export enum RelativeDirection {
  front,
  right,
  back,
  left
}

export interface MazeMouseInterface {
  /**
   * Check if there's a wall.
   * @param relativeDir Since the mouse doesn't know where north is, the maze can tell if there's a wall relative to the mouse.
   */
  hasWall(relativeDir: RelativeDirection): boolean;

  /**
   * Checks if mouse reached the cheese.
   */
  hasReachedGoal(): boolean;

  /**
   * Returns size of the maze.
   */
  getSize(): {width: number, height: number};

  /**
   * Turns the mouse.
   * @param relativeDir
   */
  turn(relativeDir: RelativeDirection): void;

  /**
   * Moves the mouse.
   * @param cells
   */
  moveForward(cells: number): boolean;
}
