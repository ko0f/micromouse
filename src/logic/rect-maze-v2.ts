import {Maze} from "./maze";
import {Cell} from "./maze.model";

export class RectMazeV2 extends Maze {
  board: Cell[][] = [];

  constructor(
    public width: number = 50,
    public height: number = 50,
  ) {
    super();
  }

  override randomize() {
    this.board = [];
    // fill with a clean board
    for (let y = 0; y < this.height; y++) {
      const row: Cell[] = [];
      this.board.push(row);
      for (let x = 0; x < this.width; x++) {
        row.push({x, y, wt: true, wb: true, wr: true, wl: true});
      }
    }
    // carv maze
    const totalCells = this.height * this.width;
    let carvedCells = 0;
    let x = 0;
    let y = 0;
    // let vector =
  }

  randVector(y: number, x: number) {

  }

  /**
   * BIR format input - describes cell in b/i/r letters.
   * b = bottom wall
   * i = bottom+right walls
   * r = right wall
   * @param bir
   */
  loadBir(bir: string[]) {
    if (!bir.length)
      throw new Error(`Empty BIR string`);
    this.board = [];
    this.height = bir.length;
    this.width = bir[0].length;
    for (let y = 0; y < this.height; y++) {
      const row: Cell[] = [];
      this.board.push(row);
      const birRow = bir[y];
      for (let x = 0; x < this.width; x++) {
        const birCell = birRow[x]; // b/i/r
        row.push({
          x, y, carved: true,
          wt: y == 0 || this.board[y-1][x].wb,
          wb: 'bi'.includes(birCell),
          wr: 'ri'.includes(birCell),
          wl: x == 0 || this.board[y][x-1].wr
        });
      }
    }
  }
}
