const KEY='pocket_universe_v1';
const defaults={mode:'galaxy',quality:'high',fps:false,tutorialDone:false,calibration:{beta:0,gamma:0},bestBlackHole:0};
export function loadState(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{return {...defaults};}}
export function saveState(next){localStorage.setItem(KEY,JSON.stringify(next));}
export {defaults};
