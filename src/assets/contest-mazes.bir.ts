import {BirMaze} from "../logic/maze.model";

const apec1993: string[] = [
  'bbb bb b bb ib r',
  '  rrr bbi ibbbrr',
  'rrrrrbrr bbbbrbr',
  ' brrr i ib brbbr',
  'brrrrbrr bbubbbi',
  ' brrr irbb br rr',
  'brrrrbrbbr  br r',
  ' irrr i rrr  brr',
  'brrrrirbrrbr  br',
  ' ir i rbrbrbr  i',
  'br iirbrbrbrbrir',
  ' bi r rbrbrbrbrr',
  'br iirbrbrbrbrir',
  ' bbr b brbrbrbrr',
  'r bibbbbbbibbbir',
  'ibbbbbbbbbbbbbbi'
];

const london1992: string[] = [
  '  bbbb  bb bbr r',
  'rr bbirrb bbrrrr',
  'rirbbbrbbbbbb ir',
  'br b b  bb bb rr',
  ' i rrbibbrrrrirr',
  'rri b bbrbr  bir',
  'rbbr i rbrrr b i',
  ' r ii i rrr r br',
  'rrr ibrbirrr  rr',
  'rr rb bi bbbirrr',
  ' rrbrrbbi r b  i',
  'rrbbbbi bir bi r',
  'r bbbbrr bb birr',
  'rbb  bbirbrbb rr',
  'ibbibbbbbbbbbiii'
]

export const ContestMazesBir = {
  apec1993: {
    bir: apec1993,
    win: {y: 8, x: 8}
  } as BirMaze,

  london1992: {
    bir: london1992,
    win: {y: 7, x: 7}
  } as BirMaze,
}
