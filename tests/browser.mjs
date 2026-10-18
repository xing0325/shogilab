// Optional developer smoke suite. Run against a disposable browser profile.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:5173/#home');
 await page.locator('[data-action="new"]').click();await page.locator('[data-setup-side="first"]').click();if(await page.locator('.intro-dialog[open]').count())await page.locator('[data-intro="skip"]').click();
 assert.equal(await page.locator('.pick-pool .piece-card').count(),16);
 for(let i=0;i<10;i++)await page.locator('.pick-pool .piece-card:not(:disabled)').first().click();
 for(let i=0;i<12;i++){await page.locator('.deployment-tray [data-piece]:not(:disabled)').first().click();const to=i<2?(i===0?22:2):(i%2===0?15:5)+Math.floor(i/2)-1;await page.locator(`[data-square="${to}"]`).click();}
 assert.equal(await page.locator('.board .piece').count(),12);assert.equal(await page.locator('.header nav').count(),0);
 await page.locator('a.org-brand').click();await page.locator('[data-action="versus-new"]').click();await page.locator('[data-setup-side="first"]').click();if(await page.locator('.intro-dialog[open]').count())await page.locator('[data-intro="skip"]').click();
 for(const [from,to] of [[54,45],[9,27],[45,36],[10,28],[36,27],[28,37]]){await page.locator(`[data-vsquare="${from}"]`).click();await page.locator(`[data-vsquare="${to}"]`).click();}
 await page.locator('[data-hand="c-pawn"]').click();await page.locator('[data-vsquare="40"]').click();
 assert.match(await page.locator('[data-vsquare="40"]').getAttribute('aria-label'),/将棋方 兵/);
 for(const [from,to] of [[11,29],[27,18]]){await page.locator(`[data-vsquare="${from}"]`).click();await page.locator(`[data-vsquare="${to}"]`).click();}
 await page.locator('[data-vpromotion="s-tokin"]').click();await page.reload();
 assert.match(await page.locator('[data-vsquare="18"]').getAttribute('aria-label'),/と金/);
 await page.locator('a.org-brand').click();await page.locator('[data-action="library"]').click();
 await page.locator('#search').fill('酔象');await page.locator('[data-form="promoted"]').click();
 assert.equal(await page.locator('.catalog-card').getAttribute('data-back'),'true');
 await page.locator('[data-card-flip]').click();assert.equal(await page.locator('.catalog-card').getAttribute('data-back'),'false');
 await page.locator('[data-library-mode="versus"]').click();await page.locator('[data-faction="chess"]').click();assert.equal(await page.locator('.catalog-card').count(),6);
 await page.locator('[data-detail="c-king"]').click();await page.locator('.variant-note').waitFor();assert.match(await page.locator('.variant-note').innerText(),/国际象棋/);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log('PASS: pick-only draft, placement, hybrid capture/drop/promotion, persistence, catalogue, responsive layout');
}finally{await browser.close();}
