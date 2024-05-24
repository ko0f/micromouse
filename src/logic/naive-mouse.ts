import {Mouse} from "./mouse";
import {
  AbsDirection,
  Cell,
  CellEvent,
  CellText,
  Coords,
  MazeBoard,
  MazeMouseInterface,
  MazeUiDelegate,
  RelativeDirection
} from "./maze.model";
import {MouseBacktrackInst, MouseSpeed, MouseState, RelativeCell} from "./mouse.model";
import {NaiveMouseBoard, NaiveMouseCell} from "./naive-mouse.model";

/**
 * Simple mouse in rect maze solver.
 *
 * Since mouse doesn't know its absolute direction, it'll assume initial placement direction of north,
 * init a memory board double the size and start in the middle, then explore from there.
 *
 * Example:
 *   Maze size 2x2
 *   Memory maze:
 *     # # # # #
 *     # # # # #
 *     # # ^ # #
 *     # # # # #
 *     # # # # #
 */
export class NaiveMouse extends Mouse {

  // board state
  board!: NaiveMouseBoard;
  location!: Coords;
  direction!: AbsDirection;
  cheese?: Coords;
  // board stats
  totalCells: number = 0;
  exploredCells: number = 0;
  backtrackCount: number = 0;

  // exploration state
  state: MouseState = MouseState.Placed;
  junctions: MouseBacktrackInst[][] = []; // Stack of instructions on how to get to last junction.
  createNewJunction: boolean = false;

  // config
  autoContinue: boolean = true;
  pathBy: string = 'time';

  constructor(
    maze: MazeMouseInterface,
    speed: MouseSpeed = MouseSpeed.Fast,
    ui: MazeUiDelegate,
  ) {
    super(maze, speed, ui);
    this.initMemoryBoard();
  }

  override async solve() {
    await this.explore();
    if (this.state == MouseState.Stuck)
      console.log(`Mouse: Stuck!`);
    else if (this.state == MouseState.Solved) {
      console.log(`Mouse: Solved!`);
      if (this.autoContinue) {
        await this.dwell(1000);
        await this.continue();
      }
    }
  }

  override async continue() {
    await this.explore();
    if (this.state == MouseState.Stuck) {
      console.log(`Mouse: Stuck!`);
    } else {
      this.state = MouseState.Finished;
      console.log(`Mouse: Finished!`);
    }
  }

  override async goto(_dest: Coords, pathBy: string): Promise<void> {
    this.pathBy = pathBy;
    if (this.state == MouseState.Finished) {
      const dest: Coords = {y: this.location.y + _dest.y, x: this.location.x + _dest.x};
      console.log(`Goto ${_dest.y},${_dest.x} -> ${dest.y},${dest.x}`);

      await this.floodFill(this.location, dest);

      do {
        let cell = this.board[this.location.y][this.location.x];
        let dir: AbsDirection | undefined;
        let minValue = Infinity;
        cell.visited = true;

        const checkWall = (wallDir: AbsDirection) => {
          if (!this.hasWall(cell, wallDir)) {
            let nextCell = this.getAbsCell(wallDir);
            if (!nextCell.visited && (nextCell as any)[this.pathBy] < minValue) {
              dir = wallDir;
              minValue = (nextCell as any)[this.pathBy];
            }
          }
        };
        checkWall(AbsDirection.north);
        checkWall(AbsDirection.south);
        checkWall(AbsDirection.east);
        checkWall(AbsDirection.west);

        if (dir == undefined)
          throw `Got stuck!`;
        else {
          const relDir = (dir - this.direction + 4) % 4;
          this.turn(relDir);
          this.moveForward(1);
        }
        await this.dwell();
      } while (this.location.y != dest.y || this.location.x != dest.x);
      this.ui.redrawRequired();
    } else {
      console.log(`Must finish maze first!`)
    }
  }

