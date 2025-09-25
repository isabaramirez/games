  (async () => {
  // ---------- IMPORTS FIREBASE ----------
  const [
    firebaseAppModule,
    firebaseAuthModule,
    firebaseFirestoreModule
  ] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js")
  ]);

  const { initializeApp } = firebaseAppModule;
  const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } = firebaseAuthModule;
  const { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, getDocs } = firebaseFirestoreModule;

  // ---------- FIREBASE CONFIG ----------
  const firebaseConfig = {
    apiKey: "AIzaSyD-FxXyxCWER4wrDSzrnWjeVxBt1gAcQuo",
    authDomain: "dinosaur-game-9aca4.firebaseapp.com",
    projectId: "dinosaur-game-9aca4"
  };
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // ---------- ADMIN EMAIL ----------
  const ADMIN_EMAIL = "isabaramirez@innovaschools.edu.co";

  // ---------- STATE / CONST ----------
  const MOVE = 10, DASH_DISTANCE = 200, DASH_STEP = 15, SUPER_SCALE = 2, CUBITOS = 14;
  let puntaje = 0, dashCooldown = false, superCooldown = false, direccion = "derecha";
  let elementosOcultos = [], elementosOcultosVisibles = [];
  let skinActual = "dinoDefault";

  // ---------- SKINS ----------
  const skins = {
    dinoDefault:  { url: "https://i.imgur.com/RYIDNfM.gif", precio: 0, nombre: "Dinosaurio", color: "#ffcc00" },
    bicicletera:  { url: "https://i.imgur.com/JZy07PY.gif", precio: 0, nombre: "Bicicletera", color: "#ffcc00" },
    tralalero:    { url: "https://i.imgur.com/bC0cC1j.png", precio: 500, nombre: "Tralalero", color: "#00ffff" },
    montapuercos: { url: "https://i.imgur.com/MAGOXFW.png", precio: 1000, nombre: "Monta Puercos", color: "#ff3333" }
  };

  // ---------- UTIL ----------
  const colision = (r1, r2) => !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
  const mover = (el, dx, dy) => { el.style.left = (parseInt(el.style.left) + dx) + "px"; el.style.top = (parseInt(el.style.top) + dy) + "px"; };

  function crearExplosion(x, y, cantidad = CUBITOS) {
    const color = (skins[skinActual] && skins[skinActual].color) ? skins[skinActual].color : "#ffcc00";
    for (let i = 0; i < cantidad; i++) {
      const p = document.createElement("div");
      Object.assign(p.style, {
        position: "absolute",
        width: "5px", height: "5px",
        background: color,
        left: x + "px", top: y + "px",
        borderRadius: "1px",
        zIndex: 9997,
        pointerEvents: "none"
      });
      document.body.appendChild(p);
      const a = Math.random() * Math.PI * 2, d = Math.random() * 40 + 10;
      const dx = Math.cos(a) * d, dy = Math.sin(a) * d;
      p.animate([{ transform: "translate(0,0)", opacity: 1 }, { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 }], {
        duration: 350 + Math.random() * 200, easing: "ease-out", fill: "forwards"
      });
      setTimeout(() => p.remove(), 600);
    }
  }

  function destruirObjetos(rectDino) {
    let destruidos = 0;
    const todos = Array.from(document.body.getElementsByTagName("*"));
    todos.forEach(el => {
      if (el === dino || el === dashImg) return;
      if (!el.offsetParent) return;
      const rectEl = el.getBoundingClientRect();
      const anchoRel = rectEl.width / window.innerWidth;
      const altoRel = rectEl.height / window.innerHeight;
      if (colision(rectDino, rectEl) && anchoRel < 0.7 && altoRel < 0.7) {
        crearExplosion(rectEl.left + rectEl.width / 2, rectEl.top + rectEl.height / 2);
        el.style.display = "none";
        if (!elementosOcultos.includes(el)) elementosOcultos.push(el);
        destruidos++;
      }
    });
    return destruidos;
  }

  // ---------- FIRESTORE ----------
  async function guardarPuntaje() {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, "usuarios", user.uid), { puntaje, email: user.email, skin: skinActual }, { merge: true });
    } catch (err) { console.error("Error guardando puntaje:", err); }
  }

  async function cargarPuntaje(uid) {
    try {
      const snap = await getDoc(doc(db, "usuarios", uid));
      if (snap.exists()) {
        const data = snap.data();
        puntaje = (data.puntaje != null) ? data.puntaje : puntaje;
        skinActual = data.skin || skinActual;
        aplicarSkin();
        puntajeDiv.textContent = "Puntaje: " + puntaje;
      }
    } catch (err) { console.error("Error cargando puntaje:", err); }
  }

  // ---------- DINOSAURIO ----------
  const dino = document.createElement("img");
  dino.src = skins["dinoDefault"].url;
  Object.assign(dino.style, { position: "absolute", left: "500px", top: "300px", width: "100px", zIndex: 9999, transition: "transform 0.3s ease" });
  document.body.appendChild(dino);

  function aplicarSkin() {
    dino.src = (skins[skinActual] && skins[skinActual].url) ? skins[skinActual].url : skins["dinoDefault"].url;
  }

  // ---------- DASH IMG ----------
  const dashImg = document.createElement("img");
  dashImg.src = "https://cdn-icons-png.flaticon.com/512/615/615567.png";
  Object.assign(dashImg.style, { position: "absolute", width: "40px", zIndex: 10000, display: "none" });
  document.body.appendChild(dashImg);

  // ---------- PUNTAJE DIV ----------
  const puntajeDiv = document.createElement("div");
  puntajeDiv.textContent = "Puntaje: " + puntaje;
  Object.assign(puntajeDiv.style, { position: "fixed", top: "10px", left: "10px", fontSize: "24px", fontWeight: "bold", color: "white", zIndex: 10001 });
  document.body.appendChild(puntajeDiv);

  // ---------- MENSAJE INICIAL ----------
  const textoCarga = document.createElement("div");
  textoCarga.textContent = "Dinosaurio Game Cargado Con Éxito";
  Object.assign(textoCarga.style, { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "22px", fontWeight: "700", background: "rgba(0,0,0,0.75)", color: "#fff", padding: "14px 22px", borderRadius: "10px", zIndex: 10005 });
  document.body.appendChild(textoCarga);
  setTimeout(() => textoCarga.remove(), 1500);

  // ---------- GUI ----------
  const ui = document.createElement("div");
  ui.innerHTML = `
    <div id="loginPanel" style="position:fixed;bottom:10px;right:10px;background:#222;color:#fff;padding:10px;border-radius:8px;z-index:10010;">
      <input id="email" type="email" placeholder="Correo" style="width:160px;margin:4px 0"><br>
      <input id="password" type="password" placeholder="Contraseña" style="width:160px;margin:4px 0"><br>
      <button id="btnRegister">Registrar</button>
      <button id="btnLogin">Login</button>
      <button id="btnForgot">Olvidé mi contraseña</button>
    </div>
    <div id="resetPanel" style="position:fixed;bottom:10px;right:10px;background:#222;color:#fff;padding:10px;border-radius:8px;z-index:10010;display:none;">
      <div style="margin-bottom:6px">📧 Ingresa tu correo y revisa el enlace enviado (spam también)</div>
      <input id="emailReset" type="email" placeholder="Correo" style="width:160px;margin:4px 0"><br>
      <button id="btnSendReset">Enviar enlace</button>
      <button id="btnBackLogin">Volver</button>
    </div>
    <div id="userPanel" style="position:fixed;bottom:10px;right:10px;background:#222;color:#fff;padding:10px;border-radius:8px;z-index:10010;display:none;">
      <div id="userInfo" style="margin-bottom:6px"></div>
      <button id="btnLogout">Logout</button>
    </div>
  `;
  document.body.appendChild(ui);

  const loginPanel = document.getElementById("loginPanel");
  const resetPanel = document.getElementById("resetPanel");
  const userPanel = document.getElementById("userPanel");
  const userInfo = document.getElementById("userInfo");

  // ---------- SKIN BUTTON ----------
  const skinButton = document.createElement("button");
  skinButton.textContent = "Skins";
  Object.assign(skinButton.style, { position: "fixed", top: "10px", right: "10px", zIndex: 10010, padding: "8px", background: "#222", color: "#fff", border: "none", borderRadius: "6px" });
  document.body.appendChild(skinButton);

  const skinMenu = document.createElement("div");
  Object.assign(skinMenu.style, { position: "fixed", top: "50px", right: "10px", background: "rgba(0,0,0,0.85)", color: "#fff", padding: "10px", borderRadius: "8px", zIndex: 10010, display: "none", maxWidth: "240px" });
  document.body.appendChild(skinMenu);

  function actualizarSkinMenu() {
    skinMenu.innerHTML = "";
    Object.keys(skins).forEach(key => {
      const s = skins[key];
      const container = document.createElement("div");
      container.style.display = "flex"; container.style.alignItems = "center"; container.style.margin = "6px 0";

      const thumb = document.createElement("img");
      thumb.src = s.url; thumb.alt = s.nombre;
      Object.assign(thumb.style, { width: "52px", height: "52px", objectFit: "cover", marginRight: "8px" });
      container.appendChild(thumb);

      const btn = document.createElement("button");
      btn.textContent = `${s.nombre} (${s.precio === 0 ? "Gratis" : s.precio + " pts"})`;
      btn.style.flex = "1";
      btn.onclick = async () => {
        if (puntaje >= s.precio) {
          skinActual = key;
          aplicarSkin();
          if (auth.currentUser) await guardarPuntaje();
          mostrarToast("Skin equipada: " + s.nombre);
        } else {
          mostrarToast("No tienes suficientes puntos");
        }
      };
      container.appendChild(btn);
      skinMenu.appendChild(container);
    });
  }
  actualizarSkinMenu();
  skinButton.addEventListener("click", () => skinMenu.style.display = (skinMenu.style.display === "none" ? "block" : "none"));

  // ---------- ADMIN PANEL ----------
  const adminPanel = document.createElement("div");
  Object.assign(adminPanel.style, { position: "fixed", bottom: "10px", left: "10px", zIndex: 10010, display: "flex", gap: "6px", alignItems: "center" });
  document.body.appendChild(adminPanel);

  const btnGlobal = document.createElement("button");
  btnGlobal.textContent = "Enviar mensaje global";
  const btnPuntos = document.createElement("button");
  btnPuntos.textContent = "Modificar puntos";
  const btnOnline = document.createElement("button");
  btnOnline.textContent = "Jugadores online";

  [btnGlobal, btnPuntos, btnOnline].forEach(b => b.style.padding = "6px 8px");
  adminPanel.appendChild(btnGlobal); adminPanel.appendChild(btnPuntos); adminPanel.appendChild(btnOnline);
  adminPanel.style.display = "none"; // solo admin

  // ---------- GLOBAL MESSAGES ----------
  btnGlobal.onclick = async () => {
    const texto = prompt("Mensaje global (visible a todos):");
    if (!texto) return;
    try {
      await addDoc(collection(db, "mensajesGlobales"), { mensaje: texto, remitente: "ADMIN", creado: serverTimestamp() });
      mostrarToast("Mensaje enviado");
    } catch (err) { console.error(err); mostrarToast("Error enviando mensaje"); }
  };

  // ---------- MODIFY POINTS ----------
  btnPuntos.onclick = async () => {
    const mail = prompt("Correo del jugador (exacto):");
    if (!mail) return;
    const valorStr = prompt("Cantidad (positivo para sumar, negativo para restar):");
    const valor = parseInt(valorStr, 10);
    if (isNaN(valor)) { mostrarToast("Valor inválido"); return; }
    try {
      const q = query(collection(db, "usuarios"));
      const snap = await getDocs(q);
      let found = false;
      for (const d of snap.docs) {
        const data = d.data();
        if (data && data.email === mail) {
          found = true;
          const newPts = (data.puntaje || 0) + valor;
          await setDoc(doc(db, "usuarios", d.id), { puntaje: newPts }, { merge: true });
          mostrarToast(`Puntos actualizados para ${mail}: ${newPts}`);
        }
      }
      if (!found) mostrarToast("Usuario no encontrado");
    } catch (err) { console.error("Error modificando puntos:", err); mostrarToast("Error modificando puntos"); }
  };

  // ---------- LIST PLAYERS ----------
  let modalJugadores = null;
  btnOnline.onclick = async () => {
    try {
      if (modalJugadores) modalJugadores.remove();
      const q = query(collection(db, "usuarios"), orderBy("email"));
      const snap = await getDocs(q);
      const lines = snap.docs.map(d => {
        const data = d.data();
        return `${data.email || "(sin email)"} — ${data.skin || "dinoDefault"} — ${data.puntaje || 0} pts`;
      });
      modalJugadores = document.createElement("div");
      Object.assign(modalJugadores.style, { position: "fixed", bottom: "60px", left: "10px", maxHeight: "300px", overflow: "auto", background: "rgba(0,0,0,0.85)", color: "#fff", padding: "8px 10px", borderRadius: "8px", zIndex: 10050 });
      modalJugadores.innerHTML = `<b>Usuarios (${lines.length}):</b><br>` + lines.join("<br>");
      document.body.appendChild(modalJugadores);
    } catch (err) { console.error("Error listando jugadores:", err); mostrarToast("Error listando jugadores"); }
  };

  // ---------- LISTEN GLOBAL MESSAGES ----------
  try {
    const q = query(collection(db, "mensajesGlobales"), orderBy("creado", "desc"));
    onSnapshot(q, (snap) => {
      snap.docChanges().forEach(change => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data && data.mensaje) {
            mostrarGlobal(data.remitente === "ADMIN" ? "ADMIN: " + data.mensaje : (data.remitente ? data.remitente + ": " : "") + data.mensaje);
          }
        }
      });
    });
  } catch (err) { console.warn("No se pudo escuchar mensajes globales:", err); }

  function mostrarGlobal(texto) {
    const box = document.createElement("div");
    box.textContent = texto;
    Object.assign(box.style, { position: "fixed", top: "80px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.85)", color: "#fff", padding: "10px 16px", borderRadius: "8px", zIndex: 10020, fontSize: "16px", boxShadow: "0 6px 18px rgba(0,0,0,0.45)" });
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 5000);
  }

  function mostrarToast(texto) {
    const t = document.createElement("div");
    t.textContent = texto;
    Object.assign(t.style, { position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.8)", color: "#fff", padding: "8px 12px", borderRadius: "6px", zIndex: 10030 });
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  }

  function toggleGui(ocultar) {
    const guiElems = [loginPanel, resetPanel, userPanel, skinButton, skinMenu, puntajeDiv, adminPanel, modalJugadores];
    guiElems.forEach(el => { if (!el) return; el.style.display = ocultar ? "none" : (el === skinMenu ? "none" : "block"); });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "+") { toggleGui(true); dino.style.display = "none"; }
    if (e.key === "ç") { toggleGui(false); dino.style.display = ""; }
  });

  // ---------- AUTH BUTTONS ----------
  document.getElementById("btnRegister").onclick = async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try { await createUserWithEmailAndPassword(auth, email, password); mostrarToast("Registrado"); }
    catch (err) { console.error(err); mostrarToast("Error registro"); }
  };

  document.getElementById("btnLogin").onclick = async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try { await signInWithEmailAndPassword(auth, email, password); mostrarToast("Sesión iniciada"); }
    catch (err) { console.error(err); mostrarToast("Error login"); }
  };

  document.getElementById("btnForgot").onclick = () => { loginPanel.style.display = "none"; resetPanel.style.display = "block"; };
  document.getElementById("btnBackLogin").onclick = () => { resetPanel.style.display = "none"; loginPanel.style.display = "block"; };

  document.getElementById("btnSendReset").onclick = async () => {
    const mail = document.getElementById("emailReset").value;
    if (!mail) { mostrarToast("Ingresa un correo"); return; }
    try { await sendPasswordResetEmail(auth, mail); mostrarToast("Enviado enlace (revisa spam)"); }
    catch (err) { console.error(err); mostrarToast("Error enviar enlace"); }
  };

  document.getElementById("btnLogout").onclick = async () => {
    try {
      await signOut(auth);
      mostrarToast("Sesión cerrada");
      elementosOcultos.forEach(el => { try { el.style.display = ""; } catch {} });
      elementosOcultos = []; elementosOcultosVisibles = [];
      puntaje = 0; puntajeDiv.textContent = "Puntaje: " + puntaje;
      skinActual = "dinoDefault"; aplicarSkin();
      loginPanel.style.display = "block"; userPanel.style.display = "none";
      adminPanel.style.display = "none";
      if (modalJugadores) modalJugadores.remove();
    } catch (err) { console.error("Error logout:", err); }
  };

  // ---------- AUTH STATE OBSERVER ----------
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      loginPanel.style.display = "none"; resetPanel.style.display = "none"; userPanel.style.display = "block";
      userInfo.textContent = user.email;
      adminPanel.style.display = (user.email === ADMIN_EMAIL) ? "flex" : "none";
      await cargarPuntaje(user.uid);
      puntajeDiv.textContent = "Puntaje: " + puntaje;
    } else {
      userPanel.style.display = "none"; loginPanel.style.display = "block";
      adminPanel.style.display = "none";
      elementosOcultos.forEach(el => { try { el.style.display = ""; } catch {} });
      elementosOcultos = []; elementosOcultosVisibles = [];
      puntaje = 0; puntajeDiv.textContent = "Puntaje: " + puntaje;
      skinActual = "dinoDefault"; aplicarSkin();
      if (modalJugadores) modalJugadores.remove();
    }
  });

  // ---------- GAME LOGIC ----------
  document.addEventListener("keydown", async (ev) => {
    const key = ev.key.toLowerCase();
    if (key === "+" || key === "ç") return;
    if (dino.style.display === "none") return;

    const top = parseInt(dino.style.top), left = parseInt(dino.style.left);
    if (key === "w") dino.style.top = (top - MOVE) + "px";
    if (key === "s") dino.style.top = (top + MOVE) + "px";
    if (key === "a") { dino.style.left = (left - MOVE) + "px"; dino.style.transform = "scaleX(-1)"; direccion = "izquierda"; }
    if (key === "d") { dino.style.left = (left + MOVE) + "px"; dino.style.transform = "scaleX(1)"; direccion = "derecha"; }

    // E disparo
    if (key === "e") {
      dino.style.transition = "transform 0.15s ease";
      dino.style.transform = (direccion === "derecha" ? "scale(0.5)" : "scale(-0.5,0.5)");
      setTimeout(() => { dino.style.transform = (direccion === "derecha" ? "scale(1)" : "scaleX(-1)"); }, 300);
      const rectDino = dino.getBoundingClientRect();
      const destruidos = destruirObjetos(rectDino);
      if (destruidos > 0) {
        puntaje += destruidos;
        puntajeDiv.textContent = "Puntaje: " + puntaje;
        if (auth.currentUser) await guardarPuntaje();
      }
    }

    // Q dash
    if (key === "q" && !dashCooldown) {
      dashCooldown = true;
      const steps = Math.round(DASH_DISTANCE / DASH_STEP); let count = 0;
      const topD = parseInt(dino.style.top), leftD = parseInt(dino.style.left);
      dashImg.style.display = "block"; dashImg.style.top = (topD + 30) + "px";
      dashImg.style.left = (direccion === "derecha" ? (leftD + 100) + "px" : (leftD - 50) + "px");
      dashImg.style.transform = (direccion === "derecha" ? "scaleX(1)" : "scaleX(-1)");
      const interval = setInterval(() => {
        count++;
        mover(dino, (direccion === "derecha" ? DASH_STEP : -DASH_STEP), 0);
        mover(dashImg, (direccion === "derecha" ? DASH_STEP : -DASH_STEP), 0);
        if (count >= steps) { clearInterval(interval); dashImg.style.display = "none"; setTimeout(() => dashCooldown = false, 1000); }
      }, 20);
    }

    // X super
    if (key === "x" && !superCooldown) {
      superCooldown = true;
      dino.style.transition = "transform 0.5s ease";
      dino.style.transform = (direccion === "derecha" ? `scale(${SUPER_SCALE})` : `scale(-${SUPER_SCALE},${SUPER_SCALE})`);
      setTimeout(async () => {
        const rectDino = dino.getBoundingClientRect();
        const d = destruirObjetos(rectDino);
        if (d > 0) {
          puntaje += d;
          puntajeDiv.textContent = "Puntaje: " + puntaje;
          if (auth.currentUser) await guardarPuntaje();
        }
        dino.style.transform = (direccion === "derecha" ? "scale(1)" : "scaleX(-1)");
        setTimeout(() => superCooldown = false, 10000);
      }, 500);
    }
  });

  aplicarSkin();
  puntajeDiv.textContent = "Puntaje: " + puntaje;
  mostrarToast("Juego cargado — usa WASD, E, Q, X. + oculta GUI, ç la muestra.");
})();
