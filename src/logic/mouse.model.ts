import {RelativeDirection} from "./maze.model";

export enum MouseSpeed {
  Insta,
  Fast = 100,
  Medium = 500,
  Slow = 1000,
}

export enum MouseState {
  Placed,
  Exploring,
  Backtracking,
  Solved,
  Stuck
}

export interface RelativeCell {
  frontWall: number;
  backWall: number;
  rightWall: number;
  leftWall: number;
}

export interface MouseBacktrackInst {
  moveForward?: number;
  turn?: RelativeDirection;
}
