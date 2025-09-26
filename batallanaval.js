(function(){
    const tamaño = 7;
    const barcos = [
        {nombre:"Pequeño", tamaño:1},
        {nombre:"Mediano1", tamaño:2},
        {nombre:"Mediano2", tamaño:2},
        {nombre:"Grande", tamaño:3}
    ];
    const letras = ["A","B","C","D","E","F","G"];

    let tableroJugador, tableroBot;
    let colocacionActiva = true;
    let juegoActivo = true;
    let barcoActualIndex = 0;
    let orientacion = "H";
    let celPreview = [];
    let botPendientes = [];
    let botHistorial = [];

    let winsJugador = 0;
    let winsBot = 0;

    let container, infoDiv, msgDiv, scoreDiv;

    function inicializarTableros(){
        tableroJugador = Array.from({length:tamaño},()=>Array(tamaño).fill("agua"));
        tableroBot = Array.from({length:tamaño},()=>Array(tamaño).fill("agua"));
        colocacionActiva = true;
        juegoActivo = true;
        barcoActualIndex = 0;
        celPreview = [];
        botPendientes = [];
        botHistorial = [];

        if(container) container.remove();
        if(infoDiv) infoDiv.remove();

        colocarBarcosBot();
        crearUI();
        console.log("Partida iniciada — coloca tus barcos y juega.");
    }

    function colocarBarcosBot(){
        barcos.forEach(barco=>{
            let colocado = false;
            while(!colocado){
                let f = Math.floor(Math.random()*tamaño);
                let c = Math.floor(Math.random()*tamaño);
                let orient = Math.random()<0.5 ? "H" : "V";
                if(puedeColocar(tableroBot, f, c, barco.tamaño, orient)){
                    colocar(tableroBot, f, c, barco.tamaño, orient);
                    colocado = true;
                }
            }
        });
    }

    function puedeColocar(tablero,f,c,longitud,orient){
        if(orient==="H"){
            if(c+longitud>tamaño) return false;
            for(let i=0;i<longitud;i++) if(tablero[f][c+i]!=="agua") return false;
        } else {
            if(f+longitud>tamaño) return false;
            for(let i=0;i<longitud;i++) if(tablero[f+i][c]!=="agua") return false;
        }
        return true;
    }

    function colocar(tablero,f,c,longitud,orient){
        for(let i=0;i<longitud;i++){
            if(orient==="H") tablero[f][c+i]="barco";
            else tablero[f+i][c]="barco";
        }
    }

    function crearUI(){
        document.onkeydown = null;

        container = document.createElement("div");
        container.style.position = "fixed";
        container.style.top = "60px";
        container.style.left = "20px";
        container.style.backgroundColor = "transparent";
        container.style.padding = "10px";
        container.style.zIndex = "9999";
        container.style.display = "flex";
        container.style.gap = "30px";
        container.style.fontFamily = "sans-serif";

        infoDiv = document.createElement("div");
        infoDiv.style.position = "fixed";
        infoDiv.style.top = "0";
        infoDiv.style.left = "20px";
        infoDiv.style.backgroundColor = "#fff";
        infoDiv.style.color = "#000";
        infoDiv.style.padding = "6px 10px";
        infoDiv.style.border = "1px solid #333";
        infoDiv.style.borderRadius = "6px";
        infoDiv.style.fontWeight = "bold";
        infoDiv.style.zIndex = "10000";
        infoDiv.style.fontFamily = "sans-serif";
        infoDiv.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
        infoDiv.style.display = "flex";
        infoDiv.style.alignItems = "center";
        infoDiv.style.gap = "8px";

        const gifImg = document.createElement("img");
        gifImg.src = "https://i.pinimg.com/originals/0e/1e/39/0e1e39018a80b4900c6dd149ca3ae45c.gif";
        gifImg.style.width = "40px";
        gifImg.style.height = "40px";
        gifImg.style.display = "inline-block";

        const msgContainer = document.createElement("div");
        msgDiv = msgContainer;
        scoreDiv = document.createElement("div");
        scoreDiv.style.marginTop = "4px";

        infoDiv.appendChild(gifImg);
        infoDiv.appendChild(msgDiv);
        infoDiv.appendChild(scoreDiv);
        document.body.appendChild(infoDiv);

        function actualizarPuntos(){ scoreDiv.textContent = `Bot: ${winsBot} | Player: ${winsJugador}`; }
        function mensaje(text){ msgDiv.textContent = text; }

        function crearTableroHTML(tablero, esJugador){
            let tabla = document.createElement("table");
            tabla.style.borderCollapse="collapse";

            let filaNum = document.createElement("tr");
            let esquina = document.createElement("td"); esquina.style.width="20px"; filaNum.appendChild(esquina);
            for(let j=1;j<=tamaño;j++){
                let td = document.createElement("td"); td.textContent=j;
                td.style.textAlign="center"; td.style.width="30px"; td.style.height="30px"; td.style.fontWeight="bold";
                filaNum.appendChild(td);
            }
            tabla.appendChild(filaNum);

            for(let i=0;i<tamaño;i++){
                let fila = document.createElement("tr");
                let tdLetra = document.createElement("td");
                tdLetra.textContent = letras[i]; tdLetra.style.fontWeight="bold";
                fila.appendChild(tdLetra);

                for(let j=0;j<tamaño;j++){
                    let celda = document.createElement("td");
                    celda.style.width="30px"; celda.style.height="30px";
                    celda.style.border="1px solid #333";
                    celda.style.textAlign="center"; celda.style.verticalAlign="middle";
                    celda.style.fontSize="16px";
                    celda.style.cursor = esJugador ? "pointer" : "default";
                    actualizarCelda(celda, tablero[i][j], esJugador);

                    if(esJugador){
                        celda.addEventListener("mouseover", ()=>{ if(!colocacionActiva) return; limpiarPreview(); let barco = barcos[barcoActualIndex]; for(let k=0;k<barco.tamaño;k++){ let x=i+(orientacion==="V"?k:0); let y=j+(orientacion==="H"?k:0); if(x<tamaño && y<tamaño){ celPreview.push([x,y, tablero[x][y]==="agua"]); actualizarCeldaPreview(x,y, tablero[x][y]==="agua"); } } });
                        celda.addEventListener("mouseout", ()=>{ limpiarPreview(); actualizarTabla(tabla, tableroJugador,true); });
                        celda.addEventListener("click", ()=>{
                            if(!juegoActivo) return;
                            if(colocacionActiva){
                                let barco = barcos[barcoActualIndex];
                                let f=i,c0=j;
                                if(puedeColocar(tableroJugador,f,c0,barco.tamaño,orientacion)){
                                    colocar(tableroJugador,f,c0,barco.tamaño,orientacion);
                                    actualizarTabla(tabla,tableroJugador,true);
                                    console.log(`Jugador colocó ${barco.nombre} en ${letras[f]}${c0+1}`);
                                    barcoActualIndex++;
                                    if(barcoActualIndex>=barcos.length){
                                        colocacionActiva=false;
                                        mensaje("Todos los barcos colocados. Haz click en el tablero del bot para atacar.");
                                    } else {
                                        mensaje(`Coloca barco ${barcos[barcoActualIndex].nombre} (tamaño ${barcos[barcoActualIndex].tamaño}). Orientación: ${orientacion}`);
                                    }
                                } else { mensaje("No se puede colocar aquí."); }
                            }
                        });
                    } else {
                        celda.addEventListener("click", ()=> atacarBot(i,j));
                    }
                    fila.appendChild(celda);
                }
                tabla.appendChild(fila);
            }
            return tabla;
        }

        function actualizarCelda(celda, valor, esJugador){
            celda.textContent="";
            if(valor==="agua") celda.style.backgroundColor="#87cefa";
            else if(valor==="barco") celda.style.backgroundColor= esJugador ? "#555" : "#87cefa";
            else if(valor==="tocado"){ celda.style.backgroundColor="red"; celda.style.color="white"; celda.textContent="X";}
            else if(valor==="fallo"){ celda.style.backgroundColor="#add8e6"; celda.textContent="•";}
        }

        function actualizarCeldaPreview(f,c, posible){
            let celda = container.querySelectorAll("table")[0].rows[f+1].cells[c+1];
            celda.style.backgroundColor = posible ? "lightgreen" : "red";
        }

        function limpiarPreview(){ celPreview.forEach(([x,y])=>{ let celda = container.querySelectorAll("table")[0].rows[x+1].cells[y+1]; actualizarCelda(celda, tableroJugador[x][y], true); }); celPreview=[]; }

        function actualizarTabla(tabla, tablero, esJugador){ for(let i=0;i<tamaño;i++){ for(let j=0;j<tamaño;j++){ actualizarCelda(tabla.rows[i+1].cells[j+1], tablero[i][j], esJugador); } } }

        function barcosRestantes(tablero){ return tablero.flat().filter(c=>c==="barco").length; }

        let divJugador=document.createElement("div"); let hJ=document.createElement("h3"); hJ.textContent="Tu tablero"; divJugador.appendChild(hJ); let tablaJugador = crearTableroHTML(tableroJugador,true); divJugador.appendChild(tablaJugador);

        let divBot=document.createElement("div"); let hB=document.createElement("h3"); hB.textContent="Tablero del Bot"; divBot.appendChild(hB); let tablaBot = crearTableroHTML(tableroBot,false); divBot.appendChild(tablaBot);

        container.appendChild(divJugador); container.appendChild(divBot); document.body.appendChild(container);

        mensaje(`Coloca barco ${barcos[barcoActualIndex].nombre} (tamaño ${barcos[barcoActualIndex].tamaño}). Orientación: ${orientacion}`);
        actualizarPuntos();

        function atacarBot(f,c){
            if(!juegoActivo){ mensaje("El juego está oculto."); return; }
            if(colocacionActiva){ mensaje("Primero coloca todos tus barcos."); return; }
            if(tableroBot[f][c]==="tocado" || tableroBot[f][c]==="fallo") return;
            if(tableroBot[f][c]==="barco"){ tableroBot[f][c]="tocado"; console.log(`Jugador ataca Bot: ${letras[f]}${c+1} - Tocado`);}
            else { tableroBot[f][c]="fallo"; console.log(`Jugador ataca Bot: ${letras[f]}${c+1} - Agua`);}
            actualizarTabla(tablaBot, tableroBot,false);

            if(barcosRestantes(tableroBot)===0){
                winsJugador++; actualizarPuntos();
                mensaje("¡Ganaste la ronda! Reiniciando...");
                juegoActivo=false;
                setTimeout(inicializarTableros,1500);
                return;
            }
            setTimeout(turnoBot,300);
        }

        function turnoBot(){
            if(!juegoActivo) return;
            let f,c;
            if(botPendientes.length>0) [f,c]=botPendientes.shift();
            else {
                do{ f=Math.floor(Math.random()*tamaño); c=Math.floor(Math.random()*tamaño);}
                while(botHistorial.includes(f+","+c));
            }
            botHistorial.push(f+","+c);
            if(tableroJugador[f][c]==="barco"){
                tableroJugador[f][c]="tocado";
                mensaje(`Bot atacó ${letras[f]}${c+1}: ¡Tocado!`);
                console.log(`Bot ataca: ${letras[f]}${c+1} - Tocado`);
            } else {
                tableroJugador[f][c]="fallo";
                mensaje(`Bot atacó ${letras[f]}${c+1}: Agua...`);
                console.log(`Bot ataca: ${letras[f]}${c+1} - Agua`);
            }
            actualizarTabla(tablaJugador, tableroJugador,true);

            if(barcosRestantes(tableroJugador)===0){
                winsBot++; actualizarPuntos();
                mensaje("¡Perdiste la ronda! Reiniciando...");
                juegoActivo=false;
                setTimeout(inicializarTableros,1500);
            }
        }

        document.onkeydown=function(e){
            if(e.key==="+"){ container.style.display="none"; infoDiv.style.display="none"; juegoActivo=false; console.log("Juego oculto"); }
            else if(e.key==="}" || e.key==="ç"){ container.style.display="flex"; infoDiv.style.display="block"; juegoActivo=true; console.log("Juego visible"); }
            else if(e.key.toLowerCase()==="r"){ orientacion = (orientacion==="H") ? "V" : "H"; mensaje(`Orientación cambiada a ${orientacion}`); }
        };
    }

    inicializarTableros();
})();
