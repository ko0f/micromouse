import {MazeUiDelegate} from "./maze.model";

export class Maze {

  constructor(
    protected uiDelegate?: MazeUiDelegate,
  ) {
  }

  randomBinary(): boolean {
    return Math.random() < 0.5
  }

  randomize() {
    throw new Error('Not implemented');
  }
}
