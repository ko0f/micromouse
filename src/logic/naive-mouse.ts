import {Mouse} from "./mouse";
import {AbsDirection, Cell, Coords, MazeBoard, MazeMouseInterface, RelativeDirection} from "./maze.model";
import {MouseBacktrackInst, MouseSpeed, MouseState, RelativeCell} from "./mouse.model";

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
  board!: MazeBoard;
  location!: Coords;
  direction!: AbsDirection;
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

  constructor(
    maze: MazeMouseInterface,
    speed: MouseSpeed = MouseSpeed.Fast,
  ) {
    super(maze, speed);
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
    if (this.state == MouseState.Stuck)
      console.log(`Mouse: Stuck!`);
    else
      this.state = MouseState.Finished;
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
        const unexploredLeft =  !relCell.leftWall &&  !this.getRelCell(RelativeDirection.left).explored  ? 1 : 0;
        const unexploredRight = !relCell.rightWall && !this.getRelCell(RelativeDirection.right).explored ? 1 : 0;

        if (unexploredRight + unexploredLeft + unexploredFront > 1) {
          console.log(`Mouse: Junction detected`);
          this.junctions.push([]);
        }

        if (unexploredRight) {
          this.turn(RelativeDirection.right);
          this.moveForward(1);
        }
        else if (unexploredLeft) {
          this.turn(RelativeDirection.left);
          this.moveForward(1);
        }
        else if (unexploredFront) {
          this.moveForward(1);
        }
        else {
          // already explored or dead end
          await this.backtrack();
        }
      }
    } catch (e) {
      this.state = MouseState.Stuck;
      console.error(e);
    }
    if (this.maze.hasReachedGoal()) {
      this.state = MouseState.Solved;
      this.solved = true;
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

  inspectCurrentCell(): Cell {
    const cell = this.board[this.location.y][this.location.x];
    if (!cell.explored) {
      this.exploredCells += 1;
      cell.explored = true;
      cell.northWall = this.maze.hasWall((AbsDirection.north - this.direction + 4) % 4) ? 1 : 0;
      cell.eastWall =  this.maze.hasWall((AbsDirection.east - this.direction + 4) % 4)  ? 1 : 0;
      cell.southWall = this.maze.hasWall((AbsDirection.south - this.direction + 4) % 4) ? 1 : 0;
      cell.westWall =  this.maze.hasWall((AbsDirection.west - this.direction + 4) % 4)  ? 1 : 0;

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
    return this.solved ?
      this.exploredCells < this.totalCells :
      !this.maze.hasReachedGoal();
  }

  /**
   * Skips cells we can conclude are a dead-end
   * @param cell
   */
  checkCellIndirectKnowledge(cell: Cell) {
    if (!cell.explored && cell.northWall + cell.southWall + cell.eastWall + cell.westWall >= 3) {
      cell.explored = true;
      this.exploredCells += 1;
    }
  }

  moveForward(cells: number): void {
    console.log(`Mouse: Moving forward ${cells}`);

    if (!this.maze.moveForward(cells))
      throw `Crashed into a wall!`;

    switch (this.direction) {
      case AbsDirection.north:
        this.location.y -= cells;
        break;
      case AbsDirection.east:
        this.location.x += cells;
        break;
      case AbsDirection.south:
        this.location.y += cells;
        break;
      case AbsDirection.west:
        this.location.x -= cells;
        break;
    }
    // record backtrack instructions
    if (this.state == MouseState.Exploring && this.junctions.length) {
      if (this.createNewJunction) {
        this.createNewJunction = false;
        this.junctions.push([]);
      }
      const junction = this.junctions[this.junctions.length-1];
      if (!junction.length) {
        junction.push({steps: cells, dir: this.direction});
      } else {
        junction[junction.length-1].steps += cells;
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
      const junction = this.junctions[this.junctions.length-1];
      junction.push({dir: this.direction, steps: 0});
    }
  }

  async backtrack() {
    this.backtrackCount++;
    console.log(`Mouse: Backtracking #${this.backtrackCount}`);
    let instructions = this.junctions.pop();
    if (!instructions)
      throw `Reached a dead end!`;

    this.state = MouseState.Backtracking;
    this.turn(RelativeDirection.back);

    let inst;
    while (inst = instructions.pop()) {
      await this.dwell();
      const absDir = (inst.dir - this.direction + 6) % 4;
      this.turn(absDir);
      this.moveForward(inst.steps);
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
  getRelCell(relativeDir: RelativeDirection): Cell {
    let checkDir: AbsDirection = (this.direction + relativeDir) % 4;
    return this.getAbsCell(checkDir);
  }

  /**
   * Returns a memory cell
   * @param dir
   */
  getAbsCell(dir: AbsDirection): Cell {
    switch (dir) {
      case AbsDirection.north:
        return this.board[this.location.y-1][this.location.x];
      case AbsDirection.south:
        return this.board[this.location.y+1][this.location.x];
      case AbsDirection.east:
        return this.board[this.location.y][this.location.x+1];
      case AbsDirection.west:
        return this.board[this.location.y][this.location.x-1];
    }
  }
}
