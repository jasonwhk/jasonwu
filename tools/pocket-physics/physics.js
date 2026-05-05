export class PhysicsLab {
  constructor(){ this.p=[]; this.mode='sandbox'; this.gravity={x:0,y:450}; this.burst=0; this.centerScore=0; this.best=0; this.fields=[]; }
  setMode(m){ this.mode=m; if(m==='stability' && !this.p.length){ this.p=[this._mk(0.5,0.5,16,1.8)]; } }
  reset(w,h,count=220){ this.p=[]; for(let i=0;i<count;i++) this.p.push(this._mk(Math.random(),Math.random(),2+Math.random()*3,0.7+Math.random()*1.4,w,h)); }
  _mk(nx,ny,r=3,m=1,w=1000,h=1000){ return {x:nx*w,y:ny*h,vx:(Math.random()-.5)*30,vy:(Math.random()-.5)*30,r,m,c:`hsl(${200+Math.random()*120} 90% 65%)`}; }
  add(x,y,n=15){ for(let i=0;i<n;i++) this.p.push({x,y,vx:(Math.random()-.5)*110,vy:(Math.random()-.5)*110,r:2+Math.random()*4,m:1,c:`hsl(${180+Math.random()*160} 95% 70%)`}); }
  applyField(x,y,s=1){ this.fields=[{x,y,s,t:0.25}]; }
  shake(){ this.burst=0.5; for(const a of this.p){ a.vx += (Math.random()-.5)*280; a.vy += (Math.random()-.5)*280; } }
  step(dt,w,h,g){ const cl=Math.min(0.033,dt); this.gravity.x=g.x*380; this.gravity.y=g.y*380; this.burst=Math.max(0,this.burst-cl);
    for(const f of this.fields) f.t-=cl; this.fields=this.fields.filter(f=>f.t>0);
    for(const a of this.p){ let ax=this.gravity.x, ay=this.gravity.y;
      for(const f of this.fields){ const dx=f.x-a.x, dy=f.y-a.y, d=Math.max(40,Math.hypot(dx,dy)); const k=f.s*3200/(d*d); ax += dx*k; ay += dy*k; }
      if(this.mode==='chaos'){ ax += Math.sin(a.y*0.01+performance.now()*0.002)*150; ay += Math.cos(a.x*0.01+performance.now()*0.002)*150; }
      a.vx=(a.vx+ax*cl)*0.992; a.vy=(a.vy+ay*cl)*0.992; a.x+=a.vx*cl; a.y+=a.vy*cl;
      if(a.x<a.r||a.x>w-a.r){ a.x=Math.min(w-a.r,Math.max(a.r,a.x)); a.vx*=-0.72; }
      if(a.y<a.r||a.y>h-a.r){ a.y=Math.min(h-a.r,Math.max(a.r,a.y)); a.vy*=-0.72; }
    }
    if(this.mode==='stability' && this.p[0]){ const c=this.p[0]; const d=Math.hypot(c.x-w/2,c.y-h/2); this.centerScore += d<70?cl:0; this.best=Math.max(this.best,this.centerScore); }
  }
}
