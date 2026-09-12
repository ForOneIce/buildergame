export const PLOT_SPACING = 9;
export const visualStage = stage => ({land:'land',foundation:'foundation',frame:'frame',cottage:'shell',townhouse:'complete',decorated:'complete'}[stage] ?? 'unknown');
export function plotAt(index) {
  if(!Number.isInteger(index)||index<0)throw new Error('Invalid plot index');
  let x=0,z=0,dx=1,dz=0,leg=1,steps=0,turns=0;
  for(let i=0;i<index;i++){x+=dx;z+=dz;if(++steps===leg){steps=0;[dx,dz]=[-dz,dx];if(++turns%2===0)leg++;}}
  return {x,z};
}
export function sortedProjects(projects, snapshot, sort='name') {
  const records=new Map(snapshot.projects.map(r=>[r.projectId,r]));
  const rank={unknown:-1,land:0,foundation:1,frame:2,shell:3,complete:4};
  return [...projects].sort((a,b)=>{
    const ra=records.get(a.id),rb=records.get(b.id);
    const value=r=>sort==='stage'?rank[visualStage(r?.stage)]:r?.metrics?.[sort]??-1;
    return (sort==='name'?0:value(rb)-value(ra)) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  });
}
// Pure collision/entry logic shared with tests. Doorway is in the front wall.
export function movePlayer(position, delta, projects, records, bounds) {
  const next={x:Math.max(bounds.minX,Math.min(bounds.maxX,position.x+delta.x)),z:Math.max(bounds.minZ,Math.min(bounds.maxZ,position.z+delta.z))};
  const state=new Map(records.map(r=>[r.projectId,visualStage(r.stage)]));
  for(const p of projects){
    const cx=p.plot.x*PLOT_SPACING,cz=p.plot.z*PLOT_SPACING;
    const built=['shell','complete'].includes(state.get(p.id));
    if(!built)continue;
    const doorX=cx-.45,doorZ=cz+1.78;
    if(Math.abs(next.x-doorX)<.47&&position.z>=doorZ&&next.z<doorZ&&position.z<doorZ+1.4)return{position:{x:doorX,z:doorZ+.04},enter:p.id};
    // Avoid walking through solid walls; permit sliding along one axis.
    const collides=(x,z)=>Math.abs(x-cx)<1.86&&Math.abs(z-cz)<1.78;
    if(collides(next.x,next.z)){
      if(!collides(position.x,next.z))next.x=position.x;
      else if(!collides(next.x,position.z))next.z=position.z;
      else{next.x=position.x;next.z=position.z;}
    }
  }
  return {position:next,enter:null};
}