  async floodFill(source: Coords, dest: Coords, distance: number = 0, time: number = 0, dir?: AbsDirection) {
    if (!distance) {
      this.resetExplored();
    }

    if (dest.y == source.y && dest.x == source.x) {
      return; // reached dest
    }

    if (!this.board[dest.y] || !this.board[dest.y][dest.x]) {
      return; // memory maze borders
    }

    const cell = this.board[dest.y][dest.x];
    if (cell.explored && (this.pathBy == 'distance' && cell.distance! <= distance || this.pathBy == 'time' && cell.time! <= time)) {
      return;
    }

    cell.explored = true;
    if (cell.deadend) {
      cell.distance = 999;
      cell.time = 999;
      return;
    }
    cell.distance = distance;
    cell.time = time;

    // await this.dwell(undefined, true);

    if (!cell.northWall)
      await this.floodFill(source, {...dest, y: dest.y-1}, distance+1, dir == AbsDirection.north ? time+0.1 : time+1, AbsDirection.north);
    if (!cell.southWall)
      await this.floodFill(source, {...dest, y: dest.y+1}, distance+1, dir == AbsDirection.south ? time+0.1 : time+1, AbsDirection.south);
    if (!cell.westWall)
      await this.floodFill(source, {...dest, x: dest.x-1}, distance+1, dir == AbsDirection.west ? time+0.1 : time+1, AbsDirection.west);
    if (!cell.eastWall)
      await this.floodFill(source, {...dest, x: dest.x+1}, distance+1, dir == AbsDirection.east ? time+0.1 : time+1, AbsDirection.east);
  }


  // ============================================================================================
  //   Exploration

  async explore() {
    this.state = MouseState.Exploring;

    try {
      while (this.shouldKeepExploring() && !this._stop) {
        await this.dwell();
        const cell = this.inspectCurrentCell();
        const relCell = this.convertToRelativeCell(cell);

        const unexploredFront = !relCell.frontWall && !this.getRelCell(RelativeDirection.front).explored ? 1 : 0;
        const unexploredLeft = !relCell.leftWall && !this.getRelCell(RelativeDirection.left).explored ? 1 : 0;
        const unexploredRight = !relCell.rightWall && !this.getRelCell(RelativeDirection.right).explored ? 1 : 0;
        const isDeadend: boolean = !!relCell.frontWall && !!relCell.leftWall && !!relCell.rightWall;

        const numberOfOptions = unexploredRight + unexploredLeft + unexploredFront;
        if (numberOfOptions > 1) {
          console.log(`Mouse: Junction detected`);
          this.junctions.push([]);
        }

        if (unexploredRight) {
          this.turn(RelativeDirection.right);
          this.moveForward(1);
        } else if (unexploredLeft) {
          this.turn(RelativeDirection.left);
          this.moveForward(1);
        } else if (unexploredFront) {
          this.moveForward(1);
        } else {
          // already explored or dead end
          await this.backtrack(isDeadend);
        }
      }
    } catch (e) {
      this.state = MouseState.Stuck;
      console.error(e);
    }
    if (this.maze.hasReachedGoal()) {
      this.state = MouseState.Solved;
      this.solved = true;
      this.cheese = {...this.location};
    }
  }

  initMemoryBoard() {
    const size = this.maze.getSize();
    this.totalCells = size.height * size.width;
    this.exploredCells = 0;

    // middle of the memory maze
    this.location = {
      x: size.width,
      y: size.height
    }
    this.direction = AbsDirection.north;

    this.board = [];
    for (let y = 0; y < size.height * 2 + 1; y++) {
      const row: Cell[] = [];
      this.board.push(row);
      for (let x = 0; x < size.width * 2 + 1; x++) {
        row.push({
          x, y, explored: false,
          northWall: 0,
          southWall: 0,
          eastWall: 0,
          westWall: 0,
        });
      }
    }
  }

