import {Cell} from "./maze.model";

export interface NaiveMouseCell extends Cell {
  distance?: number;
  time?: number;
  deadend?: boolean;
}

export type NaiveMouseBoard = NaiveMouseCell[][];
