(function() {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = 9999;
    document.body.appendChild(container);

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    canvas.style.border = '2px solid white';
    canvas.style.backgroundColor = 'transparent';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const headGif = document.createElement('img');
    headGif.src = 'https://i.pinimg.com/originals/0e/1e/39/0e1e39018a80b4900c6dd149ca3ae45c.gif';
    headGif.style.position = 'absolute';
    headGif.style.display = 'none';
    container.appendChild(headGif);

    const difficulties = {
        'Fácil': {size: 25, speed: 5, apples: 3 + Math.floor(Math.random()*2)},
        'Normal': {size: 15, speed: 5, apples: 2},
        'Difícil': {size: 10, speed: 5, apples: 1}
    };

    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '10px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.gap = '10px';
    container.appendChild(buttonContainer);

    const scoreDiv = document.createElement('div');
    scoreDiv.style.color = 'black';
    scoreDiv.style.backgroundColor = 'white';
    scoreDiv.style.border = '2px solid black';
    scoreDiv.style.padding = '5px 10px';
    scoreDiv.style.fontSize = '16px';
    scoreDiv.style.borderRadius = '5px';
    scoreDiv.style.fontFamily = 'Arial, sans-serif';
    scoreDiv.style.userSelect = 'none';

    let cellSize, snake, direction, apples, score, gameInterval, baseSpeed;
    let paused = false;
    let gameStarted = false;
    let highScore = localStorage.getItem('snakeHighScore') ? parseInt(localStorage.getItem('snakeHighScore')) : 0;

    function initGame(diffName) {
        const diff = difficulties[diffName];
        cellSize = diff.size;
        baseSpeed = diff.speed;
        headGif.style.width = cellSize + 'px';
        headGif.style.height = cellSize + 'px';
        headGif.style.display = 'block';

        snake = [{x:5, y:5}];
        direction = 'RIGHT';
        score = 0;
        apples = [];
        for(let i=0;i<diff.apples;i++) placeApple();
        buttonContainer.style.display = 'none';
        paused = false;
        gameStarted = true;
        updateScore();
        if(gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, 100);
    }

    function placeApple() {
        let newApple;
        do {
            newApple = {
                x: Math.floor(Math.random() * (canvas.width / cellSize)),
                y: Math.floor(Math.random() * (canvas.height / cellSize))
            };
        } while(snake.some(s=>s.x===newApple.x && s.y===newApple.y) || apples.some(a=>a.x===newApple.x && a.y===newApple.y));
        apples.push(newApple);
    }

    function changeDirection(e) {
        const key = e.key.toLowerCase();

        if(!gameStarted && ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){
            initGame('Normal');
        }

        if(key==='+' && !paused){ 
            paused = true;
            canvas.style.display='none';
            headGif.style.display='none';
            scoreDiv.style.display='none';
            buttonContainer.style.display='none';
            return;
        }
        if((key === '}' || key === 'ç') && paused){ 
            canvas.style.display='block';
            headGif.style.display='block';
            scoreDiv.style.display='block';
            paused = false;
            clearInterval(gameInterval);
            setTimeout(()=>{ gameInterval = setInterval(gameLoop,100); },2000);
            return;
        }

        if((key === 'arrowup'||key==='w') && direction!=='DOWN') direction='UP';
        if((key === 'arrowdown'||key==='s') && direction!=='UP') direction='DOWN';
        if((key === 'arrowleft'||key==='a') && direction!=='RIGHT') direction='LEFT';
        if((key === 'arrowright'||key==='d') && direction!=='LEFT') direction='RIGHT';
    }

    function gameLoop() {
        if(paused) return;

        let head = {...snake[0]};
        if(direction==='UP') head.y--;
        if(direction==='DOWN') head.y++;
        if(direction==='LEFT') head.x--;
        if(direction==='RIGHT') head.x++;

        const maxCells = (canvas.width / cellSize) * (canvas.height / cellSize);

        if(head.x<0 || head.x>=canvas.width/cellSize || head.y<0 || head.y>=canvas.height/cellSize || snake.some(s=>s.x===head.x && s.y===head.y)) {
            clearInterval(gameInterval);
            if(score > highScore){
                highScore = score;
                localStorage.setItem('snakeHighScore', highScore);
            }
            scoreDiv.textContent = `¡Perdiste! Puntaje: ${score} | Mayor: ${highScore}`;
            buttonContainer.style.display='flex';
            gameStarted = false;
            return;
        }

        snake.unshift(head);

        let ateApple = false;
        for(let i=apples.length-1;i>=0;i--){
            if(head.x===apples[i].x && head.y===apples[i].y){
                score++;
                apples.splice(i,1);
                placeApple();
                ateApple = true;
            }
        }

        if(!ateApple){
            snake.pop();
        }

        if(snake.length >= maxCells){
            clearInterval(gameInterval);
            scoreDiv.textContent = `¡GANASTE! Puntaje: ${score}`;
            buttonContainer.style.display='flex';
            gameStarted = false;
            return;
        }

        draw();
        updateScore();
    }

    function draw() {
        for(let y=0; y<canvas.height/cellSize; y++){
            for(let x=0; x<canvas.width/cellSize; x++){
                ctx.fillStyle = ((x+y)%2===0) ? 'rgba(200,200,200,0.15)' : 'rgba(150,150,150,0.15)';
                ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
            }
        }

        ctx.fillStyle='red';
        apples.forEach(a=>{
            ctx.fillRect(a.x*cellSize, a.y*cellSize, cellSize, cellSize);
        });

        snake.forEach((part,index)=>{
            if(index>0){
                let fillColor;
                if(index <= 3){
                    const ratio = index / 3;
                    const shade = Math.floor(255 - 155 * ratio);
                    fillColor = `rgb(${shade},${shade},${shade})`;
                } else {
                    fillColor = 'rgb(100,100,100)';
                }
                ctx.fillStyle = fillColor;
                ctx.fillRect(part.x*cellSize, part.y*cellSize, cellSize, cellSize);
                ctx.strokeStyle = 'black';
                ctx.strokeRect(part.x*cellSize, part.y*cellSize, cellSize, cellSize);
            }
        });

        const head = snake[0];
        headGif.style.left = (canvas.offsetLeft + head.x*cellSize) + 'px';
        headGif.style.top = (canvas.offsetTop + head.y*cellSize) + 'px';
        let angle = 0;
        if(direction==='UP') angle=-90;
        if(direction==='DOWN') angle=90;
        if(direction==='LEFT') angle=180;
        if(direction==='RIGHT') angle=0;
        headGif.style.transform = `rotate(${angle}deg)`;
    }

    function updateScore() {
        scoreDiv.textContent = `Puntaje: ${score} | Mayor: ${highScore}`;
    }

    Object.keys(difficulties).forEach(diff=>{
        const btn=document.createElement('button');
        btn.textContent=diff;
        btn.style.margin='5px';
        btn.style.padding='10px 20px';
        btn.style.fontSize='16px';
        btn.style.cursor='pointer';
        btn.onclick=()=>initGame(diff);
        buttonContainer.appendChild(btn);
        if(diff==='Difícil'){
            buttonContainer.appendChild(scoreDiv);
        }
    });

    document.addEventListener('keydown', changeDirection);
})();
