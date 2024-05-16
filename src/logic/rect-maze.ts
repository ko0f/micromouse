import {Maze} from "./maze";
import {AbsDirection, Cell, Coords, EstMaze, MouseInterface, RelativeDirection} from "./maze.model";

export class RectMaze extends Maze implements MouseInterface {
  private board: Cell[][] = [];
  private win: Coords = {x: 0, y: 0};
  private mouse: {
    location: Coords;
    direction: AbsDirection;
  } = {
    location: {x: 0, y: 0},
    direction: AbsDirection.south,
  };

  constructor(
    public width: number = 16,
    public height: number = 16,
  ) {
    super();
  }

  getBoard(): Cell[][] {
    return this.board;
  }

  getMouseDirection(): AbsDirection {
    return this.mouse.direction;
  }

  getMouseLocation(): Coords {
    return this.mouse.location;
  }

  override randomize() {
    this.board = [];
    // fill with a clean board
    for (let y = 0; y < this.height; y++) {
      const row: Cell[] = [];
      this.board.push(row);
      for (let x = 0; x < this.width; x++) {
        row.push({x, y, northWall: true, southWall: true, eastWall: true, westWall: true});
      }
    }
    // carv maze
    const totalCells = this.height * this.width;
    let carvedCells = 0;
    let x = 0;
    let y = 0;
    // let vector =
  }

  /**
   * EST format input - describes cell in e/s/t letters.
   * s = bottom wall
   * t = bottom+right walls
   * e = right wall
   * @param estMaze
   */
  load(estMaze: EstMaze) {
    if (!estMaze?.est?.length)
      throw new Error(`Empty EST string`);

    this.win = estMaze.win;
    this.mouse.direction = estMaze.initialDirection;
    this.mouse.location = estMaze.initialLocation;

    this.board = [];
    this.height = estMaze.est.length;
    this.width = estMaze.est[0].length;
    for (let y = 0; y < this.height; y++) {
      const row: Cell[] = [];
      this.board.push(row);
      const estRow = estMaze.est[y];
      for (let x = 0; x < this.width; x++) {
        const estCell = estRow[x]; // b/i/r
        row.push({
          x, y, carved: true,
          northWall: y == 0 || this.board[y-1][x].southWall,
          southWall: 'st'.includes(estCell),
          eastWall: 'et'.includes(estCell),
          westWall: x == 0 || this.board[y][x-1].eastWall
        });
      }
    }
  }

  // --------------------------------------------------------------------------
  //   Mouse Interface

  hasWall(relativeDir: RelativeDirection): boolean {
    let checkDir: AbsDirection = (this.mouse.direction + relativeDir) % 4;
    switch (checkDir) {
      case AbsDirection.north:
        return this.board[this.mouse.location.y][this.mouse.location.x].northWall!;
      case AbsDirection.south:
        return this.board[this.mouse.location.y][this.mouse.location.x].southWall!;
      case AbsDirection.east:
        return this.board[this.mouse.location.y][this.mouse.location.x].eastWall!;
      case AbsDirection.west:
        return this.board[this.mouse.location.y][this.mouse.location.x].westWall!;
    }
  }

  hasReachedGoal(): boolean {
    return this.mouse.location.x == this.win.x && this.mouse.location.y == this.win.y;
  }

  moveForward(cells: number): boolean {
    const mouseCell = this.board[this.mouse.location.y][this.mouse.location.x];
    switch (this.mouse.direction) {
      case AbsDirection.north:
        if (mouseCell.northWall || this.mouse.location.y == 0)
          return false;
        this.mouse.location.y -= cells;
        break;
      case AbsDirection.east:
        if (mouseCell.eastWall || this.mouse.location.x == this.width-1)
          return false;
        this.mouse.location.x += cells;
        break;
      case AbsDirection.south:
        if (mouseCell.southWall || this.mouse.location.y == this.height-1)
          return false;
        this.mouse.location.y += cells;
        break;
      case AbsDirection.west:
        if (mouseCell.westWall || this.mouse.location.x == 0)
          return false;
        this.mouse.location.x -= cells;
        break;
    }
    return true;
  }

  turn(relativeDir: RelativeDirection): void {
    this.mouse.direction = (this.mouse.direction + relativeDir) % 4;
    console.log(this.mouse.direction);
  }
}
