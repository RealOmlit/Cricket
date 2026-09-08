import * as THREE from 'three';
import { createAthlete } from './athlete';
import { enhanceStadium } from './stadium-realism';
import { timingQuality, matchFinished, runningScore, boundaryScore, advanceBall, deliveryHeight } from './cricket-rules';

export type GameEvent = { runs:number; wickets:number; balls:number; history:string[]; phase:'ready'|'runup'|'delivery'|'flight'|'result'|'over'; message:string; detail:string; speed:number; timing:string; best:number };
export type GameController = { start:()=>void; swing:()=>void; pause:(p:boolean)=>void; aim:(n:number)=>void; loft:(b:boolean)=>void; camera:(b:boolean)=>void; mute:(b:boolean)=>void; destroy:()=>void };

export async function createGame(container:HTMLElement, notify:(e:GameEvent)=>void, progress:(n:number)=>void):Promise<GameController> {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#adcddd');
  scene.fog = new THREE.Fog('#b1cbd2',100,240);
  const renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
  container.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(49,1,0.1,400);
  camera.position.set(25,20,40);
  const look = new THREE.Vector3(0,2,0);
  scene.add(new THREE.HemisphereLight(0xd8efff,0x506330,.75));
  const sun = new THREE.DirectionalLight(0xffeed3,2.7); sun.position.set(-42,45,25); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-65; sun.shadow.camera.right=65; sun.shadow.camera.top=65; sun.shadow.camera.bottom=-65; sun.shadow.normalBias=.025; sun.shadow.bias=-.0001; scene.add(sun);
  const materials:THREE.Material[] = [], textures:THREE.Texture[]=[];
  function mat(color:THREE.ColorRepresentation,roughness=.8) { const m=new THREE.MeshStandardMaterial({color,roughness});materials.push(m); return m; }
  const white=mat('#eeeeda'), black=mat('#172630'), wood=mat('#ddc18d'), steel=mat('#ccd8d6',.35);
  function box(w:number,h:number,d:number,m:THREE.Material,x=0,y=0,z=0,parent:THREE.Object3D=scene) {const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function cylinder(rt:number,rb:number,h:number,m:THREE.Material,x=0,y=0,z=0,parent:THREE.Object3D=scene,n=12) {const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function sphere(r:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=scene) { const o=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o; }
  function texture(size:number, paint:(ctx:CanvasRenderingContext2D)=>void) {const c=document.createElement('canvas');c.width=c.height=size;paint(c.getContext('2d')!);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);return t;}
  let seed=178;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const grassTexture=texture(1024,c=>{c.fillStyle='#497430';c.fillRect(0,0,1024,1024);for(let i=0;i<100000;i++){const v=50+random()*45;c.fillStyle=`rgba(${v},${v+38},${v*.48},.4)`;c.fillRect(random()*1024,random()*1024,1,3);}for(let i=0;i<16;i++){if(i%2===0){c.fillStyle='rgba(180,200,115,.10)';c.fillRect(0,i*64,1024,64);}}});
  const grassMat=mat('#ffffff');grassMat.map=grassTexture;
  const ground=new THREE.Mesh(new THREE.CircleGeometry(68,128),grassMat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const pitchTex=texture(512,c=>{c.fillStyle='#b7a176';c.fillRect(0,0,512,512);for(let i=0;i<25000;i++){c.fillStyle=random()>.5?'rgba(69,63,38,.15)':'rgba(230,214,160,.20)';c.fillRect(random()*512,random()*512,random()*3+1,random()*4+1);}for(let i=0;i<60;i++){c.strokeStyle='rgba(84,72,45,.13)';c.beginPath();let x=random()*512,y=random()*512;c.moveTo(x,y);for(let j=0;j<5;j++){x+=(random()-.5)*15;y+=random()*12;c.lineTo(x,y);}c.stroke();}});
  const pitchMat=mat('#ffffff');pitchMat.map=pitchTex;
  box(3.1,.035,23,pitchMat,0,.02,0); const worn=mat('#8d9160');box(1.7,.017,22,worn,-3.1,.015,0);box(1.7,.017,22,worn,3.1,.015,0);
  for(const z of [-10,10]) {box(3.65,.025,.045,white,0,.056,z);box(2.64,.025,.035,white,0,.057,z+(z>0?1.2:-1.2));for(const x of [-1.32,1.32])box(.035,.025,2.6,white,x,.058,z);}
  const stumps:THREE.Mesh[]=[];
  for(const z of [-10.2,10.8]){for(const x of [-.12,0,.12]) stumps.push(cylinder(.018,.021,.72,wood,x,.40,z));box(.3,.025,.026,wood,0,.775,z);}
  const rope=new THREE.Mesh(new THREE.TorusGeometry(61,.055,6,180),white);rope.rotation.x=Math.PI/2;rope.position.y=.09;scene.add(rope);
  const inner=new THREE.Mesh(new THREE.RingGeometry(27.38,27.45,100),new THREE.MeshBasicMaterial({color:0xd7e2b8,transparent:true,opacity:.35,side:THREE.DoubleSide}));inner.rotation.x=-Math.PI/2;inner.position.y=.045;scene.add(inner);
  // A continuous stadium bowl, with individually coloured spectator instances.
  const concrete=mat('#798686'), darkConcrete=mat('#354a51'), roofMat=mat('#dde5df'), ads=mat('#152d39');concrete.side=darkConcrete.side=THREE.DoubleSide;
  for(let tier=0;tier<3;tier++) {
    const r=70+tier*7, y=2+tier*5;
    const ring=new THREE.Mesh(new THREE.CylinderGeometry(r+6,r,5,128,1,true),tier===1?darkConcrete:concrete);ring.position.y=y;scene.add(ring);
    const lip=new THREE.Mesh(new THREE.TorusGeometry(r+6,.22,6,128),steel);lip.rotation.x=Math.PI/2;lip.position.y=y+2.5;scene.add(lip);
  }
  const crowd=new THREE.InstancedMesh(new THREE.BoxGeometry(.48,.72,.44),mat('#ffffff'),7500);const dummy=new THREE.Object3D(),colors=['#e0d6b6','#a9c5d3','#1d4a6d','#d7aa42','#b94436','#e6e7d6','#3d5849'];
  for(let i=0;i<7500;i++){const tier=Math.floor(i/2500),row=Math.floor((i%2500)/500),angle=(i%500)/500*Math.PI*2;const r=70+tier*7+row*1.1;dummy.position.set(Math.sin(angle)*r,1.2+tier*5+row*.78,Math.cos(angle)*r);dummy.rotation.y=angle;dummy.updateMatrix();crowd.setMatrixAt(i,dummy.matrix);crowd.setColorAt(i,new THREE.Color(colors[Math.floor(random()*colors.length)]));}scene.add(crowd);
  for(let i=0;i<48;i++){const a=i/48*Math.PI*2, r=65.3;const p=box(8.4,1.2,.22,ads,Math.sin(a)*r,.65,Math.cos(a)*r);p.rotation.y=a;}
  const adTex=texture(512,c=>{c.fillStyle='#132e39';c.fillRect(0,0,512,512);c.fillStyle='#d4fa72';c.font='bold 50px Arial';c.textAlign='center';c.fillText('CRICKET',256,224);c.fillStyle='#eef2dc';c.fillText('MASTERS',256,284);});
  const adMat=new THREE.MeshBasicMaterial({map:adTex});materials.push(adMat);
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2;const p=new THREE.Mesh(new THREE.PlaneGeometry(5.5,2.5),adMat);p.position.set(Math.sin(a)*64.95,1.3,Math.cos(a)*64.95);p.rotation.y=a+Math.PI;scene.add(p);}
  for(let i=0;i<32;i++){const a=i/32*Math.PI*2;const g=new THREE.Group();g.position.set(Math.sin(a)*86,17,Math.cos(a)*86);g.rotation.y=a;box(.25,10,.25,steel,0,-1,0,g);const panel=box(16,.2,10,roofMat,0,4,0,g);panel.rotation.x=.1;scene.add(g);}
  for(const a of [-2.45,-.7,.7,2.45]){const g=new THREE.Group();g.position.set(Math.sin(a)*81,0,Math.cos(a)*81);g.rotation.y=a;cylinder(.25,.65,32,steel,0,16,0,g);box(7,4,.5,darkConcrete,0,32,0,g);for(let x=-3;x<=3;x++)for(let y=0;y<3;y++)box(.6,.65,.12,white,x,31+y,-.32,g);scene.add(g);}
  // Articulated players: limbs, pads, gloves, helmets and bat.
  const player=(x:number,z:number,batting=false,keeper=false)=>createAthlete(scene,x,z,batting,keeper);
  const batter=player(.36,10,true),bowler=player(0,-17),keeper=player(0,13,false,true);
  player(-1,-9,true); keeper.g.rotation.y=Math.PI;
  const placements=[[-18,-20],[19,-15],[-29,2],[30,5],[-15,26],[19,29],[-37,-31],[34,-35],[0,-45]];
  const fielders=placements.map(([x,z])=>player(x,z));
  for(const f of fielders)f.g.lookAt(0,0,9);
  const umpire=player(0,-13);umpire.g.children.forEach(o=>{if(o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial && o.material.color.getHex()===0xd5ad35)o.material=black;});
  const ball=sphere(.09,mat('#bd3028',.4),0,2,-10);
  const seam=new THREE.Mesh(new THREE.TorusGeometry(.091,.006,4,24),white);ball.add(seam);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.23,24),new THREE.MeshBasicMaterial({color:0x1b2813,transparent:true,opacity:.3}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.07;scene.add(shadow);
  const targetRing=new THREE.Mesh(new THREE.RingGeometry(.28,.34,32),new THREE.MeshBasicMaterial({color:0xe3ff89,side:THREE.DoubleSide,transparent:true,opacity:.65}));targetRing.rotation.x=-Math.PI/2;targetRing.position.set(0,.09,4);scene.add(targetRing);
  const aimLine=new THREE.ArrowHelper(new THREE.Vector3(0,0,-1),new THREE.Vector3(.2,.12,9),5,0xd5ff79,.7,.4);scene.add(aimLine);
  const trailPositions=new Float32Array(30*3),trailGeometry=new THREE.BufferGeometry();trailGeometry.setAttribute('position',new THREE.BufferAttribute(trailPositions,3));const trail=new THREE.Line(trailGeometry,new THREE.LineBasicMaterial({color:0xfff7d6,transparent:true,opacity:.55}));scene.add(trail);trail.visible=false;
  const realism=await enhanceStadium(scene,renderer,camera,grassMat,pitchMat);
  let state:GameEvent={runs:0,wickets:0,balls:0,history:[],phase:'ready',message:'Make every ball count.',detail:'',speed:0,timing:'',best:0};
  try {state.best=Number(localStorage.getItem('cricket-masters-best')||0)||0;}catch{}
  let paused=false,muted=false,started=false,broadcast=false,lofted=false,aim=0,phaseTime=0,deliveryTime=1.65,deliveryProgress=0,bouncePoint=.69,swingAmount=0,swung=false,swingTime=99,flightTime=0,bounced=false,line=0,maxDistance=0,frame=0,last=performance.now(),hidden=document.hidden;
  const velocity=new THREE.Vector3(); let audio:AudioContext|undefined;
  let ambience:GainNode|undefined;
  function sound(type:'hit'|'bounce'|'crowd'|'wicket') {
    if(muted)return;
    try {
      audio??=new AudioContext();void audio.resume();
      if(!ambience){
        const buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate),data=buffer.getChannelData(0);let brown=0;
        for(let i=0;i<data.length;i++){brown=(brown+(Math.random()*2-1)*.025)/1.025;data[i]=brown*5;}
        const source=audio.createBufferSource();source.buffer=buffer;source.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1800;ambience=audio.createGain();ambience.gain.value=.028;source.connect(filter);filter.connect(ambience);ambience.connect(audio.destination);source.start();
      }
      const duration=type==='crowd'?1.8:type==='wicket'?.22:.07;
      const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*duration),audio.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++){const t=i/audio.sampleRate,envelope=type==='crowd'?Math.sin(Math.PI*t/duration):Math.exp(-t/(type==='hit'?.014:.032));data[i]=(Math.random()*2-1)*envelope;}
      const source=audio.createBufferSource();source.buffer=buffer;const filter=audio.createBiquadFilter();filter.type='bandpass';filter.frequency.value=type==='hit'?1700:type==='crowd'?850:420;filter.Q.value=.7;const gain=audio.createGain();gain.gain.value=type==='hit'?.5:type==='crowd'?.22:.22;source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.start();
    }catch{}
  }
  const emit=()=>{realism.updateScore(state.runs,state.wickets,state.balls);notify({...state,history:[...state.history]});};
  function resetField(){for(const f of fielders){f.g.position.copy(f.home);f.g.lookAt(0,0,9);f.legs.forEach(l=>l.rotation.x=0);f.knees.forEach(k=>k.rotation.x=-.08);f.elbows.forEach(e=>e.rotation.x=-.25);}bowler.g.position.set(0,0,-17);batter.g.rotation.y=0;stumps.forEach(s=>s.rotation.z=0);}
  function nextBall(){phaseTime=0;state.phase='runup';state.message=state.balls===0?'Take your guard.':'Find your moment.';state.detail='Choose your direction. Watch the release.';state.timing='';swung=false;swingTime=99;deliveryProgress=0;progress(0);resetField();ball.visible=false;trail.visible=false;targetRing.visible=false;aimLine.visible=true;emit();}
  function finish(runs:number,wicket=false,reason=''){if(state.phase==='result'||state.phase==='over')return;state.runs+=runs;state.wickets+=wicket?1:0;state.balls++;state.history.push(wicket?'W':String(runs));state.phase='result';state.message=wicket?'WICKET.':runs===6?'THAT’S SIX.':runs===4?'FOUR RUNS.':runs===0?'Dot ball.':`${runs} ${runs===1?'run':'runs'}.`;state.detail=reason||(runs>=4?'Beautifully placed. The crowd loved that.':'Back to your crease for the next delivery.');state.best=Math.max(state.best,state.runs);try{localStorage.setItem('cricket-masters-best',String(state.best));}catch{}phaseTime=0;aimLine.visible=false;targetRing.visible=false;if(wicket)sound('wicket');if(runs>=4)sound('crowd');emit();}
  function swing(){if(paused||hidden||state.phase!=='delivery'||swung)return;swung=true;swingTime=0;const q=timingQuality(deliveryProgress);state.timing=q>.78?'PERFECT TIMING':q>.35?'GOOD TIMING':deliveryProgress<.94?'TOO EARLY':'TOO LATE';if(q<=0){state.message='Through the shot…';emit();return;}sound('hit');state.phase='flight';phaseTime=0;flightTime=0;bounced=false;maxDistance=0;state.message=q>.78?'Off the middle.':'Into the outfield.';state.detail=lofted?'It’s in the air!':'Looking for the gap.';const angle=aim*.46+(1-q)*(deliveryProgress<.94?-.38:.38);const speed=20+q*18;velocity.set(Math.sin(angle)*speed,lofted?11+q*14:2+q*1.8,-Math.cos(angle)*speed);ball.position.set(.1, .75,9.65);trailPositions.fill(0);for(let i=0;i<30;i++)ball.position.toArray(trailPositions,i*3);trail.visible=true;aimLine.visible=false;targetRing.visible=false;emit();}
  function animatePlayer(p:ReturnType<typeof player>,t:number,strength:number){p.legs[0].rotation.x=Math.sin(t*11)*strength;p.legs[1].rotation.x=-Math.sin(t*11)*strength;p.arms[0].rotation.x=-Math.sin(t*11)*strength;p.arms[1].rotation.x=Math.sin(t*11)*strength;p.knees[0].rotation.x=-Math.max(0,Math.sin(t*11))*.95;p.knees[1].rotation.x=-Math.max(0,-Math.sin(t*11))*.95;p.elbows.forEach(e=>e.rotation.x=-.85);p.g.position.y=Math.abs(Math.sin(t*11))*.028;}
  const resize=()=>{const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();realism.resize(w,h);};const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const visibility=()=>{hidden=document.hidden;last=performance.now();};document.addEventListener('visibilitychange',visibility);
  function update(dt:number){
    if(!paused&&!hidden){phaseTime+=dt;swingTime+=dt;
      if(state.phase==='runup'){bowler.g.position.z=-17+Math.min(1,phaseTime/1.6)*7;animatePlayer(bowler,phaseTime,.6);if(phaseTime>1.6){state.phase='delivery';phaseTime=0;deliveryProgress=0;deliveryTime=1.45+random()*.25;line=(random()-.5)*.76;bouncePoint=.63+random()*.14;swingAmount=(random()-.5)*.30;state.speed=Math.round(126+random()*18);state.message='Wait for it…';state.detail='Play your shot in the green zone.';ball.visible=true;targetRing.visible=true;emit();}}
      if(state.phase==='delivery'){deliveryProgress=phaseTime/deliveryTime;progress(deliveryProgress*.9);const t=deliveryProgress;ball.position.z=-9.5+20*t;ball.position.x=line*t*t+swingAmount*Math.sin(t*Math.PI);ball.position.y=deliveryHeight(t,state.speed,bouncePoint);ball.rotation.x+=dt*20;bowler.arms[1].rotation.x=-Math.PI*2*Math.min(1,t*2);bowler.elbows[1].rotation.x=-.07;bowler.g.position.z=-10+Math.min(t*3,2.5);bowler.torso.rotation.x=Math.sin(Math.min(1,t)*Math.PI)*.12;targetRing.position.x=line*.5;targetRing.position.z=-9.5+20*bouncePoint;if(t>1.07){if(Math.abs(line)>.27){finish(0,false,'Beaten outside off stump. Taken cleanly by the keeper.');}else{stumps.slice(3).forEach((s,i)=>s.rotation.z=(i-1)*.35+.2);finish(0,true,swung?'Beaten by the pace. Bring your swing closer to the green zone.':'Bowled! Remember to play a shot before the ball reaches the stumps.');}}}
      if(state.phase==='flight'){flightTime+=dt;const physics=advanceBall(ball.position,velocity,dt,bounced);bounced=physics.bounced;if(physics.impact)sound('bounce');ball.rotation.x+=dt*25;maxDistance=Math.max(maxDistance,Math.hypot(ball.position.x,ball.position.z-10));
        if(Math.hypot(ball.position.x,ball.position.z)>61){finish(boundaryScore(bounced),false,bounced?'Races across the rope. Four to the Masters.':'All the way! Six over the boundary.');}
        if(state.phase==='flight'){for(const f of fielders){const v=new THREE.Vector3(ball.position.x-f.g.position.x,0,ball.position.z-f.g.position.z),d=v.length();if(flightTime>.35&&d>1){f.g.position.addScaledVector(v.normalize(),Math.min(d,5.8*dt));f.g.lookAt(ball.position.x,0,ball.position.z);animatePlayer(f,flightTime,.65);}if(d<1.6&&ball.position.y<2.1){if(!bounced&&ball.position.y>.28&&lofted){f.arms.forEach(a=>a.rotation.x=-2.3);finish(0,true,'Caught in the deep. Try a ground shot or a different gap.');}else if(bounced){finish(runningScore(flightTime,maxDistance),false,'Gathered by the fielder. Runs completed automatically.');}break;}}
          if(flightTime>8&&state.phase==='flight')finish(runningScore(flightTime,maxDistance));}
        for(let i=29;i>0;i--){trailPositions[i*3]=trailPositions[(i-1)*3];trailPositions[i*3+1]=trailPositions[(i-1)*3+1];trailPositions[i*3+2]=trailPositions[(i-1)*3+2];}ball.position.toArray(trailPositions,0);trailGeometry.attributes.position.needsUpdate=true;
      }
      if(state.phase==='result'&&phaseTime>2.7){if(matchFinished(state.runs,state.wickets,state.balls)){state.phase='over';emit();}else nextBall();}
      if(swingTime<.65){const s=Math.sin(Math.min(1,swingTime/.65)*Math.PI);batter.bat.rotation.x=-.3-s*2.6;batter.bat.rotation.z=-s*.8;batter.arms.forEach(a=>a.rotation.x=-s*1.5);batter.g.rotation.y=s*-.85;batter.legs[0].rotation.x=.17+s*.16;batter.knees[0].rotation.x=-.2-s*.20;batter.elbows.forEach(e=>e.rotation.x=-.7+s*.5);}else{batter.bat.rotation.x=-.3;batter.bat.rotation.z=0;batter.arms.forEach(a=>a.rotation.x=-.5);batter.elbows.forEach(e=>e.rotation.x=-.7);batter.legs[0].rotation.x=.17;batter.knees[0].rotation.x=-.2;batter.head.rotation.y=Math.sin(performance.now()*.001)*.025;}
    }
    shadow.visible=ball.visible;shadow.position.x=ball.position.x;shadow.position.z=ball.position.z;shadow.scale.setScalar(1+ball.position.y*.04);
    const desired=new THREE.Vector3(),target=new THREE.Vector3();
    if(!started){desired.set(16+Math.sin(performance.now()*.00006)*2,10,29);target.set(-1,1,-8);}else if(broadcast){desired.set(30,24,35);target.set(0,1,0);}else if(state.phase==='flight'||state.phase==='result'){desired.set(ball.position.x*.25,Math.max(7,ball.position.y*.45+6),23+Math.min(0,ball.position.z*.18));target.copy(ball.position).multiplyScalar(.6);target.y=Math.max(1,target.y);}else{desired.set(.6,2.9,18.5);target.set(0,1.0,-5);}
    const smooth=1-Math.exp(-dt*3);camera.position.lerp(desired,smooth);look.lerp(target,smooth);camera.lookAt(look);realism.render(dt);
  }
  function tick(now:number){const dt=Math.min((now-last)/1000,.04);last=now;update(dt);frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);emit();
  return {start(){started=true;paused=false;lofted=false;aim=0;aimLine.setDirection(new THREE.Vector3(0,0,-1));state={...state,runs:0,wickets:0,balls:0,history:[],timing:''};nextBall();sound('bounce');},swing,pause(p){paused=p;},aim(n){aim=n;aimLine.setDirection(new THREE.Vector3(Math.sin(n*.46),0,-Math.cos(n*.46)));},loft(b){lofted=b;},camera(b){broadcast=b;},mute(b){muted=b;if(ambience)ambience.gain.value=b?0:.028;},destroy(){cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);void audio?.close();scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();if(o.userData.ownedTexture)o.userData.ownedTexture.dispose();const m=Array.isArray(o.material)?o.material:[o.material];m.forEach(x=>x.dispose());}});materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());realism.dispose();renderer.dispose();renderer.domElement.remove();}};
}






