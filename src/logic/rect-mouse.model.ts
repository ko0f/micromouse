import {Cell} from "./maze.model";

export interface RectMouseCell extends Cell {
  distance?: number;
  time?: number;
  deadend?: boolean;
}

export type RectMouseBoard = RectMouseCell[][];

export enum PathingGoal {
  Distance,
  Time
}
