import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import * as d3 from 'd3';
import {BaseType} from 'd3';
import {AbsDirection, Cell, MazeUiDelegate, RelativeDirection} from "../../logic/maze.model";
import {ContestMazesEst} from "../../logic/contest-mazes.est";
import {RectMaze} from "../../logic/rect-maze";
import {Rect} from "./maze.component.model";
import {NaiveMouse} from "../../logic/naive-mouse";
import {Selection} from "d3-selection";
import {MouseSpeed} from "../../logic/mouse.model";

@Component({
  selector: 'app-maze',
  standalone: true,
  imports: [],
  templateUrl: './maze.component.html',
  styleUrl: './maze.component.less'
})
export class MazeComponent
  implements
    OnInit,
    MazeUiDelegate
{

  maze!: RectMaze;
  mouse!: NaiveMouse;

  svg!: Selection<BaseType, unknown, HTMLElement, any>;
  mouseSvg: any;
  cheeseSvg: any;

  brickSize: number = 25;
  mouseSize: number = 20;
  gap: number = 0;
  padding: number = 4;
  wallWidth: number = 2;
  exploredFill: string = "#efefef";
  unexploredFill: string = "#bbb";

  constructor(
    private ref: ChangeDetectorRef,
  ) {
    this.reset();
  }

  reset() {
    this.maze = new RectMaze(this);
    this.maze.load(ContestMazesEst.london1992);

    this.mouse = new NaiveMouse(this.maze, MouseSpeed.Fast);
  }

  ngOnInit() {
    this.svg = d3.select("svg")
      .attr("width", this.maze.getWidth() * (this.brickSize + this.gap) + this.padding * 2 - this.gap)
      .attr("height", this.maze.getHeight() * (this.brickSize + this.gap) + this.padding * 2 - this.gap);

    this.cheeseSvg = this.svg.append("text")
      .attr('class', 'cheese')
      .text('🧀')
      .attr('style', 'text-shadow: 1px 1px #B88700');

    this.mouseSvg = this.svg.append("image")
      .attr('class', 'mouse')
      .attr('xlink:href', '/assets/mouse.png');

    this.draw();
  }

  draw() {
    let row = this.svg.selectAll("g")
      .data(this.maze.getBoard())
      .join("g");

    row.selectAll("rect")
      .data(d => d)
      .join(
        enter => enter.append("rect")
          .attr("class", "cell")
          .attr("x", (d: Cell) => { return d.x * (this.brickSize + this.gap) + this.padding; })
          .attr("y", (d: Cell) => { return d.y * (this.brickSize + this.gap) + this.padding; })
          .attr("width", this.brickSize)
          .attr("height", this.brickSize)
          .attr("stroke", `#222`)
          .attr("stroke-width", `${this.wallWidth}px`)
      )
      .attr("stroke-dasharray", (d: Cell) => this.calcDashArray(d))
      .attr("fill", (d: Cell) => d.explored ? this.exploredFill : this.unexploredFill)
    ;

    const cheeseCoords = this.calcCellCoords(this.maze.getWinLocation());
    this.cheeseSvg
      .attr("dy", `${this.brickSize/2}px`)
      .attr('x', cheeseCoords.xCenter - this.brickSize/4)
      .attr('y', cheeseCoords.yCenter - this.brickSize/4)
      .raise();

    const mouseCoords = this.calcCellCoords(this.maze.getMouseLocation());
    this.mouseSvg
      .attr('x', mouseCoords.xCenter - this.mouseSize/2)
      .attr('y', mouseCoords.yCenter - this.mouseSize/2)
      .attr('width', this.mouseSize)
      .attr('height', this.mouseSize)
      .style("transform", `rotate(${this.getMouseAngle()}deg)`)
      .style("transform-origin", `center`)
      .style("transform-box", `content-box`)
      .raise();
    ;
  }

  /**
   * Designs a style string for stroke-dasharray, we're using it to draw walls.
   * @param cell
   */
  calcDashArray(cell: Cell): string {
    return '' +
      (!cell.y ? `${this.brickSize} 0 ` : `0 ${this.brickSize} `) +
      (cell.eastWall || cell.x == this.maze.getWidth()-1 ? `${this.brickSize} 0 ` : `0 ${this.brickSize} `) +
      (cell.southWall || cell.y == this.maze.getHeight()-1 ? `${this.brickSize} 0 ` : `0 ${this.brickSize} `) +
      (!cell.x ? `${this.brickSize} 0 ` : `0 ${this.brickSize} `)
      ;
  }

  /**
   * Calculates x,y rect coordinates of a given maze cell.
   * @param cell
   */
  calcCellCoords(cell: Cell): Rect {
    const y1 = cell.y * (this.brickSize + this.gap) + this.padding;
    const x1 = cell.x * (this.brickSize + this.gap) + this.padding;
    const y2 = y1 + this.brickSize;
    const x2 = x1 + this.brickSize;
    return {
      y1, x1, y2, x2,
      xCenter: (x2 + x1) / 2,
      yCenter: (y2 + y1) / 2,
    }
  }

  getMouseAngle() {
    switch (this.maze.getMouseDirection()) {
      case AbsDirection.north:
        return 0;
      case AbsDirection.south:
        return 180;
      case AbsDirection.east:
        return 90;
      case AbsDirection.west:
        return 270;
    }
  }

  onKeyDown(event: KeyboardEvent) {
    let changed = false;
    if (event.key == 'ArrowRight') {
      this.maze.turn(RelativeDirection.right);
      changed = true;
    } else if (event.key == 'ArrowLeft') {
      this.maze.turn(RelativeDirection.left);
      changed = true;
    } else if (event.key == 'ArrowDown') {
      this.maze.turn(RelativeDirection.back);
      changed = true;
    } else if (event.key == 'ArrowUp') {
      const result = this.maze.moveForward(1);
      // if (!result)
      //   alert(`You lost!`);
      changed = true;
    }
    if (changed) {
      this.draw();
      event.preventDefault();
      if (this.maze.hasReachedGoal())
        alert(`You won!`);
    }
    // console.log(`key: ${event.key}  shift: ${event.shiftKey}  alt: ${event.altKey}`);
  }

  onSolveClick() {
    this.mouse.solve().then();
  }

  onContinueClick() {
    this.mouse.continue().then();
  }

  onResetMazeClick() {
    this.mouse.stop();
    this.reset();
    // this.ref.detectChanges();
    this.draw();
    document.getElementById('maze')?.focus();
  }

  // -----------------------------------------------------------------------------------------
  //   MazeUiDelegate

  onMouseMoved() {
    // this.ref.detectChanges();
    this.draw();
  }
}
