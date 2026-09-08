export const TARGET = 24;
export const MAX_BALLS = 12;
export function timingQuality(progress: number) { return Math.max(0, 1 - Math.abs(progress - 0.94) / 0.16); }
export function matchFinished(runs: number, wickets: number, balls: number) { return runs >= TARGET || wickets >= 10 || balls >= MAX_BALLS; }
export function runningScore(elapsed: number, distance: number) { return distance < 8 ? 0 : Math.max(0, Math.min(3, Math.floor((elapsed - 0.45) / 1.7))); }
export function boundaryScore(bounced: boolean) { return bounced ? 4 : 6; }

type Vector = {x:number; y:number; z:number};
export function advanceBall(position:Vector,velocity:Vector,dt:number,bounced:boolean) {
  const rolling=bounced&&position.y<=.101&&Math.abs(velocity.y)<.7;
  velocity.y=rolling?0:velocity.y-9.81*dt;
  position.x+=velocity.x*dt;position.y+=velocity.y*dt;position.z+=velocity.z*dt;
  let impact=false;
  if(position.y<.10){
    position.y=.10;
    if(velocity.y<-1.4){velocity.y=-velocity.y*.34;velocity.x*=.84;velocity.z*=.84;impact=true;}
    else velocity.y=0;
    bounced=true;
  }
  if(rolling){const horizontal=Math.hypot(velocity.x,velocity.z),drag=Math.max(0,1-1.9*dt/Math.max(.01,horizontal));velocity.x*=drag;velocity.z*=drag;}
  return {bounced,impact};
}

export function deliveryHeight(t:number,speed:number,bouncePoint:number) {
  const duration=20/(speed/3.6),bounceAt=bouncePoint*duration,initialY=(.10-2.15+4.905*bounceAt*bounceAt)/bounceAt,seconds=t*duration;
  return t<bouncePoint?2.15+initialY*seconds-4.905*seconds*seconds:.10+(-(initialY-9.81*bounceAt)*.58)*(seconds-bounceAt)-4.905*(seconds-bounceAt)**2;
}
