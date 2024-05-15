import {EstMaze, AbsDirection} from "../logic/maze.model";

export const ContestMazesEst = {
  apec1993: {
    est: [
      'sss ss s ss ts e',
      '  eee sst tsssee',
      'eeeeesee ssssese',
      ' seee t ts sesse',
      'seeeesee sstssst',
      ' seee tess se ee',
      'seeeesesse  se e',
      ' teee t eee  see',
      'seeeeteseese  se',
      ' te t esesese  t',
      'se ttesesesesete',
      ' st e esesesesee',
      'se ttesesesesete',
      ' sse s sesesesee',
      'e stsssssstssste',
      'tsssssssssssssst'
    ],
    win: {y: 8, x: 8},
    initialLocation: {y: 15, x: 0},
    initialDirection: AbsDirection.north,
  } as EstMaze,

  london1992: {
    est: [
      '  ssss  ss sse e',
      'ee sstees sseeee',
      'etesssessssss te',
      'se s s  ss ss ee',
      ' t eestsseeeetee',
      'eet s ssese  ste',
      'esse t eseee s t',
      ' e tt t eee e se',
      'eee tsesteee  ee',
      'ee es st sssteee',
      ' eeseesst e s  t',
      'eesssst ste st e',
      'e ssssee ss stee',
      'ess  sstesess ee',
      'tsstsssssssssttt'
    ],
    win: {y: 7, x: 7},
    initialLocation: {y: 15, x: 0},
    initialDirection: AbsDirection.north,
  } as EstMaze,
}
