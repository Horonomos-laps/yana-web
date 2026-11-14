(() => {
  'use strict';
  // Small spinning voxel rabbit that replaces the two "Y" marks in the home hero.
  // It reuses the voxel mesh of the 3D hero (7 floats per vertex: position, normal,
  // palette index) and falls back to the original <img> when WebGL or the mesh fails.
  const MESH_URL = 'assets/yana-brand-mesh-mobile.bin?v=20261114voxel1';
  const TARGETS = '.yana-intro .hero26-badge img, .yana-intro .hero26-sticker--emblem img';
  const FLOATS_PER_VERTEX = 7;
  const BYTES_PER_VERTEX = FLOATS_PER_VERTEX * 4;
  const MAX_PIXEL_RATIO = 2;
  const SWAY_RADIANS = 0.55;     // turn left and right by this much, never fully around
  const SWAY_PERIOD_MS = 5200;
  const TILT_RADIANS = -0.12;
  const FRAME_INTERVAL_MS = 33;

  const targets = [...document.querySelectorAll(TARGETS)];
  if (!targets.length) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const VERTEX = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute float aIndex;
    uniform vec2 uRotation;
    varying vec3 vNormal;
    varying float vIndex;
    vec3 rotateX(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);}
    vec3 rotateY(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);}
    void main(){
      vec3 p=rotateY(rotateX(aPosition,uRotation.x),uRotation.y);
      vNormal=normalize(rotateY(rotateX(aNormal,uRotation.x),uRotation.y));
      vIndex=aIndex;
      float depth=5.0-p.z;
      gl_Position=vec4(p.x*3.1,p.y*3.1,depth-0.2,depth);
    }`;
  const FRAGMENT = `
    precision mediump float;
    varying vec3 vNormal;
    varying float vIndex;
    vec3 palette(float i){
      if(i<0.5) return vec3(0.15,0.18,0.36);
      if(i<1.5) return vec3(0.94,0.95,0.99);
      if(i<2.5) return vec3(0.84,0.85,0.96);
      if(i<3.5) return vec3(0.44,0.46,0.52);
      if(i<4.5) return vec3(0.29,0.33,0.45);
      if(i<5.5) return vec3(0.43,0.49,0.92);
      if(i<6.5) return vec3(0.33,0.78,0.94);
      if(i<7.5) return vec3(0.08,0.41,0.88);
      return vec3(0.99,0.59,0.71);
    }
    void main(){
      vec3 n=normalize(vNormal);
      float diffuse=max(dot(n,normalize(vec3(-0.45,0.75,0.85))),0.0);
      gl_FragColor=vec4(clamp(palette(floor(vIndex+0.5))*(0.60+0.42*diffuse),0.0,1.0),1.0);
    }`;

  const compile = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  };

  const mount = (img, floats) => {
    const size = Number(img.getAttribute('width')) || img.clientWidth || 44;
    const canvas = document.createElement('canvas');
    const ratio = Math.min(devicePixelRatio || 1, MAX_PIXEL_RATIO);
    canvas.width = canvas.height = Math.round(size * ratio);
    canvas.style.cssText = `width:${size}px;height:${size}px;display:block`;
    canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power' });
    if (!gl) return;
    let program;
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    } catch (error) { console.warn('Yana rabbit shader:', error); return; }
    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, floats, gl.STATIC_DRAW);
    [['aPosition', 3, 0], ['aNormal', 3, 12], ['aIndex', 1, 24]].forEach(([name, count, offset]) => {
      const location = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, count, gl.FLOAT, false, BYTES_PER_VERTEX, offset);
    });
    const rotation = gl.getUniformLocation(program, 'uRotation');
    const vertexCount = floats.length / FLOATS_PER_VERTEX;
    let visible = true, pending = 0, last = 0;
    const draw = now => {
      pending = 0;
      if (!visible || document.hidden) return;
      if (now - last < FRAME_INTERVAL_MS) { pending = requestAnimationFrame(draw); return; }
      last = now;
      const sway = reducedMotion ? -0.25 : Math.sin((now / SWAY_PERIOD_MS) * Math.PI * 2) * SWAY_RADIANS;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform2f(rotation, TILT_RADIANS, sway);
      gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
      if (!reducedMotion) pending = requestAnimationFrame(draw);
    };
    const queue = () => { if (!pending) pending = requestAnimationFrame(draw); };
    new IntersectionObserver(entries => { visible = Boolean(entries[0]?.isIntersecting); if (visible) queue(); }).observe(canvas);
    img.replaceWith(canvas);
    queue();
  };

  fetch(MESH_URL).then(response => {
    if (!response.ok) throw new Error(`Mesh unavailable (${response.status})`);
    return response.arrayBuffer();
  }).then(data => {
    const floats = new Float32Array(data);
    if (floats.length % FLOATS_PER_VERTEX) throw new Error('Invalid mesh');
    targets.forEach(img => mount(img, floats));
  }).catch(error => console.warn('Yana rabbit mini:', error));
})();
