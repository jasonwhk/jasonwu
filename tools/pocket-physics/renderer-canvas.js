export class CanvasRenderer {
  constructor(canvas){
    this.canvas=canvas;
    this.ctx=canvas.getContext('2d', { alpha: true });
    if(!this.ctx) throw new Error('Canvas2D unavailable');
    this.type='Canvas2D';
    this.trails=true;
  }
  resize(w,h,dpr){ this.canvas.width=Math.floor(w*dpr); this.canvas.height=Math.floor(h*dpr); this.canvas.style.width=`${w}px`; this.canvas.style.height=`${h}px`; this.ctx.setTransform(dpr,0,0,dpr,0,0); }
  render(state){ const {ctx}=this; ctx.fillStyle=this.trails?'rgba(4,8,15,0.18)':'rgba(4,8,15,1)'; ctx.fillRect(0,0,this.canvas.clientWidth,this.canvas.clientHeight);
    if(state.mode==='stability'){ ctx.strokeStyle='rgba(140,200,255,.55)'; ctx.beginPath(); ctx.arc(this.canvas.clientWidth/2,this.canvas.clientHeight/2,70,0,Math.PI*2); ctx.stroke(); }
    for(const p of state.p){ ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }
    if(state.burst>0){ ctx.strokeStyle=`rgba(150,220,255,${state.burst})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(this.canvas.clientWidth/2,this.canvas.clientHeight/2,100+state.burst*250,0,Math.PI*2); ctx.stroke(); }
  }
}
