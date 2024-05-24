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
  Finished
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
