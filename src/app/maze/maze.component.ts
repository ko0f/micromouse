import {Component, OnInit} from '@angular/core';
import * as d3 from 'd3';
import {Cell, Coords} from "../../logic/maze.model";
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
    this.maze.load(ContestMazesEst.apec1993);
  }

  ngOnInit() {
    this.svg = d3.select("#maze")
      .attr("width", this.maze.width * (this.brickSize + this.gap) + this.padding * 2 - this.gap)
      .attr("height", this.maze.height * (this.brickSize + this.gap) + this.padding * 2 - this.gap);
    this.draw();
    const mouseCoords = this.cellCoords(this.maze.mouse.location);
    this.mouseSvg = this.svg.append("image")
      .attr('x', mouseCoords.xCenter - this.mouseSize/2)
      .attr('y', mouseCoords.yCenter - this.mouseSize/2)
      .attr('width', this.mouseSize)
      .attr('height', this.mouseSize)
      .attr('xlink:href', '/assets/mouse.png');
  }

  draw() {
    let row = this.svg.selectAll(".row")
      .data(this.maze.board)
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
}
