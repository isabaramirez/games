(async () => {
  if (window.__gameLauncherActive) return;
  window.__gameLauncherActive = true;

  // --- Crear overlay del launcher ---
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    top: "0",
    left: "0",
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
  title.style.color = "#000"; // texto negro
  overlay.appendChild(title);

  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.gap = "20px";
  overlay.appendChild(container);

  // --- Juegos ---
  const games = [
    { name: "Web Invaders", url: "https://cdn.jsdelivr.net/gh/isabaramirez/games@main/webinvaders.js" },
    { name: "Dinosaur Game", url: "https://raw.githubusercontent.com/isabaramirez/games/refs/heads/main/dinosaurgame.js" }
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
      background: "#fff",
      color: "#000"
    });
    container.appendChild(btn);

    btn.onclick = async () => {
      if (!game.url.includes("cdn.jsdelivr")) {
        alert("Para cargar el Dinosaurio ve a:\n" + game.url);
        console.log("Dinosaur Game URL:", game.url);
        return;
      }
      try {
        overlay.remove();
        console.log("Cargando " + game.name);
        await import(game.url);
        console.log(game.name + " cargado");
      } catch (err) {
        console.error("Error cargando el juego:", err);
        alert("Error cargando el juego: " + game.name);
      }
    };
  });
})();
