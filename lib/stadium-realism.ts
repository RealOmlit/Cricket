import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export async function enhanceStadium(scene:THREE.Scene,renderer:THREE.WebGLRenderer,camera:THREE.PerspectiveCamera,grass:THREE.MeshStandardMaterial,pitch:THREE.MeshStandardMaterial) {
  const loader=new THREE.TextureLoader();
  const [grassColor,grassNormal,pitchColor,pitchNormal,sky]=await Promise.all([
    loader.loadAsync('/textures/grass-color.jpg'),loader.loadAsync('/textures/grass-normal.jpg'),loader.loadAsync('/textures/pitch-color.jpg'),loader.loadAsync('/textures/pitch-normal.jpg'),new HDRLoader().loadAsync('/textures/stadium-sky.hdr')
  ]);
  const assets=[grassColor,grassNormal,pitchColor,pitchNormal,sky];
  grassColor.colorSpace=pitchColor.colorSpace=THREE.SRGBColorSpace;
  for(const t of [grassColor,grassNormal]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(48,48);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
  for(const t of [pitchColor,pitchNormal]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1,7);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
  grass.map=grassColor;grass.normalMap=grassNormal;grass.normalScale.set(.32,.32);grass.color.set('#8faa60');grass.roughness=.97;
  grass.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 turfPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nturfPosition = position.xy;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 turfPosition;').replace('#include <map_fragment>','#include <map_fragment>\nfloat stripe = smoothstep(0.46, 0.54, fract(turfPosition.y / 12.0));\ndiffuseColor.rgb *= mix(0.82, 1.10, stripe);');
  };grass.needsUpdate=true;
  pitch.map=pitchColor;pitch.normalMap=pitchNormal;pitch.normalScale.set(.23,.23);pitch.color.set('#e2cea8');pitch.roughness=.98;pitch.needsUpdate=true;
  sky.mapping=THREE.EquirectangularReflectionMapping;scene.background=sky;scene.backgroundIntensity=.85;scene.backgroundRotation.y=1.9;
  const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromEquirectangular(sky);scene.environment=env.texture;scene.environmentIntensity=.45;scene.environmentRotation.y=1.9;pmrem.dispose();
  // Short individual blades break up the surface around the playing square.
  let seed=9653;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const bladeGeometry=new THREE.BufferGeometry();bladeGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.012,0,0,.012,0,0,.003,.055,.015],3));bladeGeometry.computeVertexNormals();
  const bladeMaterial=new THREE.MeshStandardMaterial({color:0x6c8c35,side:THREE.DoubleSide,roughness:1});
  const blades=new THREE.InstancedMesh(bladeGeometry,bladeMaterial,32000),dummy=new THREE.Object3D();
  for(let i=0;i<32000;i++){let x=(rand()-.5)*54;const z=(rand()-.5)*54;if(Math.abs(x)<5.1&&Math.abs(z)<12.2)x+=x>0?6:-6;dummy.position.set(x,.036,z);dummy.rotation.y=rand()*Math.PI*2;dummy.scale.setScalar(.5+rand());dummy.updateMatrix();blades.setMatrixAt(i,dummy.matrix);blades.setColorAt(i,new THREE.Color().setHSL(.22+rand()*.025,.38,.20+rand()*.10));}scene.add(blades);
  const heads=new THREE.InstancedMesh(new THREE.SphereGeometry(.17,7,5),new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),7500);
  const headColors=[0xb88261,0xcfa47b,0x805a41,0xdcb99b,0x654630];
  for(let i=0;i<7500;i++){const tier=Math.floor(i/2500),row=Math.floor((i%2500)/500),angle=(i%500)/500*Math.PI*2,r=70+tier*7+row*1.1;dummy.position.set(Math.sin(angle)*r,1.72+tier*5+row*.78,Math.cos(angle)*r);dummy.scale.set(1,1.16,1);dummy.rotation.set(0,angle,0);dummy.updateMatrix();heads.setMatrixAt(i,dummy.matrix);heads.setColorAt(i,new THREE.Color(headColors[Math.floor(rand()*headColors.length)]));}scene.add(heads);
  const metal=new THREE.MeshStandardMaterial({color:0xc9d0cc,metalness:.65,roughness:.48});
  function beam(a:THREE.Vector3,b:THREE.Vector3,r=.045){const direction=b.clone().sub(a),mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,direction.length(),6),metal);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());scene.add(mesh);}
  for(let i=0;i<32;i++){const a=i/32*Math.PI*2;const point=(r:number,y:number)=>new THREE.Vector3(Math.sin(a)*r,y,Math.cos(a)*r);beam(point(86,17),point(80,21));beam(point(86,17),point(91,21));beam(point(80,21),point(91,21));}
  const scoreCanvas=document.createElement('canvas');scoreCanvas.width=1024;scoreCanvas.height=512;const ctx=scoreCanvas.getContext('2d')!,scoreTexture=new THREE.CanvasTexture(scoreCanvas);scoreTexture.colorSpace=THREE.SRGBColorSpace;
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(17,8.5),new THREE.MeshBasicMaterial({map:scoreTexture}));screen.position.set(0,12.5,-76);scene.add(screen);
  const updateScore=(runs:number,wickets:number,balls:number)=>{ctx.fillStyle='#102428';ctx.fillRect(0,0,1024,512);ctx.textAlign='center';ctx.fillStyle='#cfed93';ctx.font='bold 42px Arial';ctx.fillText('CRICKET MASTERS',512,90);ctx.fillStyle='#f0f3df';ctx.font='bold 140px Arial';ctx.fillText(`${runs} / ${wickets}`,512,270);ctx.font='35px Arial';ctx.fillText(`MASTERS XI     ${Math.floor(balls/6)}.${balls%6} OV     TARGET 24`,512,380);scoreTexture.needsUpdate=true;};updateScore(0,0,0);
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const ao=new SSAOPass(scene,camera,containerWidth(),containerHeight(),12);ao.kernelRadius=.42;ao.minDistance=.001;ao.maxDistance=.016;composer.addPass(ao);composer.addPass(new OutputPass());
  function containerWidth(){return renderer.domElement.clientWidth||800;}function containerHeight(){return renderer.domElement.clientHeight||600;}
  let average=1/60,samples=0;
  return {updateScore,render(dt:number){average=average*.97+dt*.03;if(++samples>180&&average>.031)ao.enabled=false;composer.render(dt);},resize(w:number,h:number){composer.setSize(w,h);},dispose(){composer.passes.forEach(p=>p.dispose());composer.dispose();env.dispose();assets.forEach(t=>t.dispose());scoreTexture.dispose();}};
}

