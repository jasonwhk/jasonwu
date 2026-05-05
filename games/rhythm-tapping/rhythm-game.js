const levels = [
  { id: "easy-1", title: "Four quarter notes", bpm: 80, beatsPerBar: 4, bars: 1, difficulty: "Easy", pattern: [0, 1, 2, 3] },
  { id: "easy-2", title: "Eighth note pairs", bpm: 90, beatsPerBar: 4, bars: 1, difficulty: "Easy", pattern: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] },
  { id: "med-1", title: "Drive groove", bpm: 110, beatsPerBar: 4, bars: 2, difficulty: "Medium", pattern: [0, 0.5, 1.5, 2, 3, 4, 4.5, 5.5, 6.5, 7] },
  { id: "hard-1", title: "Syncopation mix", bpm: 132, beatsPerBar: 4, bars: 2, difficulty: "Hard", pattern: [0, 0.75, 1.5, 2.25, 3.5, 4, 4.5, 5.25, 6, 6.75, 7.5] },
  { id: "exp-1", title: "Offbeat sprint", bpm: 160, beatsPerBar: 4, bars: 2, difficulty: "Expert", pattern: [0, 0.25, 0.75, 1.5, 2.25, 2.5, 3.75, 4, 4.5, 5.25, 5.75, 6.5, 7.25] }
];
const PERFECT=60, GOOD=120, OKAY=180;
const state={selectedLevel:null,running:false,startTime:0,expected:[],judged:new Set(),score:0,hits:0,misses:0,streak:0,bestStreak:0,counts:{Perfect:0,Good:0,Okay:0,Miss:0,Early:0,Late:0,Extra:0},muted:false,audioCtx:null};
const el = id => document.getElementById(id);
const refs={levelCards:el('levelCards'), timeline:el('timeline'), playhead:el('playhead'), feedback:el('feedback'), startBtn:el('startBtn'), tapPad:el('tapPad'), countdown:el('countdown')};

function renderLevels(){refs.levelCards.innerHTML='';[...levels, ...loadCustomLevels()].forEach(l=>{const c=document.createElement('button');c.className='level-card';c.innerHTML=`<strong>${l.title}</strong><div>${l.difficulty} • ${l.bpm} BPM</div>`;c.onclick=()=>selectLevel(l,c);refs.levelCards.appendChild(c);});}
function selectLevel(level,card){document.querySelectorAll('.level-card').forEach(x=>x.classList.remove('active'));card.classList.add('active');state.selectedLevel=level;el('currentLevelTitle').textContent=level.title;el('currentLevelMeta').textContent=`${level.bpm} BPM • ${level.bars} bar(s) • ${level.difficulty}`;refs.startBtn.disabled=false;renderTimeline(level);}
function renderTimeline(level){refs.timeline.innerHTML='';const total=level.beatsPerBar*level.bars;level.pattern.forEach(p=>{const n=document.createElement('div');n.className='note';n.style.left=`${(p/total)*100}%`;refs.timeline.appendChild(n);});}
async function startGame(level){resetStats();await initAudio();refs.tapPad.disabled=false;state.running=true;await doCountdown();const beatMs=60000/level.bpm;const totalBeats=level.beatsPerBar*level.bars;state.expected=level.pattern.map(p=>p*beatMs);state.startTime=performance.now();scheduleMetronome(level, beatMs);loop(totalBeats*beatMs);}
function loop(totalMs){const frame=(now)=>{if(!state.running) return;const elapsed=now-state.startTime;refs.playhead.style.left=`${Math.min(100,elapsed/totalMs*100)}%`;checkAutoMiss(elapsed);if(elapsed>=totalMs+OKAY){finishGame();return;}requestAnimationFrame(frame);};requestAnimationFrame(frame);}
function judgeTap(t){if(!state.running) return;const elapsed=t-state.startTime;let best=-1,delta=Infinity;state.expected.forEach((et,i)=>{if(state.judged.has(i)) return;const d=Math.abs(elapsed-et);if(d<delta){delta=d;best=i;}});if(best===-1){addFeedback('Extra',false);return;}if(delta<=OKAY){state.judged.add(best);state.hits++;const expected=state.expected[best];const label=delta<=PERFECT?'Perfect':delta<=GOOD?'Good':'Okay';const side=(elapsed-expected)<0?'Early':'Late';scoreHit(label,delta);addFeedback(`${label} (${side})`,true);} else {state.misses++;state.streak=0;state.counts.Extra++;addFeedback('Miss (extra tap)',false);}updateStats();tapSound();}
function checkAutoMiss(elapsed){state.expected.forEach((et,i)=>{if(state.judged.has(i)) return;if(elapsed-et>OKAY){state.judged.add(i);state.misses++;state.streak=0;state.counts.Miss++;addFeedback('Miss',false);updateStats();}});}
function scoreHit(label){state.counts[label]++;state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);state.score += label==='Perfect'?100:label==='Good'?70:40;}
function addFeedback(msg,good){refs.feedback.textContent=msg;refs.feedback.style.color=good?'#117d56':'#a83232';}
function updateStats(){const total=state.hits+state.misses;el('scoreVal').textContent=state.score;el('streakVal').textContent=state.streak;el('accuracyVal').textContent= total?`${Math.round(state.hits/total*100)}%`:'0%';}
function finishGame(){state.running=false;refs.tapPad.disabled=true;const total=state.hits+state.misses;el('finalScore').textContent=state.score;el('finalAccuracy').textContent=total?`${Math.round(state.hits/total*100)}%`:'0%';el('bestStreak').textContent=state.bestStreak;el('ratingBreakdown').textContent=`${state.counts.Perfect} / ${state.counts.Good} / ${state.counts.Okay} / ${state.counts.Miss + state.counts.Extra}`;el('resultsPanel').hidden=false;}
function resetStats(){Object.assign(state,{score:0,hits:0,misses:0,streak:0,bestStreak:0,judged:new Set(),counts:{Perfect:0,Good:0,Okay:0,Miss:0,Early:0,Late:0,Extra:0}});el('resultsPanel').hidden=true;refs.playhead.style.left='0%';updateStats();addFeedback('Go!',true);}
async function doCountdown(){for (const n of ['3','2','1','Go']){refs.countdown.textContent=n;countClick();await new Promise(r=>setTimeout(r,650));}refs.countdown.textContent='';}
function getAudio(){if(!state.audioCtx) state.audioCtx=new (window.AudioContext||window.webkitAudioContext)();return state.audioCtx;}
async function initAudio(){const ctx=getAudio();if(ctx.state==='suspended') await ctx.resume();}
function beep(freq=880,dur=.04,gain=.03){if(state.muted) return;const ctx=getAudio();const o=ctx.createOscillator();const g=ctx.createGain();o.frequency.value=freq;o.type='sine';g.gain.value=gain;o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+dur);}
function tapSound(){beep(660,.03,.04);} function countClick(){beep(1200,.04,.05);} function scheduleMetronome(level,beatMs){for(let i=0;i<level.beatsPerBar*level.bars;i++){setTimeout(()=>{if(state.running) beep(i%level.beatsPerBar===0?900:650,.025,.02);},i*beatMs);} }
function loadCustomLevels(){return JSON.parse(localStorage.getItem('rhythmCustomLevels')||'[]');}
function saveCustomLevel(level){const all=loadCustomLevels().filter(l=>l.id!==level.id);all.push(level);localStorage.setItem('rhythmCustomLevels',JSON.stringify(all));}
function buildGrid(){const beats=Number(el('customBeats').value), bars=Number(el('customBars').value), res=Number(el('customResolution').value);const total=beats*bars* (res/4);const grid=el('customGrid');grid.style.gridTemplateColumns=`repeat(${Math.min(total,32)}, minmax(24px,1fr))`;grid.innerHTML='';for(let i=0;i<total;i++){const b=document.createElement('button');b.className='grid-cell';if(i%(res/4)===0) b.classList.add('beat');b.dataset.idx=i;b.onclick=()=>{b.classList.toggle('active');updatePatternPreview();};grid.appendChild(b);}updatePatternPreview();}
function readPattern(){const beats=Number(el('customBeats').value), bars=Number(el('customBars').value), res=Number(el('customResolution').value);const step=4/res;return [...el('customGrid').children].flatMap((c,i)=>c.classList.contains('active')?[Number((i*step).toFixed(2))]:[]).filter(v=>v<beats*bars);}
function updatePatternPreview(){el('patternPreview').textContent=JSON.stringify(readPattern());}
function customToLevel(){const bpm=Number(el('customBpm').value), beats=Number(el('customBeats').value), bars=Number(el('customBars').value), pattern=readPattern();if(bpm<40||bpm>220||beats<2||beats>12||bars<1||bars>8||pattern.length===0){alert('Invalid custom level settings.');return null;}return {id:`custom-${Date.now()}`,title:el('customName').value.trim()||'My rhythm',bpm,beatsPerBar:beats,bars,difficulty:el('customDifficulty').value.trim()||'Custom',pattern};}

