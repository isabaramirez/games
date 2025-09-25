// gameLauncher.js
(() => {
  if (window.__gameLauncherActive) return;
  window.__gameLauncherActive = true;

  // Overlay
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.6)",
    zIndex: 2147483647,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "sans-serif"
  });
  document.body.appendChild(overlay);

  const title = document.createElement("h2");
  title.textContent = "Game Launcher";
  title.style.color = "#fff";
  overlay.appendChild(title);

  const container = document.createElement("div");
  Object.assign(container.style, {
    display: "flex",
    gap: "20px"
  });
  overlay.appendChild(container);

  // Definir juegos
  const games = [
    { 
      name: "Web Invaders", 
      url: "https://cdn.jsdelivr.net/gh/isabaramirez/games@main/webinvaders.js" 
    },
    { 
      name: "Dinosaur Game", 
      url: "https://cdn.jsdelivr.net/gh/isabaramirez/games@main/dinosaurgame.js" 
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
        if (module.default) {
          await module.default(); // Llama a la función principal si existe
        }
        console.log(game.name + " cargado.");
      } catch (err) {
        console.error("❌ Error cargando el juego:", err);
        alert("Error cargando el juego: " + game.name);
      }
    };
  });
})();

