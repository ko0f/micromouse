import {Component, OnInit} from '@angular/core';
import * as d3 from 'd3';
import {AbsDirection, Cell, RelativeDirection} from "../../logic/maze.model";
import {ContestMazesEst} from "../../logic/contest-mazes.est";
import {RectMaze} from "../../logic/rect-maze";
import {CellRect} from "./maze.component.model";

@Component({
  selector: 'app-maze',
  standalone: true,
  imports: [],
  templateUrl: './maze.component.html',
  styleUrl: './maze.component.less'
})
export class MazeComponent implements OnInit {

  maze: RectMaze;

  svg: any = null;
  mouseSvg: any = null;

  brickSize: number = 25;
  mouseSize: number = 20;
  gap: number = 0;
  padding: number = 4;
  wallWidth: number = 2;
  carvedFill: string = "#efefef";
  uncarvedFill: string = "#333";

  constructor() {
    this.maze = new RectMaze();
    this.maze.load(ContestMazesEst.london1992);
  }

  ngOnInit() {
    this.svg = d3.select("#maze")
      .attr("width", this.maze.width * (this.brickSize + this.gap) + this.padding * 2 - this.gap)
      .attr("height", this.maze.height * (this.brickSize + this.gap) + this.padding * 2 - this.gap);
    this.draw();

    this.mouseSvg = this.svg.append("image")
      .attr('xlink:href', '/assets/mouse.png');
    this.drawMouse();
  }

  draw() {
    let row = this.svg.selectAll(".row")
      .data(this.maze.getBoard())
      .enter().append("g")
      .attr("class", "row");

    let column = row.selectAll(".square")
      .data(function(d: any) { return d; })
      .enter().append("rect")
      .attr("class", "square")
      .attr("x", (d: Cell) => { return d.x * (this.brickSize + this.gap) + this.padding; })
      .attr("y", (d: Cell) => { return d.y * (this.brickSize + this.gap) + this.padding; })
      .attr("width", this.brickSize)
      .attr("height", this.brickSize)
      .attr("fill", (d: Cell) => d.carved ? this.carvedFill : this.uncarvedFill)
      .attr("stroke", `#222`)
      .attr("stroke-width", `${this.wallWidth}px`)
      .attr("stroke-dasharray", (d: Cell) => this.dashArray(d))

    ;
  }

  drawMouse() {
    const mouseCoords = this.cellCoords(this.maze.getMouseLocation());
    this.mouseSvg
      .attr('x', mouseCoords.xCenter - this.mouseSize/2)
      .attr('y', mouseCoords.yCenter - this.mouseSize/2)
      .attr('width', this.mouseSize)
      .attr('height', this.mouseSize)
      .style("transform", `rotate(${this.mouseRotation()}deg)`)
      .style("transform-origin", `center`)
      .style("transform-box", `content-box`)
    ;
    ;
  }

  dashArray(cell: Cell): string {
    return '' +
      (!cell.y ? `${this.brickSize} 0 ` : `0 ${this.brickSize} `) +
      (cell.eastWall || cell.x == this.maze.width-1 ? `${this.brickSize} 0 ` : `0 ${this.brickSize} `) +
      (cell.southWall || cell.y == this.maze.height-1 ? `${this.brickSize} 0 ` : `0 ${this.brickSize} `) +
      (!cell.x ? `${this.brickSize} 0 ` : `0 ${this.brickSize} `)
      ;
  }

  cellCoords(cell: Cell): CellRect {
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

  mouseRotation() {
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
      if (!result)
        alert(`You lost!`);
      changed = true;
    }
    if (changed) {
      this.drawMouse();
      event.preventDefault();
    }
    // console.log(`key: ${event.key}  shift: ${event.shiftKey}  alt: ${event.altKey}`);
  }
}
