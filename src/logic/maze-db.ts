import {MAZE_NAMES_CLASSIC, MAZE_NAMES_HALFSIZE} from "./maze-db.model";
import {HttpClient} from "@angular/common/http";

export class MazeDB {

  files: {[name: string]: string} = {};
  cache: {[name: string]: string} = {};

  constructor(
    private httpClient: HttpClient,
  ) {
    for (let mazeName of MAZE_NAMES_HALFSIZE) {
      this.files[`halfsize ${mazeName}`] = `halfsize/${mazeName}`;
    }
    for (let mazeName of MAZE_NAMES_CLASSIC) {
      this.files[`classic ${mazeName}`] = `classic/${mazeName}`;
    }
  }

  async loadTextMaze(mazeName: string): Promise<string> {
    return new Promise(resolve => {
      const cached = this.cache[mazeName];
      if (cached)
        return resolve(cached);

      const url = `assets/${this.files[mazeName]}`;
      this.httpClient.get(url, {responseType: 'text'})
        .subscribe(data => {
          this.cache[mazeName] = data;
          resolve(data);
        });
    });
  }
}
