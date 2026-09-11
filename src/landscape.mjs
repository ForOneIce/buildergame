export const LANDSCAPES = ['flat', 'valley', 'clouds'];
export function plotAt(index) {
  if(!Number.isInteger(index)||index<0)throw new Error('Invalid plot index');
  let x=0,z=0,dx=1,dz=0,leg=1,steps=0,turns=0;
  for(let i=0;i<index;i++){x+=dx;z+=dz;if(++steps===leg){steps=0;[dx,dz]=[-dz,dx];if(++turns%2===0)leg++;}}
  return {x,z};
}
export function landscapeOf(event) { return event.landscape ?? 'flat'; }
export function validateLandscape(event) {
  if (!LANDSCAPES.includes(landscapeOf(event))) throw new Error('Unknown town landscape');
}
export function assertLandscape(previous, next) {
  if (landscapeOf(previous) !== landscapeOf(next)) throw new Error('Landscape is fixed for this town. Create a new town to choose another landscape.');
}
const smooth = t => t * t * (3 - 2 * t);
const hill = (x,z) => 3 + 2.4 * Math.sin(x * .67) + 1.7 * Math.cos(z * .71);
// Flat pads surround every logical plot; slopes live between the pads.
export function groundHeight(x,z,mode) {
  if(mode !== 'valley') return 0;
  const gx=x/16,gz=z/16,ix=Math.floor(gx),iz=Math.floor(gz);
  const blend=v=>smooth(Math.max(0,Math.min(1,(v-.33)/.34)));
  const tx=blend(gx-ix),tz=blend(gz-iz);
  return (hill(ix,iz)*(1-tx)+hill(ix+1,iz)*tx)*(1-tz)+(hill(ix,iz+1)*(1-tx)+hill(ix+1,iz+1)*tx)*tz;
}
export function plotPosition(plot, mode='flat') {
  if(mode==='clouds') {
    const dx=Math.floor(plot.x/2),dz=Math.floor(plot.z/2);
    const level=((dx*7+dz*11)%4+4)%4;
    return {x:dx*34+(plot.x-dx*2)*13,y:8+level*3.2,z:dz*34+(plot.z-dz*2)*13};
  }
  const x=plot.x*16,z=plot.z*16;return {x,y:groundHeight(x,z,mode),z};
}
