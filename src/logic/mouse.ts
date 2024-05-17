import {MazeMouseInterface} from "./maze.model";
import {MouseSpeed} from "./mouse.model";

export class Mouse {

  protected _stop: boolean = false
  protected solved: boolean = false;

  constructor(
    public maze: MazeMouseInterface,
    public speed: MouseSpeed = MouseSpeed.Fast,
  ) {
  }

  async dwell() {
    return new Promise(resolve => setTimeout(resolve, this.speed));
  }

  async solve() {
    throw new Error(`Not implemented`);
  }

  async continue() {
    throw new Error(`Not implemented`);
  }

  stop() {
    this._stop = true;
  }
}