  inspectCurrentCell(): NaiveMouseCell {
    const cell = this.board[this.location.y][this.location.x];
    if (!cell.explored) {
      this.exploredCells += 1;
      cell.explored = true;
      cell.northWall = this.maze.hasWall((AbsDirection.north - this.direction + 4) % 4) ? 1 : 0;
      cell.eastWall = this.maze.hasWall((AbsDirection.east - this.direction + 4) % 4) ? 1 : 0;
      cell.southWall = this.maze.hasWall((AbsDirection.south - this.direction + 4) % 4) ? 1 : 0;
      cell.westWall = this.maze.hasWall((AbsDirection.west - this.direction + 4) % 4) ? 1 : 0;

      // update walls of adjacent cells
      if (cell.northWall) {
        const _cell = this.getAbsCell(AbsDirection.north);
        _cell.southWall = 1;
        this.checkCellIndirectKnowledge(_cell);
      }
      if (cell.southWall) {
        const _cell = this.getAbsCell(AbsDirection.south);
        _cell.northWall = 1;
        this.checkCellIndirectKnowledge(_cell);
      }
      if (cell.eastWall) {
        const _cell = this.getAbsCell(AbsDirection.east);
        _cell.westWall = 1;
        this.checkCellIndirectKnowledge(_cell);
      }
      if (cell.westWall) {
        const _cell = this.getAbsCell(AbsDirection.west);
        _cell.eastWall = 1;
        this.checkCellIndirectKnowledge(_cell);
      }
    }
    return cell;
  }

  shouldKeepExploring() {
    return this.state != MouseState.Finished && (this.solved ?
      this.exploredCells < this.totalCells :
      !this.maze.hasReachedGoal());
  }

  /**
   * Skips cells we can conclude are a dead-end
   * @param cell
   */
  checkCellIndirectKnowledge(cell: NaiveMouseCell) {
    if (!cell.explored && cell.northWall + cell.southWall + cell.eastWall + cell.westWall >= 3) {
      cell.explored = true;
      cell.deadend = true;
      this.exploredCells += 1;
    }
  }

  moveForward(cells: number, preMoveAction?: CellEvent, postMoveAction?: (coords: Coords) => void): void {
    console.log(`Mouse: Moving forward ${cells}`);

    if (!this.maze.moveForward(cells))
      throw `Crashed into a wall!`;

    for (let i = 0; i < cells; i++) {
      preMoveAction && preMoveAction(this.location);
      switch (this.direction) {
        case AbsDirection.north:
          this.location.y--;
          break;
        case AbsDirection.east:
          this.location.x++;
          break;
        case AbsDirection.south:
          this.location.y++;
          break;
        case AbsDirection.west:
          this.location.x--;
          break;
      }
      postMoveAction && postMoveAction(this.location);
    }

    // record backtrack instructions
    if (this.state == MouseState.Exploring && this.junctions.length) {
      if (this.createNewJunction) {
        this.createNewJunction = false;
        this.junctions.push([]);
      }
      const junction = this.junctions[this.junctions.length - 1];
      if (!junction.length) {
        junction.push({steps: cells, dir: this.direction});
      } else {
        junction[junction.length - 1].steps += cells;
      }
    }
  }

  turn(relativeDir: RelativeDirection): void {
    console.log(`Mouse: Turning ${relativeDir}`);
    this.maze.turn(relativeDir);
    this.direction = (this.direction + relativeDir) % 4;

    // record backtrack instructions, don't record first turn
    if (this.state == MouseState.Exploring && this.junctions.length) {
      this.createNewJunction = false;
      const junction = this.junctions[this.junctions.length - 1];
      junction.push({dir: this.direction, steps: 0});
    }
  }

  /**
   * Reached dead end, go back to last junction
   */
  async backtrack(isDeadend: boolean) {
    this.backtrackCount++;
    console.log(`Mouse: Backtracking #${this.backtrackCount}`);
    let instructions = this.junctions.pop();
    if (!instructions) {
      // no more junctions
      if (this.solved) {
        this.state = MouseState.Finished;
        return;
      } else {
        this.state = MouseState.Stuck;
        throw `No more junctions!`
      }
    }

    this.state = MouseState.Backtracking;
    this.turn(RelativeDirection.back);

    let preMove: CellEvent|undefined = isDeadend ? (coords) => {
      let cell = this.board[coords.y][coords.x];
      cell.deadend = true;
    } : undefined; // mark path to 1st junction as a dead end

    let inst;
    while (inst = instructions.pop()) {
      await this.dwell();
      const absDir = (inst.dir - this.direction + 6) % 4;
      this.turn(absDir);
      this.moveForward(inst.steps, preMove);
      if (preMove) {
        preMove = undefined; // do it only for the 1st backtrack
      }
    }
    console.log(`Mouse: Exploring`);
    this.state = MouseState.Exploring;
    this.createNewJunction = true;
  }


