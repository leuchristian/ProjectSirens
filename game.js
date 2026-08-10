"use strict";

/* =========================================================
   PROJECT SIRENS
   =========================================================
   640 x 360 top-down RPG
   ========================================================= */


/* =========================================================
   CANVAS
   ========================================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 640;
canvas.height = 360;

canvas.style.width = "min(960px, 92vw)";
canvas.style.height = "auto";

ctx.imageSmoothingEnabled = false;

const WIDTH = 640;
const HEIGHT = 360;


/* =========================================================
   ASSETS
   ========================================================= */

const sceneryImage = new Image();
const playerImage = new Image();

sceneryImage.src =
    "assets/scenery/project_sirens_scenery_transparent.png";

playerImage.src =
    "assets/characters/player/player_sprite.png";


let sceneryReady = false;
let playerReady = false;


sceneryImage.onload = function () {

    sceneryReady = true;

    console.log(
        "Scenery loaded:",
        sceneryImage.naturalWidth,
        sceneryImage.naturalHeight
    );

};


sceneryImage.onerror = function () {

    console.error(
        "ERROR: Could not load scenery:",
        sceneryImage.src
    );

};


playerImage.onload = function () {

    playerReady = true;

    console.log(
        "Player sprite loaded:",
        playerImage.naturalWidth,
        playerImage.naturalHeight
    );

};


playerImage.onerror = function () {

    console.error(
        "ERROR: Could not load player sprite:",
        playerImage.src
    );

};


/* =========================================================
   INPUT
   ========================================================= */

const keys = {};


window.addEventListener("keydown", function (event) {

    const key =
        event.key.toLowerCase();

    keys[key] = true;


    if (
        key === "arrowup" ||
        key === "arrowdown" ||
        key === "arrowleft" ||
        key === "arrowright"
    ) {

        event.preventDefault();

    }


    if (key === "e") {

        interact();

    }

});


window.addEventListener("keyup", function (event) {

    keys[event.key.toLowerCase()] = false;

});


/* =========================================================
   PLAYER
   ========================================================= */

const player = {

    /*
       Start on the stairs directly below the fountain.
    */

    x: 320,
    y: 184,

    /*
       Small collision box.
       The visible sprite is larger than this.
    */

    width: 10,
    height: 8,

    speed: 1.5,

    facing: "down",

    moving: false,

    frame: 0,

    animationTimer: 0

};


/* =========================================================
   PLAYER SPRITESHEET
   ========================================================= */

/*
   The character sheet is arranged in 64 x 64 cells.

   First four columns represent:

       0 = down
       1 = left
       2 = right
       3 = up

   Additional rows are used for walking animation.
*/

const SPRITE_SIZE = 64;


/*
   Direction columns.
*/

const directionColumn = {

    down: 0,
    left: 1,
    right: 2,
    up: 3

};


/* =========================================================
   WORLD LIMITS
   ========================================================= */

const world = {

    left: 30,
    right: 610,
    top: 18,
    bottom: 345

};


/* =========================================================
   COLLISION ZONES
   ========================================================= */

/*
   BACK WALL / WINDOWS
   -------------------
   The player can walk in the space between the back wall
   and the fountain.

   They simply cannot walk INTO the back wall itself.
*/

const backWall = {

    x: 50,
    y: 18,
    w: 540,
    h: 38

};


/*
   FOUNTAIN
   --------
   The fountain itself is solid.

   The important part is that this does NOT block the entire
   area behind the fountain.
*/

const fountainCollision = {

    x: 246,
    y: 108,
    w: 148,
    h: 58

};


/*
   UPPER STAIR / LEDGE
   -------------------
   This blocks the player from walking through the large
   staircase rather than treating the entire scenery as
   solid.
*/

const upperStairs = {

    x: 50,
    y: 176,
    w: 540,
    h: 18

};


/*
   LOWER LEDGE
*/

const lowerLedge = {

    x: 50,
    y: 270,
    w: 540,
    h: 15

};


/*
   LEFT AND RIGHT OUTER WALLS
*/

const sideWalls = [

    {
        x: 30,
        y: 18,
        w: 20,
        h: 327
    },

    {
        x: 590,
        y: 18,
        w: 20,
        h: 327
    }

];


/* =========================================================
   FOUNTAIN INTERACTION
   ========================================================= */

const fountain = {

    x: 320,
    y: 135,

    interactionRadius: 58,

    interactMessage:
        "The fountain water is strangely calming."

};


/* =========================================================
   MESSAGE SYSTEM
   ========================================================= */

let message = "";
let messageTimer = 0;


function showMessage(text) {

    message = text;

    messageTimer = 180;

}


/* =========================================================
   RECTANGLE COLLISION
   ========================================================= */

function rectanglesOverlap(a, b) {

    return (

        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y

    );

}


/* =========================================================
   PLAYER COLLISION
   ========================================================= */

