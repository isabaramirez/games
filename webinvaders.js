(() => {
  if (window.__webInvadersActive) { console.warn("Juego ya activo"); return; }
  window.__webInvadersActive = true;

  // ===== Overlay y canvas =====
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = 0; overlay.style.left = 0;
  overlay.style.width = "100%"; overlay.style.height = "100%";
  overlay.style.zIndex = 2147483647;
  overlay.style.pointerEvents = "auto";
  overlay.style.background = "rgba(0,0,0,0.1)";
  document.body.appendChild(overlay);

  const canvas = document.createElement("canvas");
  overlay.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  function resize(){canvas.width = innerWidth; canvas.height = innerHeight;}
  resize(); addEventListener("resize", resize);

  // ===== Variables del juego =====
  let playing=false, paused=false, hidden=false;
  let spawnMin=700, spawnMax=1000, enemySpeed=1;
  let bullets=[], enemies=[], explosions=[];
  let score=0, health=100, lastHit=0;
  let superCooldown=false;
  let keys={};

  const ship={x:innerWidth/2,y:innerHeight-80,w:40,h:40,speed:6};

  // ===== Menú de dificultad =====
  const menu=document.createElement("div");
  menu.style.position="absolute";
  menu.style.top="40%";
  menu.style.left="50%";
  menu.style.transform="translateX(-50%)";
  menu.style.background="rgba(255,255,255,0.95)";
  menu.style.padding="25px 40px";
  menu.style.borderRadius="15px";
  menu.style.fontFamily="sans-serif";
  menu.style.textAlign="center";
  overlay.appendChild(menu);

  function showMenu(msg){
    menu.innerHTML = `
      <h2 style="margin:0;color:#000">${msg||"Web Invaders cargado con éxito"}</h2>
      <p style="color:#000;margin:10px 0">Elige dificultad:</p>
      <button id="easyBtn" style="margin:5px;padding:10px 20px;cursor:pointer;">Fácil</button>
      <button id="normalBtn" style="margin:5px;padding:10px 20px;cursor:pointer;">Normal</button>
      <button id="hardBtn" style="margin:5px;padding:10px 20px;cursor:pointer;">Difícil</button>`;
    menu.querySelector("#easyBtn").onclick=()=>initGame("easy");
    menu.querySelector("#normalBtn").onclick=()=>initGame("normal");
    menu.querySelector("#hardBtn").onclick=()=>initGame("hard");
    overlay.style.display="block";
  }

  // ===== Candidatos a enemigos =====
  const candidates=[...document.body.querySelectorAll("img,p,div,span,h1,h2,h3,h4,h5,h6")]
    .filter(el => !el.closest("#__webInvaders"));

  // ===== Spawn de enemigos =====
  function spawnEnemy(){
    if(!playing || paused || hidden || candidates.length===0) return;
    const el = candidates[Math.floor(Math.random()*candidates.length)];
    const rect = el.getBoundingClientRect();
    if(rect.width<30||rect.height<15) return;
    const clone = el.cloneNode(true);
    clone.style.position="fixed";
    clone.style.left=Math.random()*(innerWidth-rect.width)+"px";
    clone.style.top="-50px";
    clone.style.opacity="0.8";
    clone.style.pointerEvents="none";
    overlay.appendChild(clone);
    const sizeFactor = Math.random()*1.2+0.4;
    const w = rect.width*sizeFactor, h = rect.height*sizeFactor;
    const hp = sizeFactor>1.2?3:sizeFactor>0.8?2:1;
    const speed = enemySpeed*(sizeFactor>1.2?0.6:sizeFactor<0.7?1.4:1);
    enemies.push({el:clone,x:parseFloat(clone.style.left),y:-50,w,h,vx:(Math.random()<0.5?-1:1)*0.5*speed,vy:0.5*speed,hp});
  }

  function enemySpawner(){
    if(!playing) return;
    spawnEnemy();
    const delay=spawnMin+Math.random()*(spawnMax-spawnMin);
    setTimeout(enemySpawner,delay);
  }

  // ===== Explosión =====
  function boom(x,y,c="#f55",n=15){
    for(let i=0;i<n;i++) explosions.push({x,y,vx:(Math.random()-0.5)*6,vy:(Math.random()-1)*6,life:30,color:c});
  }

  // ===== Super disparo =====
  function superShoot(){
    if(!playing || paused || superCooldown) return;
    superCooldown=true;
    fireRadial(); setTimeout(fireRadial,300);
    setTimeout(()=>{superCooldown=false},10000);
  }
  function fireRadial(){
    const dirs=16;
    for(let i=0;i<dirs;i++){
      const angle=(i/dirs)*Math.PI*2;
      bullets.push({x:ship.x+ship.w/2,y:ship.y,vx:Math.cos(angle)*5,vy:Math.sin(angle)*5,w:4,h:4,super:true});
    }
  }

  // ===== Inicializar juego =====
  function initGame(diff){
    switch(diff){
      case "easy": spawnMin=1000; spawnMax=2000; enemySpeed=0.5; break;
      case "normal": spawnMin=700; spawnMax=1000; enemySpeed=1; break;
      case "hard": spawnMin=500; spawnMax=700; enemySpeed=1.5; break;
    }
    playing=true; paused=false; hidden=false;
    score=0; health=100; bullets=[]; enemies=[]; explosions=[];
    menu.style.display="none";
    enemySpawner();
    loop();
  }

  // ===== Input =====
  addEventListener("keydown",e=>{
    if(e.key==="+") { paused=true; hidden=true; overlay.style.display="none"; }
    else if(e.key==="}"||e.key==="ç") { paused=false; hidden=false; overlay.style.display="block"; }
    else if(e.key===" " || e.key.toLowerCase()==="e") bullets.push({x:ship.x+ship.w/2-2,y:ship.y,vx:0,vy:-6,w:4,h:10});
    else if(e.key.toLowerCase()==="x") superShoot();
    keys[e.key]=true;
  });
  addEventListener("keyup",e=>{keys[e.key]=false;});

  // ===== Game Over =====
  function gameOver(){ 
    playing=false; 
    enemies.forEach(e=>e.el.remove());
    showMenu(`Has perdido. Puntuación: ${score}`); 
  }

  // ===== Loop principal =====
  function loop(){
    if(!playing) return;
    requestAnimationFrame(loop);
    if(paused || hidden) return;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Movimiento nave
    if(keys["ArrowLeft"]||keys["a"]) ship.x-=ship.speed;
    if(keys["ArrowRight"]||keys["d"]) ship.x+=ship.speed;
    if(keys["ArrowUp"]||keys["w"]) ship.y-=ship.speed;
    if(keys["ArrowDown"]||keys["s"]) ship.y+=ship.speed;
    ship.x=Math.max(0,Math.min(innerWidth-ship.w,ship.x));
    ship.y=Math.max(0,Math.min(innerHeight-ship.h,ship.y));

    // Dibujar nave como triángulo
    ctx.fillStyle="cyan";
    ctx.beginPath();
    ctx.moveTo(ship.x+ship.w/2, ship.y);
    ctx.lineTo(ship.x, ship.y+ship.h);
    ctx.lineTo(ship.x+ship.w, ship.y+ship.h);
    ctx.closePath();
    ctx.fill();

    // Balas
    for(const b of bullets){ b.x+=b.vx; b.y+=b.vy; ctx.fillStyle=b.super?"orange":"yellow"; ctx.fillRect(b.x,b.y,b.w,b.h);}
    for(let i=bullets.length-1;i>=0;i--) if(bullets[i].y<-20||bullets[i].y>innerHeight+20||bullets[i].x<-20||bullets[i].x>innerWidth+20) bullets.splice(i,1);

    // Enemigos
    for(const e of enemies){ e.y+=e.vy; e.x+=e.vx; e.el.style.top=e.y+"px"; e.el.style.left=e.x+"px";}

    // Colisiones balas
    for(let i=enemies.length-1;i>=0;i--){
      const e=enemies[i];
      for(let j=bullets.length-1;j>=0;j--){
        const b=bullets[j];
        if(b.x<b.w+e.x+e.w && b.x+b.w>e.x && b.y<b.h+e.y+e.h && b.y+b.h>e.y){
          bullets.splice(j,1); e.hp--; if(e.hp<=0){ boom(e.x+e.w/2,e.y+e.h/2); e.el.remove(); enemies.splice(i,1); score+=10;} break;
        }
      }
    }

    // Colisiones nave
    const now = performance.now();
    for(let i=enemies.length-1;i>=0;i--){
      const e=enemies[i];
      if(ship.x<e.x+e.w && ship.x+ship.w>e.x && ship.y<e.y+e.h && ship.y+ship.h>e.y){
        if(now-lastHit>1000){ health-=10; lastHit=now; }
        boom(e.x+e.w/2,e.y+e.h/2,"#55f"); e.el.remove(); enemies.splice(i,1);
        if(health<=0) gameOver();
      }
    }

    // Explosiones
    for(let i=explosions.length-1;i>=0;i--){
      const ex=explosions[i]; ex.x+=ex.vx; ex.y+=ex.vy; ex.life--;
      ctx.fillStyle=ex.color; ctx.fillRect(ex.x,ex.y,3,3);
      if(ex.life<=0) explosions.splice(i,1);
    }

    // HUD con fondo blanco
    ctx.fillStyle="white"; ctx.fillRect(5,5,120,30); ctx.fillRect(innerWidth-130,5,125,30);
    ctx.fillStyle="#000"; ctx.font="16px sans-serif"; ctx.fillText("Puntos: "+score,10,25); ctx.fillText("Vida: "+health+"%",innerWidth-120,25);
  }

  showMenu();
})();

