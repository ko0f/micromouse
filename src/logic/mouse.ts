import {MazeMouseInterface} from "./maze.model";

export class Mouse {

  constructor(
    public maze: MazeMouseInterface
  ) {
  }

  solve() {
    throw new Error(`Not implemented`);
  }
}
