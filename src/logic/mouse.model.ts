import {AbsDirection} from "./maze.model";

export enum MouseSpeed {
  Insta = 1,
  Fast = 10,
  Medium = 100,
  Slow = 500,
}

export enum MouseState {
  Placed,
  Exploring,
  Backtracking,
  Solved,
  Stuck,
  Finished,
  Pathing,
}

export interface RelativeCell {
  frontWall: number;
  backWall: number;
  rightWall: number;
  leftWall: number;
}

export interface MouseBacktrackInst {
  steps: number;
  dir: AbsDirection;
}

export const MovementTime = {
  turn: 100,
  move: (total: number) => {
    if (total > 3)
      return 500 + total * 50 + 200;
    else if (total > 2)
      return 600;
    else if (total > 1)
      return 500;
      return 400;
  }
}
