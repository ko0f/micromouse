import {Component, OnInit} from '@angular/core';
import {RectangularMaze} from "../../logic/rect-maze";
import * as d3 from 'd3';
import {Cell, CellWalls} from "../../logic/maze.model";

@Component({
  selector: 'app-maze',
  standalone: true,
  imports: [],
  templateUrl: './maze.component.html',
  styleUrl: './maze.component.less'
})
export class MazeComponent implements OnInit {

  maze: RectangularMaze;
  svg: any = null;

  brickSize: number = 20;
  gap: number = 0;
  padding: number = 4;
  wallWidth: number = 1;

  constructor() {
    this.maze = new RectangularMaze(30, 30);
    this.maze.randomize();
  }

  ngOnInit() {
    this.svg = d3.select("#maze")
      .attr("width", this.maze.width * (this.brickSize + this.gap) + this.padding * 2 - this.gap)
      .attr("height", this.maze.height * (this.brickSize + this.gap) + this.padding * 2 - this.gap);
    this.draw();
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
      .attr("fill", `#40b7ff`)
      .attr("stroke", `#222`)
      .attr("stroke-width", `${this.wallWidth}px`)
      .attr("stroke-dasharray", (d: Cell) => this.dashArray(d))
    ;
  }

  dashArray(walls: CellWalls): string {
    return '' +
      (walls.wt ? `${this.brickSize} 0 ` : `0 ${this.brickSize} `) +
      (walls.wr ? `${this.brickSize} 0 ` : `0 ${this.brickSize} `) +
      (walls.wb ? `${this.brickSize} 0 ` : `0 ${this.brickSize} `) +
      (walls.wl ? `${this.brickSize} 0` : `0 ${this.brickSize}`);
  }
}