function playerCollides(x, y) {

    const box = {

        x:
            x -
            player.width / 2,

        y:
            y -
            player.height / 2,

        w:
            player.width,

        h:
            player.height

    };


    /*
       Outer boundaries.
    */

    if (
        box.x < world.left ||
        box.x + box.w > world.right ||
        box.y < world.top ||
        box.y + box.h > world.bottom
    ) {

        return true;

    }


    /*
       Side walls.
    */

    for (const wall of sideWalls) {

        if (
            rectanglesOverlap(
                box,
                wall
            )
        ) {

            return true;

        }

    }


    /*
       Back wall.
    */

    if (
        rectanglesOverlap(
            box,
            backWall
        )
    ) {

        return true;

    }


    /*
       Fountain.
    */

    if (
        rectanglesOverlap(
            box,
            fountainCollision
        )
    ) {

        return true;

    }


    /*
       Upper staircase.
    */

    if (
        rectanglesOverlap(
            box,
            upperStairs
        )
    ) {

        return true;

    }


    /*
       Lower ledge.
    */

    if (
        rectanglesOverlap(
            box,
            lowerLedge
        )
    ) {

        return true;

    }


    return false;

}


/* =========================================================
   MOVEMENT
   ========================================================= */

function updatePlayer() {

    let dx = 0;
    let dy = 0;


    if (
        keys["w"] ||
        keys["arrowup"]
    ) {

        dy -= 1;

        player.facing = "up";

    }


    if (
        keys["s"] ||
        keys["arrowdown"]
    ) {

        dy += 1;

        player.facing = "down";

    }


    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {

        dx -= 1;

        player.facing = "left";

    }


    if (
        keys["d"] ||
        keys["arrowright"]
    ) {

        dx += 1;

        player.facing = "right";

    }


    /*
       Normalize diagonal movement.
    */

    if (
        dx !== 0 &&
        dy !== 0
    ) {

        dx *= 0.7071;
        dy *= 0.7071;

    }


    player.moving =
        dx !== 0 ||
        dy !== 0;


    /*
       Walking animation.
    */

    if (player.moving) {

        player.animationTimer++;


        if (
            player.animationTimer >= 8
        ) {

            player.animationTimer = 0;

            player.frame++;

            /*
               Three animation frames.
            */

            if (player.frame > 2) {

                player.frame = 0;

            }

        }

    } else {

        player.frame = 0;

        player.animationTimer = 0;

    }


    /*
       Calculate new position.
    */

    const newX =
        player.x +
        dx * player.speed;

    const newY =
        player.y +
        dy * player.speed;


    /*
       Horizontal movement.
    */

    if (
        !playerCollides(
            newX,
            player.y
        )
    ) {

        player.x = newX;

    }


    /*
       Vertical movement.
    */

    if (
        !playerCollides(
            player.x,
            newY
        )
    ) {

        player.y = newY;

    }

}


/* =========================================================
   SAVE
   ========================================================= */

function saveGame() {

    const saveData = {

        x: player.x,
        y: player.y

    };


    localStorage.setItem(

        "projectSirensSave",

        JSON.stringify(saveData)

    );

}


/* =========================================================
   LOAD
   ========================================================= */

function loadGame() {

    const saved =
        localStorage.getItem(
            "projectSirensSave"
        );


    if (!saved) {

        return;

    }


    try {

        const data =
            JSON.parse(saved);


        if (
            typeof data.x === "number" &&
            typeof data.y === "number"
        ) {

            player.x = data.x;
            player.y = data.y;

        }

    } catch (error) {

        console.error(
            "Could not load Project Sirens save.",
            error
        );

    }

}


/* =========================================================
   FOUNTAIN INTERACTION
   ========================================================= */

function nearFountain() {

    const distance =
        Math.hypot(

            player.x -
                fountain.x,

            player.y -
                fountain.y

        );


    return (
        distance <
        fountain.interactionRadius
    );

}


function interact() {

    if (!nearFountain()) {

        return;

    }


    showMessage(
        fountain.interactMessage
    );


    saveGame();

}


/* =========================================================
   DRAW SCENERY
   ========================================================= */

function drawScenery() {

    ctx.clearRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    if (!sceneryReady) {

        ctx.fillStyle =
            "#202026";

        ctx.fillRect(
            0,
            0,
            WIDTH,
            HEIGHT
        );

        return;

    }


    /*
       Fit the scenery to the entire 640 x 360 canvas.
    */

    ctx.drawImage(

        sceneryImage,

        0,
        0,
        sceneryImage.naturalWidth,
        sceneryImage.naturalHeight,

        0,
        0,
        WIDTH,
        HEIGHT

    );

}


/* =========================================================
   DRAW PLAYER
   ========================================================= */

