export interface CellWalls {
  northWall?: boolean;
  southWall?: boolean;
  westWall?: boolean;
  eastWall?: boolean;
}

export interface Cell extends CellWalls {
  x: number;
  y: number;
  carved?: boolean;
}

export interface Coord {
  y: number;
  x: number;
}

export interface EstMaze {
  est: string[];
  win: Coord;
  initialLocation: Coord;
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

export interface MouseInterface {
  hasWall(relativeDir: RelativeDirection): boolean;
  hasReachedGoal(): boolean;
  turn(relativeDir: RelativeDirection): void;
  moveForward(cells: number): boolean;
}
