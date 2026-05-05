export class SensorController {
  constructor(){ this.gravity={x:0,y:1}; this.cal={x:0,y:0}; this.status='unavailable'; this.shakeCb=()=>{}; this.lastShake=0; }
  setCalibration(c){ this.cal=c||{x:0,y:0}; }
  onShake(cb){ this.shakeCb=cb; }
  async request(){
    const hasDO = 'DeviceOrientationEvent' in window;
    const hasDM = 'DeviceMotionEvent' in window;
    if(!hasDO && !hasDM){ this.status='not supported'; return false; }
    const ask = async (Ctor)=> (typeof Ctor?.requestPermission === 'function') ? (await Ctor.requestPermission()) === 'granted' : true;
    const ok = (await ask(window.DeviceOrientationEvent)) && (await ask(window.DeviceMotionEvent));
    if (!ok) { this.status='denied'; return false; }
    this.status='active';
    window.addEventListener('deviceorientation', e=>{ const x=((e.gamma||0)/45)-this.cal.x; const y=((e.beta||0)/45)-this.cal.y; this.gravity.x = this.gravity.x*0.85 + x*0.15; this.gravity.y = this.gravity.y*0.85 + y*0.15; }, {passive:true});
    window.addEventListener('devicemotion', e=>{ const a=e.accelerationIncludingGravity; if(!a) return; const mag=Math.hypot(a.x||0,a.y||0,a.z||0); const t=performance.now(); if(mag>26 && t-this.lastShake>900){ this.lastShake=t; this.shakeCb(); } }, {passive:true});
    return true;
  }
}
