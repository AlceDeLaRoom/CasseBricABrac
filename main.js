const lifeTxt = document.querySelector('.life');
const resetBtn = document.querySelector('.reset');
const endGame = document.querySelector('.over');


const canvas = document.querySelector('canvas');
const ctx = canvas.getContext("2d");


const gWidth = canvas.width = 720;
const gHeight = canvas.height = 720;

function random(min, max) {
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num;
}


class GlobalElement{
    x;
    y;
    size;
    color;
    constructor(x, y, size, color){
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
    };

    draw(){
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.height);
    };

};

class PlayerElement extends GlobalElement{
    height = 12;
    velX = 0;
    topVel = 8;
    ready = false;
    constructor(){
        super(320, 665, 80, "white");
    };

    move(mouseX, border){//calculer la vitesse, la vélocité puis changer this.x
        const center = this.x + (this.size/2);
        const diff = mouseX - center;
        const newSpeed = (Math.abs(diff)>(this.topVel*10)) ?(this.topVel): (Math.abs(diff)/10);
        this.velX = diff>0 ? newSpeed : -newSpeed;
        this.x += this.velX
        if (this.x < border) {this.x = border};
        if (this.x > gWidth - this.size - border) {this.x = gWidth - this.size - border};
    };
};

class BrickElement extends GlobalElement{
    height = 30;
    width;
    constructor(x, y){
        const size = 50;
        const height = 30;
        const colorH = (x + y) * 20
        x = x * size + 60;
        y = y * height + 20;
        super(x, y, size, "");
        this.width = this.size;
        this.color = this.randomRGB(colorH);

    };

    randomRGB(h = random(0, 359), s = 100, l = 45) {
        return `hsl(${h}, ${s}%, ${l}%)`;
    }
};

class BallElement extends GlobalElement{
    velX = 0;
    velY = 0;
    velocity = 7;
    topVelX;
    start = false;
    angle = 0;
    constructor(){
        const size = 12;
        const x = game.player.x + game.player.size/2;
        const y = game.player.y - size;
        super(x, y, size, "red");
        this.topVelX = Math.cos(0.1) * this.velocity;
    };

    launch(){ //launch the ball

        this.angle = random(15, 165);
        
        this.velX = Math.cos(this.angle*Math.PI/180) * this.velocity;
        this.velY = -Math.sin(this.angle*Math.PI/180) * this.velocity;
        this.start = true;
    };

    reachBorder(border){
        if ((this.x < border + this.size) && (this.velX < 0)){this.velX = -this.velX}
        else if((this.x > gWidth - border - this.size) && this.velX > 0){this.velX = -this.velX}
        else if((this.y < border + this.size) && (this.velY < 0)){this.velY = -this.velY};
    };

    collidePlayer(){
        if(game.player.ready){
            if (this.collide(game.player)){
                game.player.ready = false;
                this.updateVel();/*changer l'angle en fonction de la vélocité du joueur*/ 
            };
        }else if(this.y < game.player.y - game.player.height)game.player.ready=true;
    };

    updateVel(){
        this.velX += game.player.velX / (game.player.topVel/this.topVelX) ;

        if (Math.abs(this.velX) > this.topVelX)this.velX = this.velX > 0? this.topVelX : -this.topVelX;
        this.velY = -Math.sqrt(this.velocity ** 2 - this.velX ** 2) 

    };

    collideBrick(brick){
        return this.collide(brick);
    };

