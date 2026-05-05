import { CanvasRenderer } from './renderer-canvas.js';
export async function createWebGPURenderer(canvas){
  if(!navigator.gpu) return null;
  try {
    const adapter = await navigator.gpu.requestAdapter(); if(!adapter) return null;
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu');
    const format = navigator.gpu.getPreferredCanvasFormat();
    const fallback = new CanvasRenderer(canvas); fallback.type='WebGPU';
    const shader = device.createShaderModule({code:`@vertex fn vs(@builtin(vertex_index) i:u32)->@builtin(position) vec4f{var p=array<vec2f,6>(vec2f(-1.,-1.),vec2f(1.,-1.),vec2f(-1.,1.),vec2f(-1.,1.),vec2f(1.,-1.),vec2f(1.,1.));return vec4f(p[i],0,1);} @fragment fn fs()->@location(0) vec4f{return vec4f(0.02,0.03,0.06,0.14);}`});
    const pipeline = device.createRenderPipeline({layout:'auto',vertex:{module:shader,entryPoint:'vs'},fragment:{module:shader,entryPoint:'fs',targets:[{format}]},primitive:{topology:'triangle-list'}});
    const baseRender = fallback.render.bind(fallback);
    fallback.resize=(w,h,dpr)=>{ canvas.width=Math.floor(w*dpr); canvas.height=Math.floor(h*dpr); canvas.style.width=`${w}px`; canvas.style.height=`${h}px`; context.configure({device,format,alphaMode:'premultiplied'}); fallback.ctx.setTransform(dpr,0,0,dpr,0,0); };
    fallback.render=(state)=>{ const encoder=device.createCommandEncoder(); const pass=encoder.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:{r:0.01,g:0.015,b:0.03,a:1},loadOp:'clear',storeOp:'store'}]}); pass.setPipeline(pipeline); pass.draw(6); pass.end(); device.queue.submit([encoder.finish()]); baseRender(state); };
    return fallback;
  } catch { return null; }
}