function drawPlayer() {

    /*
       MOST IMPORTANT PART OF THIS REVISION:

       Never draw the old pink square.

       If the player image is not loaded yet, we simply
       wait for it.
    */

    if (!playerReady) {

        return;

    }


    /*
       Select the direction column.
    */

    const column =
        directionColumn[player.facing];


    /*
       Select animation row.

       Frame 0 = standing
       Frame 1 = walking
       Frame 2 = walking
    */

    const row =
        player.frame;


    const sourceX =
        column *
        SPRITE_SIZE;

    const sourceY =
        row *
        SPRITE_SIZE;


    /*
       Visible character size.

       The collision box remains much smaller.
    */

    const drawWidth = 48;
    const drawHeight = 48;


    /*
       Draw the character centered on the player's
       collision position.
    */

    ctx.drawImage(

        playerImage,

        sourceX,
        sourceY,

        SPRITE_SIZE,
        SPRITE_SIZE,

        Math.round(
            player.x -
            drawWidth / 2
        ),

        Math.round(
            player.y -
            drawHeight +
            8
        ),

        drawWidth,
        drawHeight

    );

}


/* =========================================================
   FOUNTAIN FOREGROUND
   ========================================================= */

/*
   The player is drawn BEFORE this portion of the fountain.

   Therefore:

       PLAYER BODY
            ↓
       FOUNTAIN FRONT

   The character can walk behind the fountain, while the
   front edge of the fountain covers the character's feet.

   Importantly, we only redraw the fountain itself rather
   than the entire carpet.
*/

function drawFountainForeground() {

    if (!sceneryReady) {

        return;

    }


    /*
       Fountain foreground crop.

       These coordinates correspond to the fountain area
       in the 640 x 360 scenery.
    */

    const sx = 232;
    const sy = 116;
    const sw = 176;
    const sh = 62;


    /*
       Destination is the same location on the canvas.
    */

    ctx.drawImage(

        sceneryImage,

        sx,
        sy,
        sw,
        sh,

        sx,
        sy,
        sw,
        sh

    );

}


/* =========================================================
   INTERACTION PROMPT
   ========================================================= */

function drawInteractionPrompt() {

    if (!nearFountain()) {

        return;

    }


    const pulse =
        Math.sin(
            Date.now() / 180
        ) * 2;


    const x = 320;

    const y =
        player.y -
        48 +
        pulse;


    /*
       Background.
    */

    ctx.fillStyle =
        "rgba(10,10,15,0.9)";


    ctx.fillRect(

        x - 16,
        y - 16,

        32,
        32

    );


    /*
       Border.
    */

    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth = 2;


    ctx.strokeRect(

        x - 16,
        y - 16,

        32,
        32

    );


    /*
       Letter E.
    */

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "bold 20px monospace";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";


    ctx.fillText(

        "E",

        x,
        y

    );

}


/* =========================================================
   RAIN
   ========================================================= */

const rain = [];


for (
    let i = 0;
    i < 90;
    i++
) {

    rain.push({

        x:
            Math.random() *
            WIDTH,

        y:
            Math.random() *
            HEIGHT,

        speed:
            1 +
            Math.random() * 2,

        length:
            2 +
            Math.random() * 4

    });

}


function updateRain() {

    for (
        const drop of rain
    ) {

        drop.y += drop.speed;


        if (
            drop.y >
            HEIGHT
        ) {

            drop.y = -5;

            drop.x =
                Math.random() *
                WIDTH;

        }

    }

}


function drawRain() {

    ctx.strokeStyle =
        "rgba(150,180,210,0.25)";

    ctx.lineWidth = 1;


    for (
        const drop of rain
    ) {

        ctx.beginPath();


        ctx.moveTo(

            drop.x,
            drop.y

        );


        ctx.lineTo(

            drop.x - 1,
            drop.y +
            drop.length

        );


        ctx.stroke();

    }

}


/* =========================================================
   DIALOGUE
   ========================================================= */

function drawMessage() {

    if (
        messageTimer <= 0
    ) {

        return;

    }


    /*
       Dialogue box.
    */

    ctx.fillStyle =
        "rgba(10,10,15,0.88)";


    ctx.fillRect(

        20,
        292,

        WIDTH - 40,
        32

    );


    /*
       Crisp text.
    */

    ctx.imageSmoothingEnabled =
        false;

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "12px monospace";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";


    ctx.fillText(

        message,

        WIDTH / 2,
        308

    );


    messageTimer--;

}


/* =========================================================
   DRAW
   ========================================================= */

function draw() {

    /*
       1. Background scenery
    */

    drawScenery();


    /*
       2. Player
    */

    drawPlayer();


    /*
       3. Fountain foreground

       The front of the fountain covers the player's
       feet/lower body.
    */

    drawFountainForeground();


    /*
       4. E interaction prompt
    */

    drawInteractionPrompt();


    /*
       5. Rain
    */

    drawRain();


    /*
       6. Dialogue
    */

    drawMessage();

}


/* =========================================================
   UPDATE
   ========================================================= */

function update() {

    updatePlayer();

    updateRain();

}


/* =========================================================
   GAME LOOP
   ========================================================= */

function gameLoop() {

    update();

    draw();

    requestAnimationFrame(
        gameLoop
    );

}


/* =========================================================
   START
   ========================================================= */

loadGame();

gameLoop();
