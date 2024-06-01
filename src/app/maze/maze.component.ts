import {Component, OnInit} from '@angular/core';
import * as d3 from 'd3';
import {BaseType} from 'd3';
import {AbsDirection, Cell, CellText, Coords, MazeUiDelegate, RectMazePerspective} from "../../logic/maze.model";
import {RectMaze} from "../../logic/rect-maze";
import {Rect} from "./maze.component.model";
import {RectMouse} from "../../logic/rect-mouse";
import {Selection} from "d3-selection";
import {MouseSpeed, MouseState} from "../../logic/mouse.model";
import {Mouse} from "../../logic/mouse";
import {CommonModule} from "@angular/common";
import {MazeDB} from "../../logic/maze-db";
import {HttpClient, HttpClientModule} from "@angular/common/http";
import {PathingGoal} from "../../logic/rect-mouse.model";

@Component({
  selector: 'app-maze',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './maze.component.html',
  styleUrl: './maze.component.less'
})
export class MazeComponent
  implements
    OnInit,
    MazeUiDelegate
{
  // logic
  maze!: RectMaze;
  mouse!: Mouse;
  perspective!: RectMazePerspective;

  // svg
  svg!: Selection<BaseType, unknown, HTMLElement, any>;
  mouseSvg: any;
  cheeseSvg: any;

  // design attributes
  brickSize: number = 25;
  mouseSize: number = 20;
  gap: number = 0;
  padding: number = 4;
  wallWidth: number = 2;
  exploredFill: string = "#000";
  unexploredFill: string = "#222";
  wallColor: string = "#ff6200";

  // data
  // mazeStore: string[] = Object.keys(ContestMazesEst);
  mazeStore: MazeDB;
  mazeNames: string[] = [];
  mazeName: string = '';
  selectedPerspective = 'maze';

  protected readonly PathingGoal = PathingGoal;
  selectedPathBy = PathingGoal.Time;

  protected readonly MouseSpeed = MouseSpeed;
  mouseSpeeds: string[] = Object.keys(MouseSpeed).filter((e: any) => Number(e) >= 0);
  mouseSpeed: MouseSpeed = MouseSpeed.Medium;

  timeSeconds = 0;
  timeStart: number = 0;
  timeEnd: number = 0;

  constructor(
    httpClient: HttpClient
  ) {
    this.mazeStore = new MazeDB(httpClient);
    this.mazeNames = Object.keys(this.mazeStore.files);
    this.mazeName = localStorage.getItem('mazeName') || this.mazeNames[0];
    this.mouseSpeed = parseInt(localStorage.getItem('mouseSpeed') || '0') || MouseSpeed.Medium;
    this.selectedPerspective = localStorage.getItem('selectedPerspective') || 'maze';
    this.reset().then();
  }

  async reset() {
    this.maze = new RectMaze(this);
    const textMaze = await this.mazeStore.loadTextMaze(this.mazeName); // loads with a request
    this.maze.load(textMaze, this.mazeName);
    this.mouse = new RectMouse(this.maze, this.mouseSpeed, this);
    this.perspective = this.selectedPerspective == 'maze' ? this.maze : this.mouse;
    this.draw();
  }

  ngOnInit() {
    this.svg = d3.select("svg");

    this.cheeseSvg = this.svg.append("text")
      .attr('class', 'cheese')
      .text('🧀')
      .style("pointer-events", `none`)
      .attr('style', 'text-shadow: 1px 1px #B88700');

    this.mouseSvg = this.svg.append("image")
      .attr('class', 'mouse')
      .attr('xlink:href', '/assets/mouse.png');

    this.draw();
  }

  draw() {
    if (!this.perspective)
      return;

    this.svg
      .attr("width", this.perspective.getWidth() * (this.brickSize + this.gap) + this.padding * 2 - this.gap)
      .attr("height", this.perspective.getHeight() * (this.brickSize + this.gap) + this.padding * 2 - this.gap);

    let row = this.svg.selectAll("g")
      .data(this.perspective.getBoard())
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
          .attr("stroke", this.wallColor)
          .attr("stroke-width", `${this.wallWidth}px`)
          .on("click", (_, d) => this.gotoCell(d))
      )
      .attr("stroke-dasharray", (d: Cell) => this.calcDashArray(d))
      .attr("fill", (d: Cell) => d.explored ? this.exploredFill : this.unexploredFill)
    ;

    row.selectAll("text")
      .data(d => d)
      .join(
        enter => enter.append("text")
          .attr("class", "cell")
          .attr("x", (d: Cell) => { return d.x * (this.brickSize + this.gap) + this.padding; })
          .attr("y", (d: Cell) => { return d.y * (this.brickSize + this.gap) + this.padding; })
          .attr("dy", `${Math.trunc(this.brickSize/2)+3}px`)
          .attr("dx", `${Math.trunc(this.brickSize/2)-3}px`)
          // .attr("textLength", this.brickSize)
          .style("font-family", `"Noto Sans Mono", monospace`)
          .style("font-size", `8px`)
          .style("pointer-events", `none`)
          .attr("fill", '#aaa')
      )
      .text((d: Cell) => this.perspective.getText(d, CellText.PathBy) || '')
    ;

    if (this.perspective.getWinLocation()) {
      const cheeseCoords = this.calcCellCoords(this.perspective.getWinLocation()!);
      this.cheeseSvg
        .style("visibility", "visible")
        .attr("dy", `${this.brickSize / 2}px`)
        .attr('x', cheeseCoords.xCenter - this.brickSize / 4)
        .attr('y', cheeseCoords.yCenter - this.brickSize / 4)
        .raise();
    } else
      this.cheeseSvg
        .style("visibility", "hidden");

    const mouseCoords = this.calcCellCoords(this.perspective.getMouseLocation());
    this.mouseSvg
      .attr('width', this.mouseSize)
      .attr('height', this.mouseSize)
      .style("transform", `rotate(${this.getMouseAngle()}deg)`)
      .style("transform-origin", `center`)
      .style("transform-box", `content-box`)
      .raise()
      // .transition()
      .attr('x', mouseCoords.xCenter - this.mouseSize/2)
      .attr('y', mouseCoords.yCenter - this.mouseSize/2)

    ;
    document.getElementById('maze')?.focus();
  }

  /**
   * Designs a style string for stroke-dasharray, we're using it to draw walls.
   * @param cell
   */
  calcDashArray(cell: Cell): string {
    return '' +
      (!cell.y ? `${this.brickSize} 0 ` : `0 ${this.brickSize} `) +
      (cell.eastWall || cell.x == this.perspective.getWidth()-1 ? `${this.brickSize} 0 ` : `0 ${this.brickSize} `) +
      (cell.southWall || cell.y == this.perspective.getHeight()-1 ? `${this.brickSize} 0 ` : `0 ${this.brickSize} `) +
      (!cell.x ? `${this.brickSize} 0 ` : `0 ${this.brickSize} `)
      ;
  }

  /**
   * Calculates x,y rect coordinates of a given maze cell.
   * @param cellCoords
   */
  calcCellCoords(cellCoords: Coords): Rect {
    const y1 = cellCoords.y * (this.brickSize + this.gap) + this.padding;
    const x1 = cellCoords.x * (this.brickSize + this.gap) + this.padding;
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
      this.maze.turn((AbsDirection.east - this.maze.getMouseDirection() + 4) % 4);
      this.maze.moveForward(1);
      changed = true;
    } else if (event.key == 'ArrowLeft') {
      this.maze.turn((AbsDirection.west - this.maze.getMouseDirection() + 4) % 4);
      this.maze.moveForward(1);
      changed = true;
    } else if (event.key == 'ArrowDown') {
      this.maze.turn((AbsDirection.south - this.maze.getMouseDirection() + 4) % 4);
      this.maze.moveForward(1);
      changed = true;
    } else if (event.key == 'ArrowUp') {
      this.maze.turn((AbsDirection.north - this.maze.getMouseDirection() + 4) % 4);
      this.maze.moveForward(1);
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
    this.timerStart();
    this.mouse.solve().then();
  }

  onContinueClick() {
    this.mouse.continue().then();
  }

  onResetMazeClick() {
    this.mouse.stop();
    this.reset()
      .then(() => this.draw());
    ;
  }

  onRedrawClick() {
    this.draw();
  }

  onForgetClick() {
    this.mouse.forgetMaze();
  }

  onMazeSelected(event: Event) {
    this.mazeName = (event.target as HTMLSelectElement).value;
    localStorage.setItem('mazeName', this.mazeName);
    this.reset()
      .then(() => this.draw());
  }

  onSpeedSelected(event: Event) {
    this.mouseSpeed = +(event.target as HTMLSelectElement).value;
    localStorage.setItem('mouseSpeed', ''+this.mouseSpeed);
    this.mouse.speed = this.mouseSpeed;
    // this.reset()
    //   .then(() => this.draw());
  }

  onStopMouseClick() {
    this.mouse.stop();
  }

  onPerspectiveSelected(event: any) {
    this.selectedPerspective = event.target.value;
    localStorage.setItem('selectedPerspective', this.selectedPerspective);
    this.perspective = this.selectedPerspective == 'maze' ? this.maze : this.mouse;
    this.draw();
  }

  onPathBySelected(event: any) {
    this.selectedPathBy = event.target.value;
  }

  // -----------------------------------------------------------------------------------------
  //   MazeUiDelegate

  onMouseMoved(dontRedraw?: boolean) {
    // this.ref.detectChanges();
    this.setTimeSeconds();
    if (!dontRedraw)
      this.draw();
  }

  onMouseChangedState(state: MouseState): void {
    switch (state) {
      case MouseState.Finished:
        this.timerStop();
    }
  }

  redrawRequired() {
    this.draw();
  }


  // -----------------------------------------------------------------------------------------
  //   Timer

  timerStart() {
    this.timeStart = +new Date();
    this.timeEnd = 0;
  }

  timerStop() {
    this.timeEnd = +new Date();
  }

  setTimeSeconds() {
    this.timeSeconds = ((this.timeEnd || (+new Date())) - this.timeStart) / 1000;
  }

  async gotoCell(cell: Cell) {
    this.timerStart();
    const y = cell.y - this.perspective.getMouseLocation().y;
    const x = cell.x - this.perspective.getMouseLocation().x;
    await this.mouse.goto({y, x}, this.selectedPathBy);
    this.timerStop();
  }

}
