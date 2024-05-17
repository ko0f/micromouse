import {MazeMouseInterface} from "./maze.model";
import {MouseSpeed} from "./mouse.model";

export class Mouse {

  constructor(
    public maze: MazeMouseInterface,
    public speed: MouseSpeed = MouseSpeed.Fast,
  ) {
  }

  async dwell() {
    return new Promise(resolve => setTimeout(resolve, this.speed));
  }

  solve() {
    throw new Error(`Not implemented`);
  }
}
