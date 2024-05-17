import {MazeMouseInterface} from "./maze.model";
import {MouseSpeed} from "./mouse.model";

export class Mouse {

  constructor(
    public maze: MazeMouseInterface,
    public speed: MouseSpeed = MouseSpeed.Fast,
  ) {
  }

  solve() {
    throw new Error(`Not implemented`);
  }
}
