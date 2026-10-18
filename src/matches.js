// Match identity is independent from the seed: rematches must not overwrite one another.
export function hasProgress(game) { return !!(game.draft.length || game.placement || game.ply || game.phase==='over'); }
export function recordMatch(matches, id, startedAt, game, history, now=new Date().toISOString()) {
  if(!hasProgress(game))return matches;
  const existing=matches.find(m=>m.id===id);
  const item={id,startedAt:startedAt??null,updatedAt:now,endedAt:game.phase==='over'?(existing?.endedAt||now):null,game:structuredClone(game),history:structuredClone(history)};
  return [item,...matches.filter(m=>m.id!==id)];
}
export function matchFrames(match) {return [...match.history,match.game];}
