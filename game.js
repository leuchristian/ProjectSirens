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

    const key = event.key.toLowerCase();

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
       Starting position:
       directly below the fountain,
       on the staircase area.
    */

    x: 320,
    y: 184,

    /*
       Small collision box.
       The visible sprite is larger.
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
   64 x 64 sprite cells.

   Direction columns:

       0 = down
       1 = left
       2 = right
       3 = up

   Animation frames are arranged vertically.
*/

const SPRITE_SIZE = 64;

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
   BACK WALL
   ---------------------------------------------------------
   The player may walk in the area BETWEEN the back wall
   and the fountain.

   The player simply cannot walk INTO the back wall.
*/

const backWall = {

    x: 50,
    y: 18,

    w: 540,
    h: 38

};


/*
   FOUNTAIN FRONT COLLISION
   ---------------------------------------------------------
   IMPORTANT:

   This is intentionally ONLY the front portion of the
   fountain.

   The player can walk behind the fountain.

   The player cannot walk onto the fountain's front basin.
*/

const fountainCollision = {

    x: 250,
    y: 136,

    w: 140,
    h: 30

};


/*
   LEFT / RIGHT OUTER WALLS
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
    y: 125,

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
       OUTER WORLD BOUNDARIES
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
       SIDE WALLS
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
       BACK WALL
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
       FOUNTAIN FRONT

       This does NOT block the area behind
       the fountain.
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
       There is intentionally NO giant
       staircase collision rectangle here.

       The staircase remains walkable.
    */


    return false;

}


/* =========================================================
   MOVEMENT
   ========================================================= */

function updatePlayer() {

    let dx = 0;
    let dy = 0;


    /*
       UP
    */

    if (
        keys["w"] ||
        keys["arrowup"]
    ) {

        dy -= 1;

        player.facing = "up";

    }


    /*
       DOWN
    */

    if (
        keys["s"] ||
        keys["arrowdown"]
    ) {

        dy += 1;

        player.facing = "down";

    }


    /*
       LEFT
    */

    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {

        dx -= 1;

        player.facing = "left";

    }


    /*
       RIGHT
    */

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
       WALKING ANIMATION
    */

    if (player.moving) {

        player.animationTimer++;

        if (
            player.animationTimer >= 8
        ) {

            player.animationTimer = 0;

            player.frame++;

            if (
                player.frame > 2
            ) {

                player.frame = 0;

            }

        }

    } else {

        player.frame = 0;

        player.animationTimer = 0;

    }


    /*
       NEW POSITION
    */

    const newX =
        player.x +
        dx * player.speed;

    const newY =
        player.y +
        dy * player.speed;


    /*
       HORIZONTAL MOVEMENT
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
       VERTICAL MOVEMENT
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
   SAVE SYSTEM
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
   LOAD SYSTEM
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
       Draw the COMPLETE scenery exactly once.

       The original image is 1536 x 1024.

       It is scaled to the 640 x 360 game canvas.
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
       Never draw a placeholder square.

       If the sprite has not loaded yet,
       simply wait.
    */

    if (!playerReady) {

        return;

    }


    const column =
        directionColumn[player.facing];


    const row =
        player.frame;


    const sourceX =
        column *
        SPRITE_SIZE;


    const sourceY =
        row *
        SPRITE_SIZE;


    /*
       Visible sprite size.
    */

    const drawWidth = 48;
    const drawHeight = 48;


    /*
       Draw from the feet position.

       This keeps the player's collision position
       at the feet rather than the center of the
       visible sprite.
    */

    const drawX =
        Math.round(
            player.x -
            drawWidth / 2
        );


    const drawY =
        Math.round(
            player.y -
            drawHeight +
            8
        );


    ctx.drawImage(

        playerImage,

        sourceX,
        sourceY,

        SPRITE_SIZE,
        SPRITE_SIZE,

        drawX,
        drawY,

        drawWidth,
        drawHeight

    );

}


/* =========================================================
   FOUNTAIN FOREGROUND
   ========================================================= */

/*
   THIS IS THE IMPORTANT FIX.

   The scenery image is 1536 x 1024.

   The game displays it at 640 x 360.

   Therefore we CANNOT use 640 x 360 coordinates
   as source coordinates when cutting the fountain
   out of the original image.

   The original fountain occupies approximately:

       source X: 550 - 985
       source Y: 285 - 475

   We only draw the FRONT / LOWER portion.

   We also use a clipping shape so that the carpet
   surrounding the fountain is NOT drawn over the player.
*/

function drawFountainForeground() {

    if (!sceneryReady) {

        return;

    }


    /*
       Save the canvas state so the clipping region
       does not affect anything else.
    */

    ctx.save();


    /*
       Fountain front shape in GAME coordinates.

       This is deliberately only the lower/front
       basin of the fountain.

       It does NOT cover the entire fountain.
    */

    ctx.beginPath();

    ctx.moveTo(
        236,
        139
    );


    /*
       Upper edge of the front basin.
    */

    ctx.quadraticCurveTo(

        320,
        151,

        404,
        139

    );


    /*
       Right side.
    */

    ctx.quadraticCurveTo(

        398,
        160,

        380,
        168

    );


    /*
       Bottom edge.
    */

    ctx.quadraticCurveTo(

        320,
        177,

        260,
        168

    );


    /*
       Left side.
    */

    ctx.quadraticCurveTo(

        242,
        160,

        236,
        139

    );


    ctx.closePath();

    ctx.clip();


    /*
       IMPORTANT:

       Convert the desired GAME-SCREEN region into
       SOURCE-IMAGE coordinates.

       Source image:
           1536 x 1024

       Canvas:
           640 x 360
    */

    const scaleX =
        sceneryImage.naturalWidth /
        WIDTH;


    const scaleY =
        sceneryImage.naturalHeight /
        HEIGHT;


    /*
       Fountain region on the GAME SCREEN.
    */

    const destX = 225;
    const destY = 92;

    const destW = 190;
    const destH = 86;


    /*
       Corresponding source rectangle.
    */

    const sourceX =
        destX *
        scaleX;


    const sourceY =
        destY *
        scaleY;


    const sourceW =
        destW *
        scaleX;


    const sourceH =
        destH *
        scaleY;


    /*
       Draw the correctly scaled fountain section.

       Because of the clipping path above,
       the surrounding carpet cannot cover
       the character.
    */

    ctx.drawImage(

        sceneryImage,

        sourceX,
        sourceY,

        sourceW,
        sourceH,

        destX,
        destY,

        destW,
        destH

    );


    /*
       Restore the normal canvas clipping.
    */

    ctx.restore();

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


    /*
       Keep the prompt above the player.
    */

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

       Use integer positioning for
       sharper pixel-game text.
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

        Math.round(x),
        Math.round(y)

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

        drop.y +=
            drop.speed;


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
       1. Full scenery.
    */

    drawScenery();


    /*
       2. Player.

       The player is drawn ON TOP of the scenery,
       allowing him to walk behind the fountain.
    */

    drawPlayer();


    /*
       3. Only the front edge of the fountain
          is drawn over the player's feet.
    */

    drawFountainForeground();


    /*
       4. Interaction prompt.
    */

    drawInteractionPrompt();


    /*
       5. Rain.
    */

    drawRain();


    /*
       6. Dialogue.
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
