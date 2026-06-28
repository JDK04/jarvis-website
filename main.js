/* ================================================================
   J.A.R.V.I.S  —  Cinematic 3D Engine
   Three.js r134 · GSAP ScrollTrigger · UnrealBloom · Web Audio
   ================================================================ */

(function () {
  'use strict';

  // ══════════════════════════════════════════════════════════════
  // CUSTOM CURSOR
  // ══════════════════════════════════════════════════════════════
  const cursorDot  = document.createElement('div');
  const cursorRing = document.createElement('div');
  cursorDot.className  = 'cursor-dot';
  cursorRing.className = 'cursor-ring';
  document.body.appendChild(cursorDot);
  document.body.appendChild(cursorRing);

  let cx = -100, cy = -100, rx = -100, ry = -100;
  document.addEventListener('mousemove', (e) => { cx = e.clientX; cy = e.clientY; });

  function updateCursor() {
    rx += (cx - rx) * 0.14;
    ry += (cy - ry) * 0.14;
    cursorDot.style.left  = cx + 'px'; cursorDot.style.top  = cy + 'px';
    cursorRing.style.left = rx + 'px'; cursorRing.style.top = ry + 'px';
    requestAnimationFrame(updateCursor);
  }
  updateCursor();

  // ══════════════════════════════════════════════════════════════
  // AUDIO ACTIVATION PROMPT  (first thing the user interacts with)
  // ══════════════════════════════════════════════════════════════
  const audioPromptEl = document.getElementById('audio-prompt');
  const apEnableBtn   = document.getElementById('ap-enable');
  const apSkipBtn     = document.getElementById('ap-skip');
  let   audioWanted   = false;

  function dismissAudioPrompt(withAudio) {
    audioWanted = withAudio;
    audioPromptEl.classList.add('hidden');
    // Small delay so fade looks smooth before boot begins
    setTimeout(() => {
      const bootEl = document.getElementById('boot-screen');
      bootEl.classList.remove('pre-hidden');
      bootEl.classList.add('visible');
      startBoot();
    }, 500);
  }

  apEnableBtn.addEventListener('click', () => dismissAudioPrompt(true));
  apSkipBtn.addEventListener('click',   () => dismissAudioPrompt(false));

  // ══════════════════════════════════════════════════════════════
  // BOOT SCREEN
  // ══════════════════════════════════════════════════════════════
  const bootEl     = document.getElementById('boot-screen');
  const bootBar    = document.getElementById('boot-bar');
  const bootLines  = document.getElementById('boot-lines');
  const bootStatus = document.getElementById('boot-status');

  const BOOT_MSGS = [
    'CORE MEMORY ALLOCATION COMPLETE',
    'NEURAL INTERFACE ACTIVE',
    'LOADING COGNITIVE MODULES...',
    'PARSING ENVIRONMENTAL DATA...',
    'SPEECH SYNTHESIS MODULE READY',
    'HOLOGRAPHIC ENGINE ONLINE',
    'THREAT ASSESSMENT: NONE',
    'ALL SYSTEMS NOMINAL — READY.',
  ];

  let bp = 0, bmi = 0;

  function startBoot() {
    bp = 0; bmi = 0;
    const bootTick = setInterval(() => {
      bp += 1.2 + Math.random() * 2.2;
      bootBar.style.width = Math.min(bp, 100) + '%';
      const step = Math.floor((bp / 100) * BOOT_MSGS.length);
      if (step > bmi && bmi < BOOT_MSGS.length) {
        bmi = step;
        const msg = BOOT_MSGS[Math.min(bmi, BOOT_MSGS.length - 1)];
        bootStatus.textContent = msg;
        const line = document.createElement('div');
        line.className = 'boot-line';
        line.textContent = '> ' + msg;
        bootLines.appendChild(line);
        bootLines.scrollTop = bootLines.scrollHeight;
      }
      if (bp >= 100) {
        clearInterval(bootTick);
        setTimeout(startExperience, 700);
      }
    }, 55);
  }

  // ══════════════════════════════════════════════════════════════
  // CINEMATIC INTRO SEQUENCE (after boot)
  // ══════════════════════════════════════════════════════════════
  const introOverlay = document.getElementById('intro-overlay');
  const introTyped   = document.getElementById('intro-typed');

  const INTRO_LINES = [
    { text: 'Good evening.',                   pause: 1100 },
    { text: '',                                 pause: 350  },
    { text: 'I am J.A.R.V.I.S.',               pause: 1400 },
    { text: '',                                 pause: 350  },
    { text: 'Your personal AI system.',         pause: 1100 },
    { text: '',                                 pause: 250  },
    { text: 'All systems are operational.',     pause: 900  },
  ];

  async function typeText(text, el, speed = 48) {
    el.textContent = '';
    for (const char of text) {
      el.textContent += char;
      await delay(speed + Math.random() * 20);
    }
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function runIntro() {
    introOverlay.classList.add('active');
    for (const line of INTRO_LINES) {
      if (line.text === '') {
        introTyped.textContent = '';
        await delay(line.pause);
        continue;
      }
      await typeText(line.text, introTyped);
      await delay(line.pause);
    }
    introOverlay.classList.add('fade-out');
    // Play chime and first Jarvis line right as intro fades
    if (audioWanted) {
      playChime();
    }
    await delay(800);
    introOverlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  function startExperience() {
    bootEl.classList.add('hidden');
    if (audioWanted) {
      initAudio();
      soundBtn.classList.add('active');
    }
    document.body.style.overflow = 'hidden';
    runIntro();
  }

  // ══════════════════════════════════════════════════════════════
  // AUDIO SYSTEM
  // ══════════════════════════════════════════════════════════════
  let audioCtx = null;
  let masterGain = null;
  let audioEnabled = false;

  function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Low reactor hum — 55 Hz drone
    const osc1  = audioCtx.createOscillator();
    osc1.type   = 'sine';
    osc1.frequency.value = 55;
    const g1 = audioCtx.createGain();
    g1.gain.value = 0.06;
    osc1.connect(g1);

    // Harmonic shimmer — 220 Hz
    const osc2 = audioCtx.createOscillator();
    osc2.type  = 'sine';
    osc2.frequency.value = 220;
    const lfoOsc = audioCtx.createOscillator();
    lfoOsc.type = 'sine';
    lfoOsc.frequency.value = 0.25;
    const lfoG = audioCtx.createGain();
    lfoG.gain.value = 2.5;
    lfoOsc.connect(lfoG); lfoG.connect(osc2.frequency);
    lfoOsc.start();
    const g2 = audioCtx.createGain();
    g2.gain.value = 0.012;
    osc2.connect(g2);

    // Very subtle high crackle — 880 Hz
    const osc3  = audioCtx.createOscillator();
    osc3.type   = 'sawtooth';
    osc3.frequency.value = 880;
    const filt3 = audioCtx.createBiquadFilter();
    filt3.type  = 'lowpass'; filt3.frequency.value = 300;
    const g3 = audioCtx.createGain();
    g3.gain.value = 0.003;
    osc3.connect(filt3); filt3.connect(g3);

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;
    g1.connect(masterGain); g2.connect(masterGain); g3.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    osc1.start(); osc2.start(); osc3.start();

    // Fade in over 3 seconds
    masterGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 3);
    audioEnabled = true;
  }

  function playTone(freq, duration, volume = 0.15) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(volume, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + duration);
  }

  function playChime() {
    // Two-tone Jarvis chime
    if (!audioCtx) return;
    playTone(880, 0.4, 0.12);
    setTimeout(() => playTone(1320, 0.5, 0.08), 200);
    setTimeout(() => playTone(1760, 0.6, 0.06), 450);
  }

  function playWhoosh() {
    if (!audioCtx) return;
    const bufSize = Math.floor(audioCtx.sampleRate * 0.45);
    const buf  = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src  = audioCtx.createBufferSource();
    src.buffer = buf;
    const filt = audioCtx.createBiquadFilter();
    filt.type  = 'bandpass';
    filt.frequency.setValueAtTime(600, audioCtx.currentTime);
    filt.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 0.45);
    filt.Q.value = 0.5;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.18, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
    src.connect(filt); filt.connect(g); g.connect(audioCtx.destination);
    src.start();
  }

  function playUIClick() {
    if (!audioCtx) return;
    playTone(1200, 0.08, 0.08);
  }

  // Web Speech API — Jarvis voice
  function jarvisSpeak(text) {
    if (!audioEnabled) return;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate   = 0.82;
    utt.pitch  = 0.68;
    utt.volume = 0.75;
    const voices = window.speechSynthesis.getVoices();
    const pick = voices.find(v => v.lang === 'en-GB' && !v.name.includes('Female') && !v.name.includes('f '))
      || voices.find(v => v.lang === 'en-GB')
      || voices.find(v => v.lang.startsWith('en'));
    if (pick) utt.voice = pick;
    window.speechSynthesis.speak(utt);
  }

  // Sound button
  const soundBtn = document.getElementById('sound-btn');
  soundBtn.addEventListener('click', () => {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    soundBtn.classList.add('active');
    playChime();
  });

  // Hover sounds on nav links
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('mouseenter', playUIClick);
  });
  document.getElementById('cta-submit').addEventListener('click', () => {
    playChime();
  });

  // ══════════════════════════════════════════════════════════════
  // GSAP
  // ══════════════════════════════════════════════════════════════
  gsap.registerPlugin(ScrollTrigger);

  // ══════════════════════════════════════════════════════════════
  // THREE.JS SETUP
  // ══════════════════════════════════════════════════════════════
  const canvas   = document.getElementById('jarvis-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000810, 1);
  renderer.toneMapping     = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene  = new THREE.Scene();
  scene.fog    = new THREE.FogExp2(0x000810, 0.016);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 600);
  camera.position.set(0, 0, 18);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();

  // ── CIRCULAR PARTICLE TEXTURE FACTORY ───────────────────────
  // Without this, PointsMaterial renders as square sprites on most drivers.
  // A canvas-based radial gradient gives round, soft particles.
  function makeGlowSprite(size, coreFraction, coreAlpha, edgeAlpha) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx  = canvas.getContext('2d');
    const half = size / 2;
    const grad = ctx.createRadialGradient(half, half, coreFraction * half, half, half, half);
    grad.addColorStop(0,   `rgba(255,255,255,${coreAlpha})`);
    grad.addColorStop(0.4, `rgba(255,255,255,${(coreAlpha * 0.6).toFixed(2)})`);
    grad.addColorStop(1,   `rgba(255,255,255,${edgeAlpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }

  // Soft glow — for stars and ambient particles
  const softGlowTex = makeGlowSprite(64, 0, 1.0, 0.0);
  // Hard dot — for sparks that need a crisp bright center
  const hardDotTex  = makeGlowSprite(32, 0, 1.0, 0.0);

  // ── POST-PROCESSING ──────────────────────────────────────────
  const composer   = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  const bloomPass  = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.4,   // strength  (was 2.2 — much calmer now)
    0.5,   // radius
    0.16   // threshold (was 0.08 — less aggressive)
  );
  composer.addPass(bloomPass);

  // ── LIGHTS ───────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x000d1a, 0.5));
  const kLight = new THREE.PointLight(0x00c8ff, 6, 50); kLight.position.set(6, 4, 8);
  const fLight = new THREE.PointLight(0x0033ff, 4, 40); fLight.position.set(-6, -2, 6);
  const wLight = new THREE.PointLight(0xff6600, 2.5, 28); wLight.position.set(4, -6, 4);
  scene.add(kLight, fLight, wLight);

  // ══════════════════════════════════════════════════════════════
  // BACKGROUND — deep space with layered nebula clouds + stars
  // ══════════════════════════════════════════════════════════════

  // Backdrop sphere
  scene.add(Object.assign(new THREE.Mesh(
    new THREE.SphereGeometry(400, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x00020a, side: THREE.BackSide })
  )));

  // Nebula cloud — large, billowing colour smear painted with a
  // custom shader directly on the inside of a sphere.
  const nebulaMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 } },
    vertexShader: `
      varying vec3 vPos;
      void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }
    `,
    fragmentShader: `
      varying vec3 vPos;
      uniform float uT;
      float hash(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
      float noise(vec3 p){
        vec3 i=floor(p); vec3 f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
      }
      float fbm(vec3 p){
        float v=0.; float a=.5;
        for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.1+vec3(1.7,9.2,4.3); a*=.5; }
        return v;
      }
      void main(){
        vec3 d = normalize(vPos);
        float n1 = fbm(d * 3.2 + vec3(uT*.008, 0., uT*.005));
        float n2 = fbm(d * 5.8 - vec3(0., uT*.006, uT*.004));
        float n3 = fbm(d * 2.1 + vec3(uT*.003));

        // Deep blue-purple nebula bands
        vec3 col  = vec3(0.02, 0.06, 0.22) * pow(n1, 1.4);
        // Cyan wisps
        col += vec3(0.00, 0.18, 0.35) * pow(n2, 2.0);
        // Faint magenta tint in the far distance
        col += vec3(0.08, 0.00, 0.14) * pow(n3, 2.5);
        // Bright core vein
        float vein = pow(max(0., fbm(d*8.+vec3(0,uT*.01,0)) - 0.42), 3.0);
        col += vec3(0.0, 0.4, 0.7) * vein * 0.6;

        float alpha = clamp(dot(col, vec3(0.6)), 0.0, 0.55);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  const nebulaUniforms = nebulaMat.uniforms;
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(380, 48, 32), nebulaMat));

  // ── STAR FIELD — 5 layers, varied colour temperature ─────────
  function stars(n, spread, sz, op, col) {
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      p[i*3]   = (Math.random()-.5)*spread;
      p[i*3+1] = (Math.random()-.5)*spread;
      p[i*3+2] = (Math.random()-.5)*spread*.3 - spread*.1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({
      color: col, size: sz, transparent: true, opacity: op,
      map: softGlowTex, alphaTest: 0.005,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
  }
  const s1 = stars(3000, 500, 0.09, 0.70, 0xaaccff); // cool white-blue
  const s2 = stars(800,  300, 0.18, 0.45, 0x0077ff);  // bright blue
  const s3 = stars(400,  400, 0.28, 0.25, 0x00ccff);  // cyan giants
  const s4 = stars(200,  350, 0.40, 0.15, 0xffffff);  // white supergiants
  const s5 = stars(600,  250, 0.11, 0.20, 0x4400aa);  // faint purple
  scene.add(s1, s2, s3, s4, s5);

  // ── FLOATING VOLUMETRIC DUST ──────────────────────────────────
  const MIC = 1400;
  const micBuf = new Float32Array(MIC * 3);
  for (let i = 0; i < MIC; i++) {
    micBuf[i*3]   = (Math.random()-.5)*50;
    micBuf[i*3+1] = (Math.random()-.5)*50;
    micBuf[i*3+2] = (Math.random()-.5)*25;
  }
  const micGeo = new THREE.BufferGeometry();
  micGeo.setAttribute('position', new THREE.BufferAttribute(micBuf, 3));
  const micPts = new THREE.Points(micGeo, new THREE.PointsMaterial({
    color: 0x002244, size: 0.07, transparent: true, opacity: 0.35,
    map: softGlowTex, alphaTest: 0.005,
    sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(micPts);

  // ══════════════════════════════════════════════════════════════
  // PHASE 1 — HUMAN HEAD  (holographic lathe scan)
  // ══════════════════════════════════════════════════════════════
  const headGroup = new THREE.Group();
  scene.add(headGroup);

  const HP_PROFILE = [
    [0.00,-0.92],[0.18,-0.88],[0.50,-0.78],[0.70,-0.60],
    [0.82,-0.40],[0.88,-0.15],[0.92, 0.15],[0.90, 0.50],
    [0.82, 0.85],[0.60, 1.15],[0.28, 1.35],[0.00, 1.45],
  ];
  const HEAD_SCALE = 2.8;
  const headCenterY = (1.45 + (-0.92)) / 2;
  const headPts = HP_PROFILE.map(([r, y]) =>
    new THREE.Vector2(r * HEAD_SCALE, (y - headCenterY) * HEAD_SCALE)
  );
  const headGeo = new THREE.LatheGeometry(headPts, 28);

  const headSolidMat = new THREE.MeshStandardMaterial({
    color:0x001833, emissive:0x000d1a, emissiveIntensity:.3,
    metalness:.6, roughness:.3, transparent:true, opacity:.06, side:THREE.DoubleSide,
  });
  const headWireMat = new THREE.MeshBasicMaterial({
    color:0x00aeff, wireframe:true, transparent:true, opacity:.38,
  });
  const headSolid = new THREE.Mesh(headGeo, headSolidMat);
  const headWire  = new THREE.Mesh(headGeo, headWireMat);
  headSolid.scale.z = headWire.scale.z = 0.78;

  // Scan ring — sweeps vertically, creates sci-fi "analysis" read
  const scanRingMat = new THREE.MeshBasicMaterial({
    color:0x00ffff, transparent:true, opacity:.9, blending:THREE.AdditiveBlending,
  });
  const scanRing = new THREE.Mesh(
    new THREE.TorusGeometry(3.0, 0.012, 8, 80), scanRingMat
  );
  scanRing.rotation.x = Math.PI / 2;

  // Particles sampled from LatheGeometry vertices
  const hpArrSrc = headGeo.attributes.position.array;
  const hpArr    = new Float32Array(hpArrSrc.length);
  for (let i = 0; i < hpArrSrc.length; i++) hpArr[i] = hpArrSrc[i];
  for (let i = 2; i < hpArr.length; i += 3) hpArr[i] *= 0.78;
  const headParticleGeo = new THREE.BufferGeometry();
  headParticleGeo.setAttribute('position', new THREE.BufferAttribute(hpArr, 3));
  const headParticleMat = new THREE.PointsMaterial({
    color:0x00ccff, size:.065, transparent:true, opacity:.7,
    map:softGlowTex, alphaTest:.005,
    sizeAttenuation:true, blending:THREE.AdditiveBlending, depthWrite:false,
  });
  const headParticles = new THREE.Points(headParticleGeo, headParticleMat);

  // Concentric HUD rings (thin, dim — purely atmospheric)
  const hudRingMats = [3.6, 4.4, 5.3].map((r, i) => {
    const mat = new THREE.MeshBasicMaterial({
      color:0x003366, transparent:true, opacity:0.28 - i*.07,
      blending:THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, .007, 8, 64), mat);
    ring.rotation.x = Math.PI / 2;
    headGroup.add(ring);
    return mat;
  });

  headGroup.add(headSolid, headWire, scanRing, headParticles);

  // ══════════════════════════════════════════════════════════════
  // PHASE 2 — BRAIN  (folded sphere + neuron network)
  // ══════════════════════════════════════════════════════════════
  const brainGroup = new THREE.Group();
  brainGroup.visible = false;
  scene.add(brainGroup);

  // Displaced sphere → gyri/sulci (brain folds via additive sine waves)
  const brainBaseGeo = new THREE.SphereGeometry(2.2, 64, 48);
  const bvArr = brainBaseGeo.attributes.position.array;
  for (let i = 0; i < bvArr.length; i += 3) {
    const x = bvArr[i], y = bvArr[i+1], z = bvArr[i+2];
    const len = Math.sqrt(x*x + y*y + z*z);
    const fold = Math.sin(x*3.2)*.18 + Math.sin(y*4.1)*.15 + Math.sin(z*3.7)*.14
               + Math.sin(x*7.0)*.05 + Math.sin(y*8.0)*.04 + Math.sin(z*6.5)*.06;
    const nl = len + fold;
    bvArr[i] = x*nl/len; bvArr[i+1] = y*nl/len; bvArr[i+2] = z*nl/len;
  }
  brainBaseGeo.computeVertexNormals();

  const brainSolidMat = new THREE.MeshStandardMaterial({
    color:0x001a33, emissive:0x000d22, emissiveIntensity:.5,
    metalness:.3, roughness:.6, transparent:true, opacity:.14, side:THREE.DoubleSide,
  });
  const brainWireMat = new THREE.MeshBasicMaterial({
    color:0x0066ee, wireframe:true, transparent:true, opacity:.26,
  });
  brainGroup.add(
    new THREE.Mesh(brainBaseGeo, brainSolidMat),
    new THREE.Mesh(brainBaseGeo, brainWireMat)
  );

  // Neuron soma (instanced spheres scattered inside brain volume)
  const BN = 50;
  const bnPos = Array.from({length:BN}, () => {
    const phi = Math.acos(2*Math.random()-1), theta = Math.random()*Math.PI*2;
    const r = .5 + Math.random()*1.5;
    return new THREE.Vector3(
      r*Math.sin(phi)*Math.cos(theta), r*Math.sin(phi)*Math.sin(theta), r*Math.cos(phi)
    );
  });
  const bnInstMat = new THREE.MeshStandardMaterial({
    color:0x00aaff, emissive:0x0077cc, emissiveIntensity:1.4,
    metalness:.1, roughness:.5, transparent:true, opacity:1,
  });
  const bnInst = new THREE.InstancedMesh(new THREE.SphereGeometry(.052, 10, 10), bnInstMat, BN);
  const bnDummy = new THREE.Object3D();
  bnPos.forEach((p, i) => { bnDummy.position.copy(p); bnDummy.updateMatrix(); bnInst.setMatrixAt(i, bnDummy.matrix); });
  bnInst.instanceMatrix.needsUpdate = true;
  brainGroup.add(bnInst);

  // Axon edges between nearby neurons
  const bnEdgePairs = [];
  bnPos.forEach((p, i) => bnPos.forEach((q, j) => {
    if (j > i && p.distanceTo(q) < 1.9) bnEdgePairs.push([i, j]);
  }));
  const bnEdgeBuf = new Float32Array(bnEdgePairs.length * 6);
  const bnEdgeGeo = new THREE.BufferGeometry();
  bnEdgeGeo.setAttribute('position', new THREE.BufferAttribute(bnEdgeBuf, 3));
  const bnEdgeMat = new THREE.LineBasicMaterial({
    color:0x0044aa, transparent:true, opacity:.4, blending:THREE.AdditiveBlending, depthWrite:false,
  });
  bnEdgePairs.forEach(([a,b], e) => {
    const pa=bnPos[a], pb=bnPos[b];
    bnEdgeBuf[e*6]=pa.x; bnEdgeBuf[e*6+1]=pa.y; bnEdgeBuf[e*6+2]=pa.z;
    bnEdgeBuf[e*6+3]=pb.x; bnEdgeBuf[e*6+4]=pb.y; bnEdgeBuf[e*6+5]=pb.z;
  });
  bnEdgeGeo.attributes.position.needsUpdate = true;
  brainGroup.add(new THREE.LineSegments(bnEdgeGeo, bnEdgeMat));

  // Action-potential particles — race along axon edges
  const BN_FIRE = 22;
  const bnFireBuf = new Float32Array(BN_FIRE * 3);
  const bnFireGeo = new THREE.BufferGeometry();
  bnFireGeo.setAttribute('position', new THREE.BufferAttribute(bnFireBuf, 3));
  const bnFireMat = new THREE.PointsMaterial({
    color:0x44eeff, size:.13, transparent:true, opacity:.98,
    map:hardDotTex, alphaTest:.01, sizeAttenuation:true, blending:THREE.AdditiveBlending, depthWrite:false,
  });
  brainGroup.add(new THREE.Points(bnFireGeo, bnFireMat));
  const bnFire = Array.from({length:BN_FIRE}, () => ({
    ei: Math.floor(Math.random() * bnEdgePairs.length),
    t: Math.random(),
    spd: .014 + Math.random() * .022,
  }));

  // ══════════════════════════════════════════════════════════════
  // PHASE 3 — DNA HELIX
  // ══════════════════════════════════════════════════════════════
  const dnaGroup  = new THREE.Group();
  dnaGroup.visible = false;
  scene.add(dnaGroup);
  const dnaMats   = [];   // collected for batch opacity updates

  const STEPS = 200, COILS = 3.5, HEIGHT = 18, RADIUS = 1.8;

  // PBR backbone materials
  const bMat1 = new THREE.MeshStandardMaterial({ color:0x00ddff, emissive:0x00aacc, emissiveIntensity:.7, metalness:.5, roughness:.25, transparent:true, opacity:1 });
  const bMat2 = new THREE.MeshStandardMaterial({ color:0x1144ff, emissive:0x0d2ecc, emissiveIntensity:.7, metalness:.5, roughness:.25, transparent:true, opacity:1 });
  dnaMats.push(bMat1, bMat2);

  // Nucleotide colors (A T G C) — reduced emissive vs before
  const BASE = [
    { c:0x00ffbb, e:0x00cc99, ei:1.2 }, // A – teal
    { c:0x0088ff, e:0x0055cc, ei:1.2 }, // T – blue
    { c:0xffaa00, e:0xcc8800, ei:1.2 }, // G – gold
    { c:0xff33bb, e:0xcc1199, ei:1.2 }, // C – magenta
  ];
  const nMats = BASE.map(b => {
    const m = new THREE.MeshStandardMaterial({ color:b.c, emissive:b.e, emissiveIntensity:b.ei, metalness:.2, roughness:.35, transparent:true, opacity:1 });
    dnaMats.push(m); return m;
  });

  const pMat = new THREE.MeshStandardMaterial({ color:0xffffff, emissive:0x88ccff, emissiveIntensity:1.8, transparent:true, opacity:.85 });
  dnaMats.push(pMat);
  const brMat = new THREE.MeshStandardMaterial({ color:0x003355, emissive:0x001122, emissiveIntensity:.4, metalness:.8, roughness:.2, transparent:true, opacity:.7 });
  dnaMats.push(brMat);

  // Build strand point arrays
  const pts1 = [], pts2 = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS, y = (t-.5)*HEIGHT;
    const a1 = t * Math.PI * 2 * COILS, a2 = a1 + Math.PI;
    pts1.push(new THREE.Vector3(Math.cos(a1)*RADIUS, y, Math.sin(a1)*RADIUS));
    pts2.push(new THREE.Vector3(Math.cos(a2)*RADIUS, y, Math.sin(a2)*RADIUS));
  }

  // Backbone tubes — 20 radial segments = no visible faceting
  dnaGroup.add(
    new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts1), 600, .075, 20, false), bMat1),
    new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2), 600, .075, 20, false), bMat2)
  );

  // Instanced nucleotides
  const dummy = new THREE.Object3D();
  const NFREQ = 4;
  const S1TYPES = [0,1,2,3], S2TYPES = [1,0,3,2];
  let nCounts = [0,0,0,0];
  const nMax = Math.ceil((STEPS+1)/NFREQ);
  // Instanced nucleotides — 20×20 segments = visibly smooth spheres
  const instArr = S1TYPES.map(b => ({
    m1: new THREE.InstancedMesh(new THREE.SphereGeometry(.14, 20, 20), nMats[b], nMax),
    m2: new THREE.InstancedMesh(new THREE.SphereGeometry(.14, 20, 20), nMats[S2TYPES[b]], nMax),
  }));
  instArr.forEach(({m1,m2}) => { m1.count=0; m2.count=0; dnaGroup.add(m1,m2); });

  // Phosphate atoms — 12×12 segments
  const pMax = Math.ceil((STEPS+1)/2);
  const phInst1 = new THREE.InstancedMesh(new THREE.SphereGeometry(.05, 12, 12), pMat, pMax);
  const phInst2 = new THREE.InstancedMesh(new THREE.SphereGeometry(.05, 12, 12), pMat, pMax);
  phInst1.count = 0; phInst2.count = 0;
  dnaGroup.add(phInst1, phInst2);

  // Bridge cylinders — 16 segments = smooth tubes, not obvious prisms
  const BFREQ = 5;
  const bMax  = Math.ceil((STEPS+1)/BFREQ);
  const brInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(.022,.022,1, 16), brMat, bMax);
  brInst.count = 0; dnaGroup.add(brInst);

  let pIdx = 0, bIdx = 0;
  for (let i = 0; i <= STEPS; i++) {
    const p1 = pts1[i], p2 = pts2[i];
    if (i % 2 === 0 && pIdx < pMax) {
      dummy.position.copy(p1); dummy.updateMatrix(); phInst1.setMatrixAt(pIdx, dummy.matrix);
      dummy.position.copy(p2); dummy.updateMatrix(); phInst2.setMatrixAt(pIdx++, dummy.matrix);
    }
    if (i % NFREQ === 0) {
      const ci = Math.floor(i/NFREQ) % 4, bt = S1TYPES[ci], {m1, m2} = instArr[bt];
      const in1 = p1.clone().lerp(new THREE.Vector3(0,p1.y,0),.18);
      const in2 = p2.clone().lerp(new THREE.Vector3(0,p2.y,0),.18);
      const idx = nCounts[bt];
      dummy.position.copy(in1); dummy.scale.setScalar(1); dummy.updateMatrix(); m1.setMatrixAt(idx, dummy.matrix); m1.count = idx+1;
      dummy.position.copy(in2); dummy.updateMatrix(); m2.setMatrixAt(idx, dummy.matrix); m2.count = idx+1;
      nCounts[bt]++;
    }
    if (i % BFREQ === 0 && bIdx < bMax) {
      const mid = p1.clone().lerp(p2, .5);
      const len = p1.distanceTo(p2);
      const dir = p2.clone().sub(p1).normalize();
      dummy.position.copy(mid); dummy.scale.set(1,len,1);
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
      dummy.updateMatrix(); brInst.setMatrixAt(bIdx++, dummy.matrix);
    }
  }
  phInst1.count = pIdx; phInst2.count = pIdx; brInst.count = bIdx;
  [phInst1, phInst2, brInst, ...instArr.flatMap(({m1,m2})=>[m1,m2])].forEach(m => m.instanceMatrix.needsUpdate = true);

  // ══════════════════════════════════════════════════════════════
  // PHASE 4 — AI WEB  (vast neural network, data flows, labels)
  // ══════════════════════════════════════════════════════════════
  const aiWebGroup = new THREE.Group();
  aiWebGroup.visible = false;
  scene.add(aiWebGroup);

  const AI_N = 72;
  const aiPos = Array.from({length:AI_N}, () => {
    const phi = Math.acos(2*Math.random()-1), theta = Math.random()*Math.PI*2;
    const r = 2 + Math.random()*5.5;
    return new THREE.Vector3(
      r*Math.sin(phi)*Math.cos(theta), r*Math.sin(phi)*Math.sin(theta), r*Math.cos(phi)
    );
  });
  const aiEdges = [];
  aiPos.forEach((p,i) => aiPos.forEach((q,j) => {
    if (j > i && p.distanceTo(q) < 4.8) aiEdges.push([i, j]);
  }));

  const aiNodeMat = new THREE.MeshStandardMaterial({
    color:0x00d4ff, emissive:0x00aacc, emissiveIntensity:1.2, transparent:true, opacity:1,
  });
  const aiNodeInst = new THREE.InstancedMesh(new THREE.SphereGeometry(.07, 12, 12), aiNodeMat, AI_N);
  const aiDummy = new THREE.Object3D();
  aiPos.forEach((p,i) => { aiDummy.position.copy(p); aiDummy.updateMatrix(); aiNodeInst.setMatrixAt(i, aiDummy.matrix); });
  aiNodeInst.instanceMatrix.needsUpdate = true;
  aiWebGroup.add(aiNodeInst);

  const aiEdgeBuf = new Float32Array(aiEdges.length * 6);
  const aiEdgeGeo = new THREE.BufferGeometry();
  aiEdgeGeo.setAttribute('position', new THREE.BufferAttribute(aiEdgeBuf, 3));
  const aiEdgeMat = new THREE.LineBasicMaterial({
    color:0x003366, transparent:true, opacity:.32, blending:THREE.AdditiveBlending, depthWrite:false,
  });
  aiEdges.forEach(([a,b], e) => {
    const pa=aiPos[a], pb=aiPos[b];
    aiEdgeBuf[e*6]=pa.x; aiEdgeBuf[e*6+1]=pa.y; aiEdgeBuf[e*6+2]=pa.z;
    aiEdgeBuf[e*6+3]=pb.x; aiEdgeBuf[e*6+4]=pb.y; aiEdgeBuf[e*6+5]=pb.z;
  });
  aiEdgeGeo.attributes.position.needsUpdate = true;
  aiWebGroup.add(new THREE.LineSegments(aiEdgeGeo, aiEdgeMat));

  // Data-flow particles — race along edges like packets through a network
  const DF_N = 45;
  const dfBuf = new Float32Array(DF_N * 3);
  const dfGeo = new THREE.BufferGeometry();
  dfGeo.setAttribute('position', new THREE.BufferAttribute(dfBuf, 3));
  const dfMat = new THREE.PointsMaterial({
    color:0x00ffcc, size:.16, transparent:true, opacity:.98,
    map:hardDotTex, alphaTest:.01, sizeAttenuation:true, blending:THREE.AdditiveBlending, depthWrite:false,
  });
  aiWebGroup.add(new THREE.Points(dfGeo, dfMat));
  const dfData = Array.from({length:DF_N}, () => ({
    ei: Math.floor(Math.random()*aiEdges.length), t: Math.random(), spd: .016 + Math.random()*.028,
  }));

  // Floating capability labels at key nodes (canvas sprites)
  ['MEMORY','PLANNING','CONTEXT','REASONING','GOALS','LEARNING','SCHEDULING','ANALYSIS']
    .forEach((text, i) => {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 52;
      const ctx = c.getContext('2d');
      ctx.clearRect(0,0,256,52);
      ctx.font = '600 16px "Share Tech Mono","Courier New",monospace';
      ctx.fillStyle = 'rgba(0,210,255,0.85)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 26);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map:new THREE.CanvasTexture(c), transparent:true, opacity:.68,
        blending:THREE.AdditiveBlending, depthWrite:false,
      }));
      const ni = Math.floor(i * AI_N / 8);
      sp.position.copy(aiPos[ni]);
      sp.position.y += 0.55;
      sp.scale.set(2.8, 0.56, 1);
      aiWebGroup.add(sp);
    });

  // ══════════════════════════════════════════════════════════════
  // PHASE 5 — JARVIS REVEAL  (text sprite + orb vs universe)
  // ══════════════════════════════════════════════════════════════
  const jarvisGroup = new THREE.Group();
  jarvisGroup.visible = false;
  scene.add(jarvisGroup);

  // Large "J.A.R.V.I.S" canvas sprite
  const jCanvas = document.createElement('canvas');
  jCanvas.width = 1024; jCanvas.height = 200;
  const jCtx = jCanvas.getContext('2d');
  jCtx.clearRect(0,0,1024,200);
  jCtx.font = '900 88px "Orbitron","Courier New",monospace';
  jCtx.fillStyle = '#00d4ff';
  jCtx.textAlign = 'center'; jCtx.textBaseline = 'middle';
  jCtx.fillText('J.A.R.V.I.S', 512, 100);
  const jarvisTitle = new THREE.Sprite(new THREE.SpriteMaterial({
    map:new THREE.CanvasTexture(jCanvas), transparent:true, opacity:0,
    blending:THREE.AdditiveBlending, depthWrite:false,
  }));
  jarvisTitle.scale.set(26, 5.1, 1);
  jarvisTitle.position.set(0, 2.8, 0);
  jarvisGroup.add(jarvisTitle);

  // Subtitle canvas sprite
  const jSubCanvas = document.createElement('canvas');
  jSubCanvas.width = 768; jSubCanvas.height = 56;
  const jSubCtx = jSubCanvas.getContext('2d');
  jSubCtx.clearRect(0,0,768,56);
  jSubCtx.font = '500 22px "Share Tech Mono","Courier New",monospace';
  jSubCtx.fillStyle = 'rgba(0,180,220,0.78)';
  jSubCtx.textAlign = 'center'; jSubCtx.textBaseline = 'middle';
  jSubCtx.fillText('YOUR AI LIFE INTELLIGENCE SYSTEM', 384, 28);
  const jarvisSub = new THREE.Sprite(new THREE.SpriteMaterial({
    map:new THREE.CanvasTexture(jSubCanvas), transparent:true, opacity:0,
    blending:THREE.AdditiveBlending, depthWrite:false,
  }));
  jarvisSub.scale.set(17, 1.35, 1);
  jarvisSub.position.set(0, -0.2, 0);
  jarvisGroup.add(jarvisSub);

  // Arc-reactor orb — the Jarvis "core" that materialises at the reveal
  const orbGroup = new THREE.Group();
  orbGroup.position.set(0, -3.8, 0);
  jarvisGroup.add(orbGroup);

  // Core
  const coreMat  = new THREE.MeshStandardMaterial({ color:0x00ffff, emissive:0x00bbff, emissiveIntensity:2.2, metalness:.1, roughness:.05, transparent:true, opacity:1 });
  const innerMat = new THREE.MeshStandardMaterial({ color:0xffffff, emissive:0xffffff, emissiveIntensity:4.0, transparent:true, opacity:.9 });
  const core     = new THREE.Mesh(new THREE.SphereGeometry(.72, 32, 32), coreMat);
  const inner    = new THREE.Mesh(new THREE.SphereGeometry(.46, 20, 20), innerMat);
  orbGroup.add(core, inner);

  // Gyroscope mechanism — 3 perpendicular rings that spin independently
  // This is what a real AI "core" should look like, not an octahedron
  const gyroGroup = new THREE.Group();
  const gyroRingGeo = new THREE.TorusGeometry(0.88, 0.022, 24, 100);
  const gyroMat1 = new THREE.MeshStandardMaterial({ color:0x00ccff, emissive:0x00aadd, emissiveIntensity:1.4, metalness:.95, roughness:.04, transparent:true, opacity:1 });
  const gyroMat2 = new THREE.MeshStandardMaterial({ color:0x0077ff, emissive:0x0055cc, emissiveIntensity:1.2, metalness:.95, roughness:.04, transparent:true, opacity:1 });
  const gyroMat3 = new THREE.MeshStandardMaterial({ color:0x00eeff, emissive:0x00ccdd, emissiveIntensity:1.0, metalness:.95, roughness:.04, transparent:true, opacity:1 });
  const gyroR1 = new THREE.Mesh(gyroRingGeo, gyroMat1);                                // equatorial
  const gyroR2 = new THREE.Mesh(gyroRingGeo, gyroMat2); gyroR2.rotation.x = Math.PI/2;  // polar
  const gyroR3 = new THREE.Mesh(gyroRingGeo, gyroMat3); gyroR3.rotation.y = Math.PI/2;  // sagittal
  gyroGroup.add(gyroR1, gyroR2, gyroR3);
  orbGroup.add(gyroGroup);

  // 6 orbital rings — 32 tube segments for perfectly smooth tori
  const RING_CFGS = [
    {r:1.5,  t:.030, tx:0,    ty:0,   s: 1.1, c:0x00ffff, ei:1.8},
    {r:2.0,  t:.024, tx:65,   ty:20,  s:-.65, c:0x0088ff, ei:1.4},
    {r:2.6,  t:.019, tx:-40,  ty:80,  s: .45, c:0x00bbff, ei:1.2},
    {r:3.2,  t:.014, tx:90,   ty:0,   s:-.9,  c:0x0055ff, ei:1.0},
    {r:3.8,  t:.010, tx:30,   ty:50,  s: .3,  c:0x003399, ei:.7},
    {r:4.5,  t:.007, tx:-70,  ty:30,  s:-.18, c:0x002266, ei:.5},
  ];
  const orbRings = RING_CFGS.map(cfg => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(cfg.r, cfg.t, 32, 160),
      new THREE.MeshStandardMaterial({ color:cfg.c, emissive:cfg.c, emissiveIntensity:cfg.ei, metalness:.9, roughness:.04, transparent:true, opacity:1 })
    );
    m.rotation.x = THREE.MathUtils.degToRad(cfg.tx);
    m.rotation.y = THREE.MathUtils.degToRad(cfg.ty);
    m.userData.speed = cfg.s;
    orbGroup.add(m); return m;
  });

  // Orb halo glow — particles sphere around the core
  const haloHPos = new Float32Array(800 * 3);
  for (let i = 0; i < 800; i++) {
    const phi = Math.acos(2*Math.random()-1), theta = Math.random()*Math.PI*2;
    const r = 3 + Math.pow(Math.random(),.4)*2.5;
    haloHPos[i*3]=r*Math.sin(phi)*Math.cos(theta); haloHPos[i*3+1]=r*Math.sin(phi)*Math.sin(theta); haloHPos[i*3+2]=r*Math.cos(phi);
  }
  const haloHGeo = new THREE.BufferGeometry();
  haloHGeo.setAttribute('position', new THREE.BufferAttribute(haloHPos, 3));
  const haloHPts = new THREE.Points(haloHGeo, new THREE.PointsMaterial({
    color:0x00ccff, size:.08, transparent:true, opacity:.55,
    map:softGlowTex, alphaTest:.005, sizeAttenuation:true, blending:THREE.AdditiveBlending, depthWrite:false,
  }));
  orbGroup.add(haloHPts);

  // ══════════════════════════════════════════════════════════════
  // SCROLL STATE + CINEMATIC JOURNEY TIMELINE
  // ══════════════════════════════════════════════════════════════
  const state = {
    cameraZ:       16,
    cameraY:       0,
    cameraX:       0,
    headOpacity:   1,
    brainOpacity:  0,
    dnaOpacity:    0,
    dnaRotY:       0,
    aiOpacity:     0,
    aiExpand:      1.0,
    jarvisOpacity: 0,
    bloomStrength: 1.4,
    fogDensity:    0.016,
  };

  // Voice narration milestones — fired once, keyed to scroll progress 0→1
  const voiceTriggers = [
    { pct:.03,  fired:false, text:'Every decision you make... begins here.' },
    { pct:.22,  fired:false, text:'One hundred billion neurons. More connections than stars in the Milky Way.' },
    { pct:.40,  fired:false, text:'At the core of every cell — a code written before you were born.' },
    { pct:.56,  fired:false, text:'What if that intelligence could be extended? Amplified. Given to you, on demand.' },
    { pct:.70,  fired:false, text:'Every conversation. Every task. Every goal. Flowing. Thinking. Learning. For you.' },
    { pct:.83,  fired:false, text:'At a scale beyond what any human could manage alone.' },
    { pct:.94,  fired:false, text:'Meet Jarvis.' },
  ];

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#hero',
      start:   'top top',
      endTrigger: '#animation-zone',
      end:     'bottom bottom',
      scrub:   1.8,
      onUpdate(self) {
        document.getElementById('scroll-progress').style.height = (self.progress * 100) + '%';
        document.getElementById('depth-val').textContent = (self.progress * 99.9).toFixed(1) + 'm';
        bloomPass.strength = state.bloomStrength;
        scene.fog.density  = state.fogDensity;
        voiceTriggers.forEach(vt => {
          if (!vt.fired && self.progress >= vt.pct) {
            vt.fired = true;
            playWhoosh();
          }
        });
      },
    }
  });

  // ── JOURNEY (0 → ~13.5 units) ────────────────────────────────
  // Phase 1: Camera dives toward head
  tl.to(state, { cameraZ:3.2, bloomStrength:1.6, duration:2.2, ease:'power1.in' }, 0);

  // Phase 2: Head dissolves → brain emerges
  tl.to(state, { headOpacity:0, duration:.8, ease:'power2.in' }, 2.0);
  tl.to(state, { brainOpacity:1, cameraZ:8.0, duration:1.2, ease:'power2.out' }, 2.5);

  // Phase 3: Dive into brain / neurons
  tl.to(state, { cameraZ:2.0, duration:1.8, ease:'power1.in' }, 3.5);

  // Phase 4: Brain dissolves → DNA helix
  tl.to(state, { brainOpacity:0, duration:.7, ease:'power2.in' }, 5.0);
  tl.to(state, { dnaOpacity:1, cameraZ:6.5, dnaRotY:Math.PI*3, bloomStrength:1.5, duration:1.2, ease:'power2.out' }, 5.4);

  // Phase 5: Spiral into the DNA
  tl.to(state, { cameraZ:1.4, dnaRotY:Math.PI*8, duration:1.5, ease:'power1.in' }, 6.3);

  // Phase 6: DNA dissolves → AI web materialises
  tl.to(state, { dnaOpacity:0, duration:.7, ease:'power2.in' }, 7.5);
  tl.to(state, { aiOpacity:1, cameraZ:9.5, bloomStrength:1.6, duration:1.2, ease:'power2.out' }, 7.9);

  // Phase 7: AI web EXPANDS — feels endless
  tl.to(state, { aiExpand:4.2, cameraZ:30, duration:2.0, ease:'power1.in' }, 9.0);

  // Phase 8: RAPID ZOOM OUT — universe scale
  tl.to(state, { aiOpacity:0, cameraZ:240, bloomStrength:2.0, fogDensity:.003, duration:1.2, ease:'power4.in' }, 10.8);

  // Phase 9: Universe settles, JARVIS materialises
  tl.to(state, { cameraZ:16, bloomStrength:1.7, fogDensity:.010, duration:1.8, ease:'power3.out' }, 11.6);
  tl.to(state, { jarvisOpacity:1, duration:1.2 }, 12.5);

  // ══════════════════════════════════════════════════════════════
  // SECTION LABELS
  // ══════════════════════════════════════════════════════════════
  const labelEl = document.getElementById('section-label');
  [
    { id:'hero',           label:'SYSTEM BOOT' },
    { id:'animation-zone', label:'JOURNEY'     },
    { id:'info-reveal',    label:'REVEAL'      },
    { id:'about',          label:'CORE'        },
    { id:'features',       label:'CAPAB.'      },
    { id:'cta',            label:'ACCESS'      },
  ].forEach(sec => ScrollTrigger.create({
    trigger:'#'+sec.id, start:'top center',
    onEnter() { labelEl.textContent = sec.label; },
  }));

  // ── HTML section enter animations ────────────────────────────
  gsap.from('.reveal-inner > *', {
    scrollTrigger:{ trigger:'#info-reveal', start:'top 70%' },
    opacity:0, y:40, stagger:.12, duration:.9, ease:'power3.out',
  });
  gsap.from('.info-card', {
    scrollTrigger:{ trigger:'#about', start:'top 70%' },
    opacity:0, y:36, stagger:.1, duration:.8, ease:'power3.out',
  });
  gsap.from('.features-header', {
    scrollTrigger:{ trigger:'#features', start:'top 70%' },
    opacity:0, y:28, duration:.8, ease:'power3.out',
  });
  document.querySelectorAll('.feature-card').forEach((card,i) => {
    ScrollTrigger.create({ trigger:card, start:'top 82%',
      onEnter() {
        gsap.to(card, { opacity:1, y:0, duration:.65, delay:i*.08, ease:'power3.out',
          onStart:()=>card.classList.add('visible') });
        playUIClick();
      },
    });
  });
  gsap.from('.cta-glass > *', {
    scrollTrigger:{ trigger:'#cta', start:'top 68%' },
    opacity:0, y:36, stagger:.1, duration:.85, ease:'power3.out',
  });

  // Stat counters
  document.querySelectorAll('.rstat-n').forEach(el => {
    const target = +el.dataset.target;
    ScrollTrigger.create({ trigger:el, start:'top 88%',
      onEnter() {
        gsap.to({v:0}, { v:target, duration:2.2, ease:'power2.out',
          onUpdate() { el.textContent = Math.round(this.targets()[0].v); }
        });
      },
    });
  });

  // Navbar
  ScrollTrigger.create({
    start:180,
    onEnter()     { document.getElementById('navbar').classList.add('solid'); },
    onLeaveBack() { document.getElementById('navbar').classList.remove('solid'); },
  });

  // Info-section narration
  [
    { trigger:'#info-reveal', start:'top 60%', voice:'Now you understand what you are. Jarvis extends it.' },
    { trigger:'#features',    start:'top 60%', voice:'I plan, organise, and execute — so you never have to think about the how.' },
    { trigger:'#cta',         start:'top 60%', voice:'The future belongs to those who are ready for it.' },
  ].forEach(n => ScrollTrigger.create({
    trigger:n.trigger, start:n.start,
    onEnter() { playWhoosh(); },
  }));

  // ══════════════════════════════════════════════════════════════
  // MOUSE + FPS
  // ══════════════════════════════════════════════════════════════
  const mouse = { x:0, y:0, tx:0, ty:0 };
  document.addEventListener('mousemove', e => {
    mouse.tx = (e.clientX/window.innerWidth-.5)*2;
    mouse.ty = (e.clientY/window.innerHeight-.5)*2;
  });
  let fpsFrames = 0, fpsLast = performance.now();
  const fpsEl = document.getElementById('fps-counter');

  // ══════════════════════════════════════════════════════════════
  // RENDER LOOP
  // ══════════════════════════════════════════════════════════════
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    mouse.x += (mouse.tx - mouse.x) * .065;
    mouse.y += (mouse.ty - mouse.y) * .065;

    // Camera
    camera.position.z = state.cameraZ;
    camera.position.y = state.cameraY + mouse.y * .5;
    camera.position.x = state.cameraX + mouse.x * .7;
    camera.lookAt(0, 0, 0);

    // Orbiting lights
    kLight.position.x = Math.cos(t*.35) * 9;   kLight.position.z = Math.sin(t*.35) * 9;
    fLight.position.x = Math.cos(t*.35+Math.PI)*8; fLight.position.z = Math.sin(t*.35+Math.PI)*8;
    wLight.position.x = Math.cos(t*.2+1)*10;    wLight.position.z = Math.sin(t*.2+1)*6;

    // ── HEAD ──────────────────────────────────────────────────
    if (state.headOpacity > .005) {
      headGroup.visible = true;
      headGroup.rotation.y = t * .16;
      headGroup.rotation.x = Math.sin(t*.1) * .045;
      headSolidMat.opacity     = state.headOpacity * .06;
      headWireMat.opacity      = state.headOpacity * .38;
      headParticleMat.opacity  = state.headOpacity * .7;
      scanRingMat.opacity      = state.headOpacity * .9;
      hudRingMats.forEach((m,i) => { m.opacity = state.headOpacity * (0.28 - i*.07); });
      scanRing.position.y = Math.sin(t * .7) * (HEAD_SCALE * 0.95);
    } else {
      headGroup.visible = false;
    }

    // ── BRAIN ─────────────────────────────────────────────────
    if (state.brainOpacity > .005) {
      brainGroup.visible = true;
      brainGroup.rotation.y = t * .12;
      brainGroup.rotation.x = Math.sin(t*.08) * .05;
      brainSolidMat.opacity = state.brainOpacity * .14;
      brainWireMat.opacity  = state.brainOpacity * .26;
      bnInstMat.opacity     = state.brainOpacity;
      bnEdgeMat.opacity     = state.brainOpacity * .4;
      bnFireMat.opacity     = state.brainOpacity * .98;

      // Action potentials travel along axon edges
      bnFire.forEach((fp, i) => {
        fp.t += fp.spd;
        if (fp.t > 1) { fp.t = 0; fp.ei = Math.floor(Math.random()*bnEdgePairs.length); }
        const [a, b] = bnEdgePairs[fp.ei];
        const pa = bnPos[a], pb = bnPos[b];
        bnFireBuf[i*3]   = pa.x + (pb.x-pa.x)*fp.t;
        bnFireBuf[i*3+1] = pa.y + (pb.y-pa.y)*fp.t;
        bnFireBuf[i*3+2] = pa.z + (pb.z-pa.z)*fp.t;
      });
      bnFireGeo.attributes.position.needsUpdate = true;
    } else {
      brainGroup.visible = false;
    }

    // ── DNA ───────────────────────────────────────────────────
    if (state.dnaOpacity > .005) {
      dnaGroup.visible = true;
      dnaGroup.rotation.y = state.dnaRotY + t * .22;
      dnaGroup.rotation.x = Math.sin(t*.1) * .035;
      dnaMats.forEach(m => { m.opacity = state.dnaOpacity; });
    } else {
      dnaGroup.visible = false;
    }

    // ── AI WEB ────────────────────────────────────────────────
    if (state.aiOpacity > .005) {
      aiWebGroup.visible = true;
      aiWebGroup.scale.setScalar(state.aiExpand);
      aiWebGroup.rotation.y = t * .06;
      aiNodeMat.opacity = state.aiOpacity;
      aiEdgeMat.opacity = state.aiOpacity * .32;
      dfMat.opacity     = state.aiOpacity * .98;

      // Data packets race along edges
      dfData.forEach((df, i) => {
        df.t += df.spd;
        if (df.t > 1) { df.t = 0; df.ei = Math.floor(Math.random()*aiEdges.length); }
        const [a, b] = aiEdges[df.ei];
        const pa = aiPos[a], pb = aiPos[b];
        dfBuf[i*3]   = pa.x + (pb.x-pa.x)*df.t;
        dfBuf[i*3+1] = pa.y + (pb.y-pa.y)*df.t;
        dfBuf[i*3+2] = pa.z + (pb.z-pa.z)*df.t;
      });
      dfGeo.attributes.position.needsUpdate = true;
    } else {
      aiWebGroup.visible = false;
    }

    // ── JARVIS REVEAL ─────────────────────────────────────────
    if (state.jarvisOpacity > .005) {
      jarvisGroup.visible = true;
      jarvisTitle.material.opacity = state.jarvisOpacity;
      jarvisSub.material.opacity   = state.jarvisOpacity * .75;

      const pulse = 1 + Math.sin(t*2.6)*.055;
      core.scale.setScalar(pulse);
      coreMat.emissiveIntensity = 2.0 + Math.sin(t*2.6)*.4;
      inner.scale.setScalar(.9 + Math.sin(t*3.8)*.1);
      innerMat.emissiveIntensity = 3.5 + Math.sin(t*4)*.5;
      coreMat.opacity  = state.jarvisOpacity;
      innerMat.opacity = state.jarvisOpacity;

      gyroGroup.rotation.y += .006;
      gyroR1.rotation.z    += .009;
      gyroR2.rotation.y    += .011;
      gyroR3.rotation.x    += .007;
      gyroMat1.opacity = gyroMat2.opacity = gyroMat3.opacity = state.jarvisOpacity;

      orbRings.forEach(r => {
        r.rotation.z += r.userData.speed * .008;
        r.material.opacity = state.jarvisOpacity;
      });
      haloHPts.rotation.y += .0008;
      haloHPts.material.opacity = state.jarvisOpacity * .55;
      orbGroup.rotation.y = t * .16;
    } else {
      jarvisGroup.visible = false;
    }

    // ── BACKGROUND ────────────────────────────────────────────
    nebulaUniforms.uT.value = t;
    s1.rotation.y += .000045;
    s2.rotation.y -= .000025;
    s3.rotation.y += .000018;
    s4.rotation.x += .000012;
    s5.rotation.y -= .000010;
    const mp = micGeo.attributes.position.array;
    for (let i = 0; i < MIC; i++) mp[i*3+1] += Math.sin(t*.4 + i*.4) * .0004;
    micGeo.attributes.position.needsUpdate = true;

    bloomPass.strength = state.bloomStrength;

    fpsFrames++;
    const now = performance.now();
    if (now - fpsLast > 1000) { fpsEl.textContent = fpsFrames; fpsFrames = 0; fpsLast = now; }

    composer.render();
  }

  animate();

})();
