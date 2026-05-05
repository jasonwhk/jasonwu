import * as THREE from 'https://unpkg.com/three@0.178.0/build/three.module.js';
import { MODES } from './modes.js';
const QUAL={low:1800,medium:4200,high:9000,ultra:16000};
export class Universe{
  constructor(canvas,status){this.canvas=canvas;this.status=status;this.mode='galaxy';this.quality='high';this.field=new THREE.Vector2();this.tmp=new THREE.Vector3();this.attractor=null;}
  init(){this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(64,innerWidth/innerHeight,.1,400);this.camera.position.set(0,0,12);this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:true,alpha:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setSize(innerWidth,innerHeight);
    this.scene.add(new THREE.AmbientLight(0x88aaff,.4)); this.scene.add(new THREE.PointLight(0x88ccff,1.5,100));
    this.makeParticles();addEventListener('resize',()=>this.resize());this.resize();
  }
  makeParticles(){const count=QUAL[this.quality]||9000;this.particleCount=count;const pos=new Float32Array(count*3),vel=new Float32Array(count*3),clr=new Float32Array(count*3);for(let i=0;i<count;i++){const r=(Math.random()**0.6)*8,a=Math.random()*Math.PI*2,h=(Math.random()-.5)*3;pos[i*3]=Math.cos(a)*r;pos[i*3+1]=h;pos[i*3+2]=Math.sin(a)*r;vel[i*3]=(Math.random()-.5)*.02;vel[i*3+1]=(Math.random()-.5)*.02;vel[i*3+2]=(Math.random()-.5)*.02;const c=new THREE.Color().setHSL(0.55+Math.random()*0.2,.9,.6);clr.set([c.r,c.g,c.b],i*3);}this.pos=pos;this.vel=vel;this.geo?.dispose();this.mat?.dispose();this.points&&this.scene.remove(this.points);this.geo=new THREE.BufferGeometry();this.geo.setAttribute('position',new THREE.BufferAttribute(pos,3));this.geo.setAttribute('color',new THREE.BufferAttribute(clr,3));this.mat=new THREE.PointsMaterial({size:.06,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending});this.points=new THREE.Points(this.geo,this.mat);this.scene.add(this.points);}
  setQuality(q){this.quality=q;this.makeParticles();}
  setMode(m){this.mode=m;this.status.textContent=`Mode: ${MODES.find(x=>x.id===m)?.name||m}`;}
  applyTilt(t){this.field.set(t.x,t.y);}
  nudgeField(x,y){this.field.x=Math.max(-1,Math.min(1,this.field.x+x*2));this.field.y=Math.max(-1,Math.min(1,this.field.y+y*2));}
  setAttractor(n,p){this.attractor={...n,power:p};} clearAttractor(){this.attractor=null;} pulse(n){this.lastPulse={...n,t:0};} burst(){for(let i=0;i<this.particleCount;i++){this.vel[i*3]+=(Math.random()-.5)*.35;this.vel[i*3+1]+=(Math.random()-.5)*.35;this.vel[i*3+2]+=(Math.random()-.5)*.35;}}
  reset(){this.makeParticles();}
  update(dt){const d=Math.min(dt,.033),p=this.pos,v=this.vel,mode=this.mode;for(let i=0;i<this.particleCount;i++){const j=i*3,x=p[j],y=p[j+1],z=p[j+2];let ax=this.field.x*.02,ay=this.field.y*.02,az=0;const r=Math.hypot(x,z)+1e-4;if(mode==='galaxy'){ax+=(-z/r)*.008;az+=(x/r)*.008;} if(mode==='blackhole'){const inv=1/(r*r+.6);ax+=-x*inv*.12;az+=-z*inv*.12;} if(mode==='gravity'&&this.attractor){const dx=this.attractor.x*5-x,dz=this.attractor.y*5-z,rr=Math.hypot(dx,dz)+.2;ax+=(dx/rr)*.07*this.attractor.power;az+=(dz/rr)*.07*this.attractor.power;} if(mode==='flight'){ax+=0;az+=0.03; if(z>6)p[j+2]=-20;} if(mode==='solar'){ay+=-y*.02;}
    v[j]=(v[j]+ax)*0.985;v[j+1]=(v[j+1]+ay)*0.985;v[j+2]=(v[j+2]+az)*0.985;p[j]+=v[j]*d*60;p[j+1]+=v[j+1]*d*60;p[j+2]+=v[j+2]*d*60; if(Math.abs(p[j])>24)p[j]*=-.8;if(Math.abs(p[j+1])>12)p[j+1]*=-.8;if(Math.abs(p[j+2])>24)p[j+2]*=-.8;}
    this.geo.attributes.position.needsUpdate=true;this.camera.position.x=this.field.x*2;this.camera.position.y=2+this.field.y*2;this.camera.lookAt(0,0,0);this.renderer.render(this.scene,this.camera);
  }
  resize(){this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);}dispose(){this.renderer?.dispose();this.geo?.dispose();this.mat?.dispose();}
}
