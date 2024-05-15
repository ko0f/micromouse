import {Maze} from "./maze";
import {Cell} from "./maze.model";

export class RectangularMaze extends Maze {
  board: Cell[][] = [];

  constructor(
    public width: number = 50,
    public height: number = 50,
  ) {
    super();
  }

  override randomize() {
    this.board = [];
    for (let y = 0; y < this.height; y++) {
      const row: Cell[] = [];
      this.board.push(row);
      for (let x = 0; x < this.width; x++) {
        row.push({
          x,
          y,
          wt: y == 0 || this.board[y-1][x].wb,
          wl: x == 0 || this.board[y][x-1].wb,
          wr: x == this.width - 1 || this.randomBinary(),
          wb: y == this.height - 1 || this.randomBinary()
        });
      }
    }
  }

  fix() {
    for (let y = 0; y < this.height; y++) {
      const row: Cell[] = [];
      this.board.push(row);
      for (let x = 0; x < this.width; x++) {
        row.push({x, y, wr: this.randomBinary(), wb: this.randomBinary()});
      }
    }
  }
}
