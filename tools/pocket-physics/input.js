export class TouchInput {
  constructor(canvas){ this.canvas=canvas; this.pointer={x:0,y:0,down:false,strong:false}; this.onTap=()=>{}; this.onField=()=>{}; this._bind(); }
  _bind(){
    let downAt=0;
    this.canvas.addEventListener('pointerdown',e=>{ this.pointer.down=true; this.pointer.x=e.offsetX; this.pointer.y=e.offsetY; downAt=performance.now(); this.pointer.strong=e.pointerType==='touch'&&e.isPrimary===false; });
    this.canvas.addEventListener('pointermove',e=>{ this.pointer.x=e.offsetX; this.pointer.y=e.offsetY; if(this.pointer.down) this.onField(this.pointer.x,this.pointer.y,this.pointer.strong?-1:1); });
    this.canvas.addEventListener('pointerup',e=>{ if(performance.now()-downAt<180) this.onTap(e.offsetX,e.offsetY); this.pointer.down=false; this.pointer.strong=false; });
    window.addEventListener('keydown',e=>{ if(e.key===' ') this.onField(this.canvas.width/2,this.canvas.height/2,-2); });
  }
}
