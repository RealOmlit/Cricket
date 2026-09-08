import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type Athlete = {g:THREE.Group; legs:THREE.Group[]; knees:THREE.Group[]; arms:THREE.Group[]; elbows:THREE.Group[]; bat:THREE.Group; torso:THREE.Mesh; head:THREE.Group; home:THREE.Vector3};

export function createAthlete(scene:THREE.Scene,x:number,z:number,batting=false,keeper=false):Athlete {
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  const fabric=new THREE.MeshStandardMaterial({color:batting?0x183e70:0xd5ad35,roughness:.95});
  const trousers=new THREE.MeshStandardMaterial({color:batting?0x163761:0xd9b645,roughness:1});
  const skin=new THREE.MeshStandardMaterial({color:0xad7956,roughness:.62});
  const white=new THREE.MeshStandardMaterial({color:0xe8e9df,roughness:.77});
  const rubber=new THREE.MeshStandardMaterial({color:0x24323b,roughness:.8});
  const steel=new THREE.MeshStandardMaterial({color:0x879897,metalness:.72,roughness:.32});
  const seam=new THREE.MeshStandardMaterial({color:batting?0x4875a0:0xb78e2a,roughness:1});
  const helmetMat=new THREE.MeshStandardMaterial({color:batting?0x102945:0xb49530,roughness:.36,metalness:.15});
  function mesh(geo:THREE.BufferGeometry,mat:THREE.Material,p:THREE.Object3D,px:number,py:number,pz:number){const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);m.castShadow=true;m.receiveShadow=true;p.add(m);return m;}
  function ellipsoid(rx:number,ry:number,rz:number,mat:THREE.Material,p:THREE.Object3D,px:number,py:number,pz:number){const m=mesh(new THREE.SphereGeometry(1,24,16),mat,p,px,py,pz);m.scale.set(rx,ry,rz);return m;}
  function rounded(w:number,h:number,d:number,r:number,mat:THREE.Material,p:THREE.Object3D,px:number,py:number,pz:number){return mesh(new RoundedBoxGeometry(w,h,d,2,r),mat,p,px,py,pz);}
  function tube(points:THREE.Vector3[],radius:number,mat:THREE.Material,p:THREE.Object3D){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,radius,5,false),mat,p,0,0,0);}
  // A tapered, smooth shoulder/chest/waist mesh with real surface normals.
  const profile=[[.88,.165,.115],[.94,.18,.13],[1.07,.172,.125],[1.22,.205,.136],[1.36,.241,.142],[1.43,.226,.122],[1.48,.13,.092],[1.49,.075,.067]];
  const positions:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let r=0;r<profile.length;r++){const [y,w,d]=profile[r];for(let j=0;j<=32;j++){const a=j/32*Math.PI*2;positions.push(Math.sin(a)*w,y,Math.cos(a)*d);uv.push(j/32,r/(profile.length-1));if(r<profile.length-1&&j<32){const i=r*33+j;indices.push(i,i+1,i+33,i+1,i+34,i+33);}}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();const torso=mesh(geo,fabric,g,0,0,0);
  ellipsoid(.07,.085,.065,skin,g,0,1.51,0);
  const collar=mesh(new THREE.TorusGeometry(.079,.014,6,24),seam,g,0,1.485,0);collar.rotation.x=Math.PI/2;
  for(const side of [-1,1])tube([new THREE.Vector3(side*.16,.91,.08),new THREE.Vector3(side*.18,1.13,.09),new THREE.Vector3(side*.23,1.36,.075)],.007,seam,g);
  const head=new THREE.Group();head.position.y=1.64;g.add(head);
  ellipsoid(.114,.156,.116,skin,head,0,.038,0);
  ellipsoid(.086,.065,.087,skin,head,0,-.061,-.018);
  ellipsoid(.027,.04,.037,skin,head,0,.014,-.109);
  for(const side of [-1,1]){ellipsoid(.024,.043,.015,skin,head,side*.112,.018,0);ellipsoid(.022,.009,.008,white,head,side*.044,.047,-.106);ellipsoid(.008,.009,.005,rubber,head,side*.044,.047,-.113);rounded(.043,.009,.012,.003,rubber,head,side*.045,.065,-.105);}
  rounded(.044,.007,.014,.003,seam,head,0,-.031,-.106);
  if(batting){mesh(new THREE.SphereGeometry(.145,28,20,0,Math.PI*2,0,Math.PI*.58),helmetMat,head,0,.072,0);rounded(.23,.018,.125,.009,helmetMat,head,0,.075,-.123);for(const side of [-1,1])ellipsoid(.02,.07,.065,helmetMat,head,side*.132,.008,.012);
    for(let row=0;row<3;row++)tube([new THREE.Vector3(-.137,.018-row*.038,-.04),new THREE.Vector3(-.105,.018-row*.038,-.156),new THREE.Vector3(.105,.018-row*.038,-.156),new THREE.Vector3(.137,.018-row*.038,-.04)],.0055,steel,head);
    for(const side of [-1,1])tube([new THREE.Vector3(side*.105,.065,-.151),new THREE.Vector3(side*.105,-.075,-.156)],.005,steel,head);
  }else{mesh(new THREE.SphereGeometry(.127,24,12,0,Math.PI*2,0,Math.PI*.48),fabric,head,0,.082,0);rounded(.21,.017,.12,.007,fabric,head,0,.088,-.09);}
  const legs:THREE.Group[]=[],knees:THREE.Group[]=[],arms:THREE.Group[]=[],elbows:THREE.Group[]=[];
  for(const side of [-1,1]){
    const leg=new THREE.Group();leg.position.set(side*.115,.91,side*.025);g.add(leg);legs.push(leg);
    ellipsoid(.106,.23,.109,trousers,leg,0,-.19,0);
    const knee=new THREE.Group();knee.position.set(0,-.405,0);leg.add(knee);knees.push(knee);
    ellipsoid(.076,.205,.083,trousers,knee,0,-.175,0);
    rounded(.157,.104,.284,.034,white,knee,0,-.398,-.061);rounded(.161,.024,.293,.01,rubber,knee,0,-.448,-.063);
    if(batting||keeper){rounded(.168,.395,.096,.038,white,knee,0,-.126,-.09);ellipsoid(.086,.074,.066,white,knee,0,.04,-.081);for(let rib=-2;rib<=2;rib++)rounded(.022,.31,.029,.01,white,knee,rib*.029,-.137,-.144);for(const y of [-.23,-.04])rounded(.17,.025,.008,.003,seam,knee,0,y,.077);for(let k=0;k<3;k++)rounded(.086,.009,.012,.004,rubber,knee,0,-.353,-.074-k*.024);}
    const arm=new THREE.Group();arm.position.set(side*.216,1.393,0);g.add(arm);arms.push(arm);
    ellipsoid(.104,.10,.105,fabric,arm,side*.02,-.03,0);ellipsoid(.082,.135,.083,fabric,arm,side*.026,-.137,0);ellipsoid(.061,.095,.065,skin,arm,side*.02,-.254,0);
    const elbow=new THREE.Group();elbow.position.set(side*.02,-.29,0);arm.add(elbow);elbows.push(elbow);
    ellipsoid(.06,.126,.066,skin,elbow,0,-.104,0);ellipsoid(.046,.073,.034,batting||keeper?white:skin,elbow,0,-.256,-.005);
    if(batting||keeper){rounded(.085,.035,.063,.012,fabric,elbow,0,-.208,0);for(let finger=0;finger<4;finger++)rounded(.014,.057,.027,.006,white,elbow,(finger-1.5)*.017,-.28,-.024);}
  }
  const bat=new THREE.Group();bat.position.set(.29,.72,-.37);g.add(bat);bat.visible=batting;
  const willow=new THREE.MeshStandardMaterial({color:0xdcc390,roughness:.57});
  rounded(.108,.52,.057,.015,willow,bat,0,-.31,0);rounded(.065,.10,.045,.014,willow,bat,0,-.013,0);mesh(new THREE.CylinderGeometry(.022,.021,.25,16),rubber,bat,0,.132,0);
  for(let i=0;i<15;i++){const grip=mesh(new THREE.TorusGeometry(.022,.003,4,12),seam,bat,0,.025+i*.015,0);grip.rotation.x=Math.PI/2;}
  rounded(.085,.12,.003,.001,fabric,bat,0,-.16,-.032);
  for(let i=-2;i<=2;i++)rounded(.001,.42,.002,.0005,seam,bat,i*.017,-.33,.03);
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d')!;
  ctx.clearRect(0,0,256,256);ctx.fillStyle=batting?'#e8eddc':'#183741';ctx.textAlign='center';ctx.font='bold 27px Arial';ctx.fillText(batting?'MASTERS':'ROYALS',128,58);ctx.font='bold 112px Arial';ctx.fillText(batting?'07':'18',128,167);
  const labelTexture=new THREE.CanvasTexture(canvas);labelTexture.colorSpace=THREE.SRGBColorSpace;const labelMat=new THREE.MeshStandardMaterial({map:labelTexture,transparent:true,roughness:.9,depthWrite:false});const label=mesh(new THREE.PlaneGeometry(.28,.28),labelMat,g,0,1.25,.145);label.userData.ownedTexture=labelTexture;
  if(batting){legs[0].rotation.x=.17;legs[1].rotation.x=.10;knees.forEach(k=>k.rotation.x=-.20);arms.forEach(a=>a.rotation.x=-.5);elbows.forEach(e=>e.rotation.x=-.7);g.position.y=-.015;}
  return {g,legs,knees,arms,elbows,bat,torso,head,home:new THREE.Vector3(x,0,z)};
}

