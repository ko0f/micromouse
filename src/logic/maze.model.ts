export interface CellWalls {
  wt?: boolean;
  wb?: boolean;
  wl?: boolean;
  wr?: boolean;
}

export interface Cell extends CellWalls {
  x: number;
  y: number;
  carved?: boolean;
}

export interface Coord {
  y: number;
  x: number;
}

export interface BirMaze {
  bir: string[];
  win: Coord;
}
