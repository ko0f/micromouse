import {Mouse} from "./mouse";
import {AbsDirection, Cell, Coords, RelativeDirection} from "./maze.model";
import {MouseBacktrackInst, MouseState, RelativeCell} from "./mouse.model";

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

  board!: Cell[][];
  location!: Coords;
  direction!: AbsDirection;

  // Stack of instructions on how to get to last junction.
  junctions: MouseBacktrackInst[][] = [];
  state: MouseState = MouseState.Placed;

  override async solve() {
    this.initBoard();
    await this.explore();
    if (this.state == MouseState.Stuck)
      console.log(`Mouse: Stuck!`);
    else
      console.log(`Mouse: Solved!`);
  }

  async explore() {
    this.state = MouseState.Exploring;

    try {
      while (!this.maze.hasReachedGoal()) {
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
          // already explored or dead end - backtrack
          console.log(`Mouse: Backtracking`);
          let instructions = this.junctions.pop();
          if (!instructions)
            throw `Reached a dead end!`;
          this.state = MouseState.Backtracking;
          this.turn(RelativeDirection.back);
          let inst;
          while (inst = instructions.pop()) {
            await this.dwell();
            if (inst.turn != undefined) {
              this.turn(inst.turn);
            } else {
              this.moveForward(inst.moveForward!);
            }
          }
          this.state = MouseState.Exploring;
          console.log(`Mouse: Exploring`);
        }
      }
    } catch (e) {
      this.state = MouseState.Stuck;
      console.error(e);
    }
  }

  initBoard() {
    const size = this.maze.getSize();

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
          northWall: false,
          southWall: false,
          eastWall: false,
          westWall: false,
        });
      }
    }
  }

  inspectCurrentCell(): Cell {
    const cell = this.board[this.location.y][this.location.x];
    if (!cell.explored) {
      cell.explored = true;
      cell.northWall = this.maze.hasWall((AbsDirection.north - this.direction + 4) % 4);
      cell.eastWall = this.maze.hasWall((AbsDirection.east - this.direction + 4) % 4);
      cell.southWall = this.maze.hasWall((AbsDirection.south - this.direction + 4) % 4);
      cell.westWall = this.maze.hasWall((AbsDirection.west - this.direction + 4) % 4);

      // update walls of adjacent cells
      if (cell.northWall)
        this.getAbsCell(AbsDirection.north).southWall = true;
      if (cell.southWall)
        this.getAbsCell(AbsDirection.south).northWall = true;
      if (cell.eastWall)
        this.getAbsCell(AbsDirection.east).westWall = true;
      if (cell.westWall)
        this.getAbsCell(AbsDirection.west).eastWall = true;
    }
    return cell;
  }

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
      const junction = this.junctions[this.junctions.length-1];
      if (!junction.length || junction[junction.length-1].turn != undefined) {
        junction.push({moveForward: cells});
      } else {
        junction[junction.length-1].moveForward = junction[junction.length-1].moveForward! + cells;
      }
    }
  }

  turn(relativeDir: RelativeDirection): void {
    console.log(`Mouse: Turning ${relativeDir}`);
    this.maze.turn(relativeDir);
    this.direction = (this.direction + relativeDir) % 4;

    // record backtrack instructions, don't record first turn
    if (this.state == MouseState.Exploring && this.junctions.length) {
      const junction = this.junctions[this.junctions.length-1];
      if (junction.length) // ignore turn if it's the first one
        junction.push({turn: (relativeDir + 2) % 4}); // turn the other way on the way back
    }
  }

}
