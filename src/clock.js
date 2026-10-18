// One byoyomi period resets after every completed move; deadlines survive reloads.
export function createClock(minutes, seconds, running, now=Date.now()) {
 return {remaining:[minutes*60000,minutes*60000],byoyomi:seconds*1000,since:running?now:null};
}
export function clockReading(g,side,now=Date.now()) {
 const c=g.clock;if(!c)return {ms:Infinity,expired:false,period:false};
 const elapsed=g.phase==='play'&&side===g.turn&&c.since!==null?Math.max(0,now-c.since):0;
 const main=c.remaining[side]-elapsed,period=main<=0&&c.byoyomi>0;
 const ms=main>0?main:Math.max(0,c.byoyomi+main);
 return {ms,period,expired:main+c.byoyomi<=0};
}
export function advanceClock(before,after,now=Date.now()) {
 if(!before.clock)return;
 const c=structuredClone(before.clock);
 if(before.phase==='play'&&c.since!==null)c.remaining[before.turn]=Math.max(0,c.remaining[before.turn]-Math.max(0,now-c.since));
 c.since=after.phase==='play'?now:null;after.clock=c;
}
export function formatClock(ms){if(!Number.isFinite(ms))return '∞';const s=Math.ceil(Math.max(0,ms)/1000);return (s>=3600?Math.floor(s/3600)+':':'')+String(Math.floor(s/60)%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
