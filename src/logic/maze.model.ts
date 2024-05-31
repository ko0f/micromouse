import {MouseState} from "./mouse.model";

export interface MazeUiDelegate {
  onMouseMoved(dontRedraw?: boolean): void;
  onMouseChangedState(state: MouseState): void;
  redrawRequired(): void;
}

export interface CellWalls {
  northWall: number;
  southWall: number;
  westWall: number;
  eastWall: number;
}

export interface Cell extends CellWalls {
  x: number;
  y: number;
  explored?: boolean;
  visited?: boolean;
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

export interface UIMouseInterface {
  draw(): void;
}

export interface MazeMouseInterface {
  /**
   * Returns the maze's name.
   */
  getMazeName(): string;
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
  moveForward(cells: number, dontRedraw?: boolean): boolean;
}

export interface RectMazePerspective {
  getBoard(): MazeBoard;
  getWinLocation(): Coords|undefined;
  getMouseLocation(): Coords;
  getMouseDirection(): AbsDirection;
  getWidth(): number;
  getHeight(): number;
  getText(cell: Cell, textType: CellText): string|undefined;
}

export type MazeBoard = Cell[][];
export type CellEvent = (coords: Coords) => void;

export enum CellText {
  None,
  Distance,
  Time,
  Deadend,
  PathBy,
}
