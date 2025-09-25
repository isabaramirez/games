(() => {
  if (window.__gameLauncherActive) return;
  window.__gameLauncherActive = true;

  // Overlay
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.6)";
  overlay.style.zIndex = 2147483647;
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.fontFamily = "sans-serif";
  document.body.appendChild(overlay);

  const title = document.createElement("h2");
  title.textContent = "Game Launcher";
  title.style.color = "#fff";
  overlay.appendChild(title);

  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.gap = "20px";
  overlay.appendChild(container);

  // Definir juegos
  const games = [
    { 
      name: "Web Invaders", 
      url: "https://cdn.jsdelivr.net/gh/isabaramirez/games@main/webinvaders.js" 
    },
    { 
      name: "Dinosaur Game", 
      url: "https://cdn.jsdelivr.net/gh/isabaramirez/games@main/dinosaur.js" 
    }
  ];

  games.forEach(game => {
    const btn = document.createElement("button");
    btn.textContent = game.name;
    Object.assign(btn.style, {
      padding: "12px 20px",
      fontSize: "16px",
      borderRadius: "8px",
      cursor: "pointer",
      border: "none",
      background: "#fff"
    });
    container.appendChild(btn);

    btn.onclick = async () => {
      try {
        overlay.remove(); // Borra la GUI
        const module = await import(game.url);
        console.log(game.name + " cargado.");
      } catch (err) {
        console.error("❌ Error cargando el juego:", err);
        alert("Error cargando el juego: " + game.name);
      }
    };
  });
})();

