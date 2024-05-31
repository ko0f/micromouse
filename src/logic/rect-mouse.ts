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
import {PathingGoal, RectMouseBoard, RectMouseCell} from "./rect-mouse.model";

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
export class RectMouse extends Mouse {

  // board state
  board!: RectMouseBoard;
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
  pathBy: PathingGoal = PathingGoal.Time;

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
      this.setState(MouseState.Finished);
      this.rememberMaze();
      console.log(`Mouse: Finished!`);
      await this.goHome();
    }
  }

  async goHome() {
    const size = this.maze.getSize();
    await this.goto({x: size.width - this.location.x, y: size.height - this.location.y}, this.pathBy);
  }

  // ============================================================================================
  //   Exploration

  async explore() {
    this.setState(MouseState.Exploring);

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
      this.setState(MouseState.Stuck);
      console.error(e);
    }
    if (this.maze.hasReachedGoal()) {
      this.setState(MouseState.Solved);
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

    if (!this.recallMaze()) {
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
  }

  inspectCurrentCell(): RectMouseCell {
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
  checkCellIndirectKnowledge(cell: RectMouseCell) {
    if (!cell.explored && cell.northWall + cell.southWall + cell.eastWall + cell.westWall >= 3) {
      cell.explored = true;
      cell.deadend = true;
      this.exploredCells += 1;
    }
  }

  moveForward(cells: number, dontRedraw?: boolean, preMoveAction?: CellEvent, postMoveAction?: (coords: Coords) => void): void {
    console.log(`Mouse: Moving forward ${cells}`);

    if (!this.maze.moveForward(cells, dontRedraw))
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
        this.setState(MouseState.Finished);
        return;
      } else {
        this.setState(MouseState.Stuck);
        throw `No more junctions!`
      }
    }

    this.setState(MouseState.Backtracking);
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
      this.moveForward(inst.steps, false, preMove);
      if (preMove) {
        preMove = undefined; // do it only for the 1st backtrack
      }
    }
    console.log(`Mouse: Exploring`);
    this.setState(MouseState.Exploring);
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
  getRelCell(relativeDir: RelativeDirection): RectMouseCell {
    let checkDir: AbsDirection = (this.direction + relativeDir) % 4;
    return this.getAbsCell(checkDir);
  }

  /**
   * Returns a memory cell
   * @param dir
   */
  getAbsCell(dir: AbsDirection): RectMouseCell {
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

  override getText(cell: RectMouseCell, textType: CellText): string | undefined {
    switch (textType) {
      case CellText.Time:
        return cell.time ? `${Math.round(cell.time*10)/10}` : '';
      case CellText.Distance:
        return `${cell.distance || ''}`;
      case CellText.PathBy:
        return cell.deadend ? 'D' : (this.pathBy == PathingGoal.Distance ? `${cell.distance || ''}` : (cell.time ? `${Math.round(cell.time*10)/10}` : ''));
      case CellText.Deadend:
        return cell.deadend ? 'D' : '';
    }
    return '';
  }

  getMazeMemoryKey() {
    return `mouse-maze-${this.maze.getMazeName()}`;
  }

  rememberMaze() {
    if (this.state == MouseState.Finished) {
      const storeObject = {
        board: this.board,
        cheese: this.cheese,
        totalCells: this.totalCells,
        exploredCells: this.exploredCells,
        state: this.state,
      }
      localStorage.setItem(this.getMazeMemoryKey(), JSON.stringify(storeObject));
    }
  }

  override forgetMaze() {
    localStorage.removeItem(this.getMazeMemoryKey());
  }

  recallMaze(): boolean {
    const json = localStorage.getItem(this.getMazeMemoryKey());
    if (json) {
      const storeObject = JSON.parse(json);
      this.board = storeObject.board;
      this.cheese = storeObject.cheese;
      this.totalCells = storeObject.totalCells;
      this.exploredCells = storeObject.exploredCells;
      this.state = storeObject.state;
      return true;
    }
    return false;
  }

  setState(state: MouseState) {
    this.state = state;
    this.ui.onMouseChangedState(this.state);
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

  override async goto(_dest: Coords, pathBy: PathingGoal): Promise<void> {
    this.pathBy = pathBy;
    if (this.state == MouseState.Finished) {
      let startTime = +Date.now();
      const dest: Coords = {y: this.location.y + _dest.y, x: this.location.x + _dest.x};
      console.log(`Goto ${_dest.y},${_dest.x} -> ${dest.y},${dest.x}`);

      await this.floodFill(this.location, dest);
      this.ui.redrawRequired();

      do {
        let cell = this.board[this.location.y][this.location.x];
        let dir: AbsDirection | undefined;
        let minValue = Infinity;
        cell.visited = true;

        const checkWall = (wallDir: AbsDirection) => {
          if (!this.hasWall(cell, wallDir)) {
            let nextCell = this.getAbsCell(wallDir);
            if (!nextCell.visited) {
              const nextCellValue = (nextCell as any)[PathByKey[this.pathBy]];
              if (nextCellValue != undefined && nextCellValue < minValue) {
                dir = wallDir;
                minValue = nextCellValue;
              }
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
          if (relDir != RelativeDirection.front) {
            this.turn(relDir);
            this.moveForward(1);
          } else
            this.moveForward(1);
        }
        await this.dwell();
      } while (this.location.y != dest.y || this.location.x != dest.x);
      this.ui.redrawRequired();
      let endTime = +Date.now();
      console.log(`It took ${(endTime - startTime)}ms!`);
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
    if (cell.explored && (this.pathBy == PathingGoal.Distance && cell.distance! <= distance || this.pathBy == PathingGoal.Time && cell.time! <= time)) {
      return;
    }

    cell.explored = true;
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


}

const PathByKey: {[key: number]: string} = {};
for (const key of Object.keys(PathingGoal)) {
  const num = +key;
  if (num >= 0)
    PathByKey[+key] = PathingGoal[+key].toLowerCase();
}
