(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const TILE = 32, COLS = 19, ROWS = 21;
  canvas.width = COLS * TILE;
  canvas.height = ROWS * TILE;

  const MAP = [
    '###################','#o.......#.......o#','#.###.##.#.##.###.#','#.....##...##.....#','#.###.#.###.#.###.#','#.....#..#..#.....#','#####.##.#.##.#####','#.......   .......#','#.###.# ### #.###.#','#.....#     #.....#','.....## ### ##.....','#.....#     #.....#','#.###.# ### #.###.#','#.......   .......#','#####.##.#.##.#####','#.....#..#..#.....#','#.###.#.###.#.###.#','#.....##...##.....#','#.###.##.#.##.###.#','#o.......#.......o#','###################'
  ];
  const DIR = {up:{x:0,y:-1,a:-Math.PI/2},down:{x:0,y:1,a:Math.PI/2},left:{x:-1,y:0,a:Math.PI},right:{x:1,y:0,a:0}};
  const opposite = {up:'down',down:'up',left:'right',right:'left'};
  const colors = ['#ff35c7','#8347ff','#15d9ff','#b8ff3d'];

  const dom = id => document.getElementById(id);
  const ui = {score:dom('scoreValue'),level:dom('levelValue'),lives:dom('livesValue'),outsideBest:dom('outsideBest'),outsideLevel:dom('outsideLevel'),start:dom('startOverlay'),pause:dom('pauseOverlay'),gameOver:dom('gameOverOverlay'),finalScore:dom('finalScore'),finalBest:dom('finalBest'),pauseButton:dom('pauseButton'),mobilePause:dom('mobilePause'),sound:dom('soundButton'),mobileSound:dom('mobileSound')};

  const dinoImg = new Image(); dinoImg.src = '../meteorito-run/assets/dino-player.svg';
  const quartzImg = new Image(); quartzImg.src = 'https://www.quartzsales.com/images/q-02.svg';

  let map=[], pellets=0, score=0, level=1, lives=3, state='ready', poweredUntil=0, muted=true, audio=null, best=Number(localStorage.getItem('dinoEscapeBest')||0), bestLevel=Number(localStorage.getItem('dinoEscapeBestLevel')||1), last=performance.now(), raf=0;
  const player={x:9,y:15,dir:'left',next:'left',speed:5.1};
  const enemies=colors.map((color,i)=>({x:[8,10,8,10][i],y:[9,9,11,11][i],sx:[8,10,8,10][i],sy:[9,9,11,11][i],dir:['left','right','up','down'][i],next:'left',color,personality:i,safeUntil:0,speed:3.2}));

  function buildMap(){map=MAP.map(r=>r.split(''));pellets=0;map.forEach(r=>r.forEach(c=>{if(c==='.'||c==='o')pellets++;}));}
  function resetPositions(){Object.assign(player,{x:9,y:15,dir:'left',next:'left'});enemies.forEach((e,i)=>{e.x=e.sx;e.y=e.sy;e.dir=['left','right','up','down'][i];e.safeUntil=performance.now()+850;});}
  function updateHud(){ui.score.textContent=String(score).padStart(6,'0');ui.level.textContent=String(level).padStart(2,'0');ui.lives.textContent=String(lives).padStart(2,'0');ui.outsideBest.textContent=String(Math.max(best,score)).padStart(6,'0');ui.outsideLevel.textContent=String(bestLevel).padStart(2,'0');}
  function overlay(el,show){el.classList.toggle('is-visible',show);}
  function hideOverlays(){[ui.start,ui.pause,ui.gameOver].forEach(el=>overlay(el,false));}
  function wall(x,y){const tx=((Math.round(x)%COLS)+COLS)%COLS,ty=Math.round(y);return ty<0||ty>=ROWS||map[ty][tx]==='#';}
  function centered(e){return Math.abs(e.x-Math.round(e.x))<.055&&Math.abs(e.y-Math.round(e.y))<.055;}
  function canMove(e,d){const v=DIR[d],x=Math.round(e.x)+v.x,y=Math.round(e.y)+v.y;if(x<0||x>=COLS)return y===10;return !wall(x,y);}
  function move(e,dt){if(centered(e)){e.x=Math.round(e.x);e.y=Math.round(e.y);if(e.next&&canMove(e,e.next))e.dir=e.next;if(!canMove(e,e.dir))return;}const d=DIR[e.dir];e.x+=d.x*e.speed*dt;e.y+=d.y*e.speed*dt;if(e.x<-.55)e.x=COLS-.45;if(e.x>COLS-.45)e.x=-.55;}
  function choices(e){const ds=['up','down','left','right'].filter(d=>canMove(e,d));return ds.length>1?ds.filter(d=>d!==opposite[e.dir]):ds;}
  function target(e){if(e.personality===0)return{x:player.x,y:player.y};if(e.personality===1){const d=DIR[player.dir];return{x:player.x+d.x*4,y:player.y+d.y*4};}if(e.personality===2)return Math.random()<.4?{x:Math.random()*COLS,y:Math.random()*ROWS}:{x:player.x,y:player.y};return Math.hypot(e.x-player.x,e.y-player.y)<5?{x:1,y:ROWS-2}:{x:player.x,y:player.y};}
  function updateEnemies(dt,now){enemies.forEach(e=>{e.speed=now<poweredUntil?2.4:3.1+level*.13+e.personality*.06;if(centered(e)){const t=now<poweredUntil?{x:COLS-player.x,y:ROWS-player.y}:target(e);const ds=choices(e);if(ds.length)e.next=ds.map(d=>{const v=DIR[d];return{d,s:Math.abs(t.x-(e.x+v.x))+Math.abs(t.y-(e.y+v.y))+Math.random()*(e.personality===2?4:1)}}).sort((a,b)=>a.s-b.s)[0].d;}move(e,dt);});}
  function collect(now){const x=((Math.round(player.x)%COLS)+COLS)%COLS,y=Math.round(player.y),c=map[y]?.[x];if(c==='.'||c==='o'){map[y][x]=' ';pellets--;score+=c==='o'?50:10;if(c==='o')poweredUntil=now+7000;beep(c==='o'?210:680,c==='o'?.14:.025,c==='o'?'sawtooth':'square',c==='o'?.07:.025);}if(pellets===0)nextLevel();}
  function collide(now){for(const e of enemies){if(now<e.safeUntil||Math.hypot(player.x-e.x,player.y-e.y)>.58)continue;if(now<poweredUntil){score+=200;e.x=e.sx;e.y=e.sy;e.safeUntil=now+900;beep(520,.08,'square',.05);}else{lives--;beep(160,.35,'sawtooth',.08);if(lives<=0)return endGame();resetPositions();state='ready';setTimeout(()=>state='playing',700);}break;}}
  function nextLevel(){score+=1000+lives*250;level++;bestLevel=Math.max(bestLevel,level);localStorage.setItem('dinoEscapeBestLevel',bestLevel);buildMap();resetPositions();poweredUntil=0;state='ready';updateHud();setTimeout(()=>state='playing',900);}
  function endGame(){state='gameover';ui.pauseButton.disabled=true;ui.mobilePause.disabled=true;if(score>best){best=score;localStorage.setItem('dinoEscapeBest',best);}ui.finalScore.textContent=String(score).padStart(6,'0');ui.finalBest.textContent=String(best).padStart(6,'0');overlay(ui.gameOver,true);updateHud();}
  function startGame(){score=0;level=1;lives=3;poweredUntil=0;buildMap();resetPositions();hideOverlays();state='ready';updateHud();setTimeout(()=>{state='playing';ui.pauseButton.disabled=false;ui.mobilePause.disabled=false;},650);loopStart();}
  function togglePause(){if(!['playing','paused'].includes(state))return;state=state==='playing'?'paused':'playing';overlay(ui.pause,state==='paused');ui.pauseButton.textContent=state==='paused'?'▶':'Ⅱ';ui.mobilePause.textContent=state==='paused'?'▶':'Ⅱ';}
  function setDir(d){if(DIR[d])player.next=d;}
  function ensureAudio(){if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();}
  function beep(freq,dur,type='square',vol=.04){if(muted)return;ensureAudio();const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+dur);}
  function toggleSound(){muted=!muted;ui.sound.setAttribute('aria-pressed',String(!muted));ui.mobileSound.setAttribute('aria-pressed',String(!muted));ui.sound.textContent=ui.mobileSound.textContent=muted?'♪':'♫';if(!muted)beep(520,.08,'square',.05);}

  function drawBackground(now){ctx.fillStyle='#050513';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='rgba(21,217,255,.035)';for(let x=(now*.01)%TILE-TILE;x<canvas.width;x+=TILE){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}}
  function drawQuartz(x,y,power,now){const px=x*TILE+TILE/2,py=y*TILE+TILE/2,s=power?17:10+(Math.sin(now*.008+x+y)+1);ctx.save();ctx.translate(px,py);ctx.shadowColor=power?'#ff35c7':'#15d9ff';ctx.shadowBlur=power?18:9;if(quartzImg.complete){ctx.filter='brightness(0) invert(1)';ctx.drawImage(quartzImg,-s/2,-s/2,s,s);ctx.filter='none';}else{ctx.fillStyle='#fff';ctx.font=(power?'11':'7')+'px "Press Start 2P"';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Q',0,1);}ctx.restore();}
  function drawMaze(now){for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const c=map[y][x],px=x*TILE,py=y*TILE;if(c==='#'){ctx.fillStyle='rgba(12,12,39,.98)';ctx.fillRect(px+1,py+1,TILE-2,TILE-2);ctx.strokeStyle=(x+y)%5===0?'#8347ff':'#15d9ff';ctx.globalAlpha=.55;ctx.strokeRect(px+4,py+4,TILE-8,TILE-8);ctx.globalAlpha=1;}else if(c==='.'||c==='o')drawQuartz(x,y,c==='o',now);}}
  function drawDino(now){const x=player.x*TILE+TILE/2,y=player.y*TILE+TILE/2,d=DIR[player.dir],powered=now<poweredUntil;ctx.save();ctx.translate(x,y);ctx.rotate(d.a);if(dinoImg.complete){ctx.translate(-15,-15);ctx.scale(.55,.55);if(player.dir==='left'){ctx.translate(56,0);ctx.scale(-1,1);}ctx.drawImage(dinoImg,0,0,56,53);}else{ctx.fillStyle=powered?'#b8ff3d':'#79ef42';ctx.fillRect(-12,-10,24,20);}if(powered){ctx.globalCompositeOperation='source-atop';ctx.fillStyle='rgba(184,255,61,.25)';ctx.fillRect(-20,-20,40,40);}ctx.restore();}
  function drawMeteor(e,now){const x=e.x*TILE+TILE/2,y=e.y*TILE+TILE/2,powered=now<poweredUntil,pulse=Math.sin(now*.01+e.personality);ctx.save();ctx.translate(x,y);ctx.rotate(now*.0007*(e.personality%2?-1:1));ctx.shadowColor=powered?'#15d9ff':e.color;ctx.shadowBlur=powered?8:14;ctx.fillStyle=powered?'#29264a':e.color;ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=12+((i+e.personality)%3)*1.8+pulse,px=Math.cos(a)*r,py=Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#f7f5ff';ctx.fillRect(-7,-4,5,6);ctx.fillRect(2,-4,5,6);const look=DIR[e.dir];ctx.fillStyle=powered?'#15d9ff':'#050513';ctx.fillRect(-5+look.x,-2+look.y,2,3);ctx.fillRect(4+look.x,-2+look.y,2,3);ctx.restore();}
  function draw(now){drawBackground(now);drawMaze(now);enemies.forEach(e=>drawMeteor(e,now));drawDino(now);}
  function update(dt,now){if(state!=='playing')return;move(player,dt);collect(now);updateEnemies(dt,now);collide(now);updateHud();}
  function loop(now){const dt=Math.min((now-last)/1000,.035);last=now;update(dt,now);draw(now);raf=requestAnimationFrame(loop);}
  function loopStart(){if(!raf){last=performance.now();raf=requestAnimationFrame(loop);}}

  document.addEventListener('keydown',e=>{const m={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};if(m[e.key]){e.preventDefault();setDir(m[e.key]);}else if(e.key.toLowerCase()==='p')togglePause();});
  document.querySelectorAll('[data-dir]').forEach(b=>['pointerdown','touchstart'].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();setDir(b.dataset.dir);},{passive:false})));
  let touch=null;dom('gameArea').addEventListener('touchstart',e=>{const t=e.changedTouches[0];touch={x:t.clientX,y:t.clientY};},{passive:true});dom('gameArea').addEventListener('touchend',e=>{if(!touch)return;const t=e.changedTouches[0],dx=t.clientX-touch.x,dy=t.clientY-touch.y;touch=null;if(Math.max(Math.abs(dx),Math.abs(dy))<18)return;setDir(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));},{passive:true});

  dom('startButton').onclick=startGame;dom('restartButton').onclick=startGame;dom('resumeButton').onclick=togglePause;ui.pauseButton.onclick=togglePause;ui.mobilePause.onclick=togglePause;ui.sound.onclick=toggleSound;ui.mobileSound.onclick=toggleSound;
  dom('mobileLaunch').onclick=()=>{document.body.classList.add('mobile-game-open');loopStart();};dom('mobileClose').onclick=()=>{document.body.classList.remove('mobile-game-open');if(state==='playing')togglePause();};

  buildMap();resetPositions();updateHud();draw(performance.now());
})();