  // ============================================================================================
  //   Conversion utils

  convertToRelativeCell(cell: Cell): RelativeCell {
    switch (this.direction) {
      case AbsDirection.north:
        return {
          frontWall: cell.northWall ? 1 : 0,
          backWall: cell.southWall ? 1 : 0,
          rightWall: cell.eastWall ? 1 : 0,
          leftWall: cell.westWall ? 1 : 0,
        }
      case AbsDirection.south:
        return {
          frontWall: cell.southWall ? 1 : 0,
          backWall: cell.northWall ? 1 : 0,
          rightWall: cell.westWall ? 1 : 0,
          leftWall: cell.eastWall ? 1 : 0,
        }
      case AbsDirection.east:
        return {
          frontWall: cell.eastWall ? 1 : 0,
          backWall: cell.westWall ? 1 : 0,
          rightWall: cell.southWall ? 1 : 0,
          leftWall: cell.northWall ? 1 : 0,
        }
      case AbsDirection.west:
        return {
          frontWall: cell.westWall ? 1 : 0,
          backWall: cell.eastWall ? 1 : 0,
          rightWall: cell.northWall ? 1 : 0,
          leftWall: cell.southWall ? 1 : 0,
        }
    }
  }

  /**
   * Returns a memory cell relative to mouse position
   * @param relativeDir
   */
  getRelCell(relativeDir: RelativeDirection): NaiveMouseCell {
    let checkDir: AbsDirection = (this.direction + relativeDir) % 4;
    return this.getAbsCell(checkDir);
  }

  /**
   * Returns a memory cell
   * @param dir
   */
  getAbsCell(dir: AbsDirection): NaiveMouseCell {
    switch (dir) {
      case AbsDirection.north:
        return this.board[this.location.y - 1][this.location.x];
      case AbsDirection.south:
        return this.board[this.location.y + 1][this.location.x];
      case AbsDirection.east:
        return this.board[this.location.y][this.location.x + 1];
      case AbsDirection.west:
        return this.board[this.location.y][this.location.x - 1];
    }
  }

  hasWall(cell: Cell, dir: AbsDirection): boolean {
    switch (dir) {
      case AbsDirection.north:
        return !!cell.northWall;
      case AbsDirection.south:
        return !!cell.southWall;
      case AbsDirection.east:
        return !!cell.eastWall;
      case AbsDirection.west:
        return !!cell.westWall;
    }
  }

  override getBoard(): MazeBoard {
    return this.board;
  }

  override getWinLocation(): Coords|undefined {
    return this.cheese;
  }

  override getMouseLocation(): Coords {
    return this.location;
  }

  override getMouseDirection(): AbsDirection {
    return this.direction;
  }

  override getWidth(): number {
    return this.board.length;
  }

  override getHeight(): number {
    return this.board[0].length;
  }

  override getText(cell: NaiveMouseCell, textType: CellText): string | undefined {
    switch (textType) {
      case CellText.Time:
        return cell.time ? `${Math.round(cell.time*10)/10}` : '';
      case CellText.Distance:
        return `${cell.distance || ''}`;
      case CellText.PathBy:
        return cell.deadend ? 'D' : (this.pathBy == 'distance' ? `${cell.distance || ''}` : (cell.time ? `${Math.round(cell.time*10)/10}` : ''));
      case CellText.Deadend:
        return cell.deadend ? 'D' : '';
    }
    return '';
  }

  // ============================================================================================
  //   Pathing

  scoreCells() {
    this.resetExplored();

  }

  resetExplored() {
    for (let y = 0; y < this.board.length; y++) {
      const row = this.board[y];
      for (let x = 0; x < row.length; x++) {
        const cell = row[x];
        cell.visited = false;
        cell.explored = false;
        cell.distance = undefined;
        cell.time = undefined;
      }
    }
  }

}
