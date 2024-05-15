export interface CellWalls {
  wt?: boolean;
  wb?: boolean;
  wl?: boolean;
  wr?: boolean;
}

export interface Cell extends CellWalls {
  x: number;
  y: number;
}