refs.startBtn.onclick=()=>state.selectedLevel && startGame(state.selectedLevel);
refs.tapPad.onclick=()=>judgeTap(performance.now());
document.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();judgeTap(performance.now());}});
el('retryBtn').onclick=()=>state.selectedLevel && startGame(state.selectedLevel);
el('muteToggle').onclick=(e)=>{state.muted=!state.muted;e.target.textContent=state.muted?'🔇 Muted':'🔊 Sound On';};
['customBeats','customBars','customResolution'].forEach(id=>el(id).addEventListener('change',buildGrid));
el('playCustomBtn').onclick=()=>{const lvl=customToLevel();if(!lvl) return;state.selectedLevel=lvl;el('currentLevelTitle').textContent=lvl.title;el('currentLevelMeta').textContent=`${lvl.bpm} BPM • ${lvl.bars} bar(s) • ${lvl.difficulty}`;renderTimeline(lvl);startGame(lvl);};
el('saveCustomBtn').onclick=()=>{const lvl=customToLevel();if(!lvl) return;saveCustomLevel(lvl);renderLevels();alert('Custom level saved.');};
el('loadCustomBtn').onclick=()=>{const all=loadCustomLevels();if(!all.length) return alert('No saved levels.');const lvl=all[all.length-1];el('customName').value=lvl.title;el('customBpm').value=lvl.bpm;el('customBeats').value=lvl.beatsPerBar;el('customBars').value=lvl.bars;el('customDifficulty').value=lvl.difficulty;el('customResolution').value=16;buildGrid();const step=.25;const active=new Set(lvl.pattern.map(v=>Math.round(v/step)));[...el('customGrid').children].forEach((c,i)=>c.classList.toggle('active',active.has(i)));updatePatternPreview();};
el('deleteCustomBtn').onclick=()=>{localStorage.removeItem('rhythmCustomLevels');renderLevels();alert('Saved custom levels deleted.');};
el('resetCustomBtn').onclick=()=>{[...el('customGrid').children].forEach(c=>c.classList.remove('active'));updatePatternPreview();};

buildGrid();renderLevels();
