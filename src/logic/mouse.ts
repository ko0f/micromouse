import {
  AbsDirection,
  Cell, CellText,
  Coords,
  MazeBoard,
  MazeMouseInterface, MazeUiDelegate,
  RectMazePerspective,
  UIMouseInterface
} from "./maze.model";
import {MouseSpeed} from "./mouse.model";
import {PathingGoal} from "./rect-mouse.model";

export class Mouse implements RectMazePerspective {

  protected _stop: boolean = false
  protected solved: boolean = false;

  constructor(
    public maze: MazeMouseInterface,
    public speed: MouseSpeed = MouseSpeed.Fast,
    public ui: MazeUiDelegate,
  ) {
  }

  async dwell(ms?: number, redraw?: boolean) {
    // if (redraw)
    //   this.ui.redrawRequired();
    return new Promise(resolve => setTimeout(resolve, ms || this.speed));
  }

  async solve() {
    throw new Error(`Not implemented`);
  }

  async continue() {
    throw new Error(`Not implemented`);
  }

  async goto(coords: Coords, pathBy: PathingGoal) {
    throw new Error(`Not implemented`);
  }

  stop() {
    this._stop = true;
  }

  getBoard(): MazeBoard {
    throw `Not implemented`;
  }

  getWinLocation(): Coords|undefined {
    throw `Not implemented`;
  }

  getMouseLocation(): Coords {
    throw `Not implemented`;
  }

  getMouseDirection(): AbsDirection {
    throw `Not implemented`;
  }

  getWidth(): number {
    throw `Not implemented`;
  }

  getHeight(): number {
    throw `Not implemented`;
  }

  getText(cell: Cell, textType: CellText): string | undefined {
    return undefined;
  }

  forgetMaze() {
    throw `Not implemented`;
  }
}