    collide(item){
        
        const centerRectX = item.x + item.size/2;
        const centerRectY = item.y + item.height/2;
        const distX = Math.abs(this.x-centerRectX)
        const distY = Math.abs(this.y-centerRectY)
        
        const chevX = distX < this.size + item.size/2//si vrai ça se chevauche sur X 
        const chevY = distY < this.size + item.height/2
        if (!chevX || !chevY)return false;
        if (distX <= (item.size/2)) { 
            this.velY = -this.velY;
            return true; 
        };
        if (distY <= (item.height/2)) { 
            this.velX = -this.velX;
            return true; 
        };
        const cornerDist = (distX - item.size/2)**2 + (distY - item.height/2)**2;
        const cornerCollide = cornerDist <= (this.size**2);
        if (cornerCollide){
            this.velX = ((this.x-centerRectX) ^ (this.velX > 0))?-this.velX:this.velX;//gauche negatif droite positif
            this.velY = ((this.y-centerRectY) ^ (this.velY > 0))?-this.velY:this.velY;
        };
        return cornerCollide;
    };

    move(){
        if (this.start){
            this.x += this.velX;
            this.y += this.velY;
        }else{
            this.x = game.player.x + game.player.size/2;
        }
    };
    

    draw(){
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.fill();
    };
};

class Game{
    bricks = [];
    player = null;
    ball = null;
    life = 3;
    nbCol = 12;
    nbRow = 5;
    seconds = 0;
    minutes = 0;
    border = 10;
    mouseX = 0;
    onPlay = true;
    constructor(){
    };

    initGame(){
        lifeTxt.innerText = `Vie restante${ this.life<=1 ? '' : 's' }: ${ this.life }`;
        endGame.innerText = 'sal';
        canvas.style.cursor = 'none';
        this.initPlayer();
        this.initBrick();
        this.newBall();
        console.log("jeu initialisé!")
    };

    eventMove(e){
        game.mouseX = e.clientX - canvas.getBoundingClientRect().left
    };

    eventClick(){
        console.log("clic");
        game.ball.launch();
        canvas.removeEventListener("click", game.eventClick);
    };

    initBrick(){
        for (let i = 0; i < this.nbCol; i++){
            for (let j = 0; j < this.nbRow; j++){
                const newBrick = new BrickElement(i, j);
                this.bricks.push(newBrick);
            }
        }
    };

    initPlayer(){
        this.player = new PlayerElement();
    };

    newBall(){
        canvas.addEventListener("click", this.eventClick);
        this.ball = new BallElement();
    };

    gameLoop(){
        this.updateElement();
        this.drawElement();
    };

    updateElement(){
        this.player.move(this.mouseX, this.border);
        this.ball.move();
        if(this.ball.y > gHeight-this.border-this.ball.size){
            this.life--;
            lifeTxt.innerText = `Vie restante${ this.life<=1 ? '' : 's' }: ${ this.life }`;
            console.log(this.life);
            if (this.life>0){
                this.newBall()
            }else{
                game.over();
            };
        }else{
            this.ball.reachBorder(this.border);
            this.ball.collidePlayer(this.player);
            for (const [i, brick] of this.bricks.entries()){
                if (this.ball.collideBrick(brick)){
                    this.bricks.splice(i,1);
                    break;
                };
            };
            if (game.bricks.length == 0){
                game.over();
            };
        }
    };

    drawPlayground(){
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, gWidth, gHeight);

        ctx.fillStyle = 'black';
        ctx.fillRect(this.border, this.border, gWidth - this.border*2, gHeight - this.border*2);
    };

    drawPlayer(){
        this.player.draw();
    };

    drawBall(){
        this.ball.draw();
    };

    drawBrick(){
        for(const brick of this.bricks){
            brick.draw();
        }
    };

    drawElement(){
        this.drawPlayground();
        this.drawPlayer();
        this.drawBall();
        this.drawBrick();
    };

    over(){
        this.onPlay = false;
        canvas.style.cursor = "auto";
        if (this.life <= 0){
            endGame.innerText = "Perdu!!!";
        } else{
            endGame.innerText = "Bravo!!!";
        }
    };

};

function loop(){
    if(game.onPlay)game.gameLoop();
    requestAnimationFrame(loop);
}

function reset(){
    game = new Game();
    game.initGame();
};

resetBtn.addEventListener("click", reset)

let game = new Game();

canvas.addEventListener("mousemove", (e) => game.eventMove(e));

game.initGame();
loop();
