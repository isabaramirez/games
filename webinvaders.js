window.webInvaders = function(){
  console.log("🚀 Web Invaders cargado con éxito");

  // ===== CONFIGURACIÓN DEL JUEGO =====
  let dificultad = "normal";
  let spawnMin = 700, spawnMax = 1000, enemySpeed = 1.5;

  const hud = document.createElement("div");
  hud.style.position="fixed";
  hud.style.top="10px";
  hud.style.left="10px";
  hud.style.color="black";
  hud.style.fontFamily="monospace";
  hud.style.zIndex="9999999";
  document.body.appendChild(hud);

  const vidaHud = document.createElement("div");
  vidaHud.style.position="fixed";
  vidaHud.style.top="10px";
  vidaHud.style.right="10px";
  vidaHud.style.color="black";
  vidaHud.style.fontFamily="monospace";
  vidaHud.style.zIndex="9999999";
  document.body.appendChild(vidaHud);

  let score = 0;
  let vida = 100;

  // NAVE
  const nave = document.createElement("div");
  nave.style.position="fixed";
  nave.style.bottom="50px";
  nave.style.left="50%";
  nave.style.transform="translateX(-50%)";
  nave.style.width="40px";
  nave.style.height="40px";
  nave.style.background="blue";
  nave.style.zIndex="9999999";
  document.body.appendChild(nave);

  let naveX = window.innerWidth/2, naveY = window.innerHeight-60;
  const speed = 15;
  const balas = [];

  // CONTROLES
  document.addEventListener("keydown", e=>{
    if(e.key==="a" || e.key==="ArrowLeft") naveX-=speed;
    if(e.key==="d" || e.key==="ArrowRight") naveX+=speed;
    if(e.key==="w" || e.key==="ArrowUp") naveY-=speed;
    if(e.key==="s" || e.key==="ArrowDown") naveY+=speed;
    if(e.key===" ") disparar();
  });

  function updateNave(){
    nave.style.left = naveX+"px";
    nave.style.top = naveY+"px";
  }

  function disparar(){
    const b = document.createElement("div");
    b.style.position="fixed";
    b.style.width="5px";
    b.style.height="10px";
    b.style.background="red";
    b.style.left=(naveX+17)+"px";
    b.style.top=(naveY-10)+"px";
    b.style.zIndex="9999999";
    document.body.appendChild(b);
    balas.push(b);
  }

  // ENEMIGOS (elementos de la página)
  const enemigos=[];
  function spawnEnemigo(){
    const elems=[...document.body.querySelectorAll("img, p, h1, h2, h3, h4, h5, h6, span, div")];
    if(elems.length===0) return;
    const el = elems[Math.floor(Math.random()*elems.length)];
    const rect=el.getBoundingClientRect();
    const clone=el.cloneNode(true);
    clone.style.position="fixed";
    clone.style.left=Math.random()*window.innerWidth+"px";
    clone.style.top="-50px";
    clone.style.zIndex="9999999";
    clone.style.pointerEvents="none";
    clone.style.opacity="0.8";
    document.body.appendChild(clone);
    enemigos.push({el:clone,x:parseFloat(clone.style.left),y:-50,w:rect.width,h:rect.height,vida:(rect.width>100?3:1)});
    const next=spawnMin+Math.random()*(spawnMax-spawnMin);
    setTimeout(spawnEnemigo,next);
  }
  spawnEnemigo();

  // LOOP
  function gameLoop(){
    // mover balas
    balas.forEach((b,i)=>{
      b.style.top=(parseFloat(b.style.top)-5)+"px";
    });

    // mover enemigos
    enemigos.forEach((en,ei)=>{
      en.y+=enemySpeed;
      en.el.style.top=en.y+"px";

      // colisión nave
      if(Math.abs(en.x-naveX)<40 && Math.abs(en.y-naveY)<40){
        vida-=10;
        en.el.remove();
        enemigos.splice(ei,1);
      }

      // colisión balas
      balas.forEach((b,bi)=>{
        const bx=parseFloat(b.style.left), by=parseFloat(b.style.top);
        if(bx>en.x && bx<en.x+en.w && by>en.y && by<en.y+en.h){
          en.vida--;
          b.remove();
          balas.splice(bi,1);
          if(en.vida<=0){
            score++;
            en.el.remove();
            enemigos.splice(ei,1);
          }
        }
      });
    });

    // actualizar HUD
    hud.textContent="Puntaje: "+score;
    vidaHud.textContent="Vida: "+vida+"%";

    if(vida>0){
      updateNave();
      requestAnimationFrame(gameLoop);
    } else {
      alert("☠️ Moriste! Puntaje: "+score);
      document.location.reload();
    }
  }
  gameLoop();
};
