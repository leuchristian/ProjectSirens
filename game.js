"use strict";

/* =========================================================
   PROJECT SIRENS
   640 x 360 TOP-DOWN RPG
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
const playerSprite = new Image();

let sceneryLoaded = false;
let playerSpriteLoaded = false;


/*
   IMPORTANT:
   These paths match the Project Sirens assets.
*/

sceneryImage.src =
    "assets/scenery/project_sirens_scenery_transparent.png";

playerSprite.src =
    "assets/characters/player/player_sprite.png";


sceneryImage.onload = function () {

    sceneryLoaded = true;

    console.log(
        "Scenery loaded:",
        sceneryImage.naturalWidth,
        sceneryImage.naturalHeight
    );

};


sceneryImage.onerror = function () {

    console.error(
        "ERROR LOADING SCENERY:",
        sceneryImage.src
    );

};


playerSprite.onload = function () {

    playerSpriteLoaded = true;

    console.log(
        "PLAYER SPRITE LOADED:",
        playerSprite.naturalWidth,
        playerSprite.naturalHeight
    );

};


playerSprite.onerror = function () {

    console.error(
        "ERROR LOADING PLAYER SPRITE:",
        playerSprite.src
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

    keys[
        event.key.toLowerCase()
    ] = false;

});


/* =========================================================
   PLAYER
   ========================================================= */

const player = {

    /*
       Feet position.
       Starts on the stairs below the fountain.
    */

    x: 320,
    y: 205,

    width: 14,
    height: 10,

    speed: 1.5,

    facing: "down",

    moving: false,

    animationFrame: 0,

    animationTimer: 0

};


/* =========================================================
   PLAYER SPRITESHEET
   ========================================================= */

/*
   4 animation columns.
   8 rows.

   The directional rows are:

       0 = left
       1 = down
       2 = right
       3 = up

   The remaining rows are retained because
   the actual spritesheet is divided into 8 rows.
*/

const SPRITE_COLUMNS = 4;
const SPRITE_ROWS = 8;

const directionRows = {

    left: 0,
    down: 1,
    right: 2,
    up: 3

};

const animationSpeed = 8;


/* =========================================================
   WORLD
   ========================================================= */

const world = {

    left: 30,
    right: 610,

    top: 18,
    bottom: 345

};


/* =========================================================
   BACK WALL
   ========================================================= */

const backWall = {

    x: 50,
    y: 18,

    w: 540,
    h: 38

};


/* =========================================================
   FOUNTAIN
   ========================================================= */

const fountain = {

    x: 320,
    y: 125,

    interactionRadius: 75,

    collisionRadiusX: 62,
    collisionRadiusY: 27,

    interactMessage:
        "The fountain water is strangely calming."

};


/* =========================================================
   FOUNTAIN FRONT COLLISION
   ========================================================= */

/*
   This represents the front basin only.

   The player can walk behind the fountain.
*/

const fountainFront = {

    x: 250,
    y: 138,

    w: 140,
    h: 30

};


/* =========================================================
   SIDE WALLS
   ========================================================= */

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
   COLLISION HELPERS
   ========================================================= */

function rectanglesOverlap(a, b) {

    return (

        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y

    );

}


function playerBox(x, y) {

    return {

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

}


/* =========================================================
   FOUNTAIN COLLISION
   ========================================================= */

function fountainCollision(x, y) {

    const dx =
        x - fountain.x;

    const dy =
        y - fountain.y;

    const nx =
        dx /
        fountain.collisionRadiusX;

    const ny =
        dy /
        fountain.collisionRadiusY;

    return (
        nx * nx +
        ny * ny <
        1
    );

}


/* =========================================================
   PLAYER COLLISION
   ========================================================= */

function playerCollides(x, y) {

    const box =
        playerBox(x, y);


    /*
       WORLD BOUNDARIES
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

    for (
        const wall of sideWalls
    ) {

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
       FOUNTAIN

       Only the fountain itself is solid.
       The area between it and the back wall
       remains walkable.
    */

    if (
        fountainCollision(
            x,
            y
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


    /* =====================================================
       WALKING ANIMATION
       ===================================================== */

    if (player.moving) {

        player.animationTimer++;

        if (
            player.animationTimer >=
            animationSpeed
        ) {

            player.animationTimer = 0;

            player.animationFrame++;

            if (
                player.animationFrame >=
                SPRITE_COLUMNS
            ) {

                player.animationFrame = 0;

            }

        }

    } else {

        player.animationFrame = 0;
        player.animationTimer = 0;

    }


    /* =====================================================
       MOVE HORIZONTALLY
       ===================================================== */

    const newX =
        player.x +
        dx * player.speed;

    if (
        !playerCollides(
            newX,
            player.y
        )
    ) {

        player.x = newX;

    }


    /* =====================================================
       MOVE VERTICALLY
       ===================================================== */

    const newY =
        player.y +
        dy * player.speed;

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
        distance <=
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
   MESSAGE
   ========================================================= */

let message = "";
let messageTimer = 0;


function showMessage(text) {

    message = text;
    messageTimer = 180;

}


/* =========================================================
   SAVE
   ========================================================= */

function saveGame() {

    localStorage.setItem(

        "projectSirensSave",

        JSON.stringify({

            x: player.x,
            y: player.y

        })

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

        player.x = 320;
        player.y = 205;

        return;

    }


    try {

        const data =
            JSON.parse(saved);


        if (

            typeof data.x === "number" &&
            typeof data.y === "number"

        ) {

            if (
                !playerCollides(
                    data.x,
                    data.y
                )
            ) {

                player.x = data.x;
                player.y = data.y;

                return;

            }

        }

    } catch (error) {

        console.error(
            "Could not load save:",
            error
        );

    }


    player.x = 320;
    player.y = 205;

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


    if (!sceneryLoaded) {

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
       DO NOT DRAW A PINK PLACEHOLDER.

       If the actual sprite isn't loaded,
       simply don't draw anything.
    */

    if (!playerSpriteLoaded) {

        return;

    }


    /*
       Determine the size of one sprite cell
       from the actual PNG dimensions.
    */

    const frameWidth =
        playerSprite.naturalWidth /
        SPRITE_COLUMNS;

    const frameHeight =
        playerSprite.naturalHeight /
        SPRITE_ROWS;


    /*
       Direction is the row.
    */

    const row =
        directionRows[
            player.facing
        ];


    /*
       Animation frame is the column.
    */

    const sourceX =
        player.animationFrame *
        frameWidth;

    const sourceY =
        row *
        frameHeight;


    /*
       Visible character size.
    */

    const drawWidth = 26;
    const drawHeight = 32;


    const drawX =
        Math.round(
            player.x -
            drawWidth / 2
        );


    const drawY =
        Math.round(
            player.y -
            drawHeight +
            5
        );


    ctx.drawImage(

        playerSprite,

        sourceX,
        sourceY,

        frameWidth,
        frameHeight,

        drawX,
        drawY,

        drawWidth,
        drawHeight

    );

}


/* =========================================================
   DRAW FOUNTAIN FOREGROUND
   ========================================================= */

function drawFountainForeground() {

    if (!sceneryLoaded) {

        return;

    }


    /*
       Save canvas state.
    */

    ctx.save();


    /*
       Only the front basin/lip is placed
       over the player's lower body.

       The upper fountain remains behind
       the player.
    */

    ctx.beginPath();

    ctx.moveTo(
        236,
        139
    );

    ctx.quadraticCurveTo(
        320,
        150,
        404,
        139
    );

    ctx.quadraticCurveTo(
        398,
        160,
        380,
        168
    );

    ctx.quadraticCurveTo(
        320,
        178,
        260,
        168
    );

    ctx.quadraticCurveTo(
        242,
        160,
        236,
        139
    );

    ctx.closePath();

    ctx.clip();


    /*
       Redraw the scenery inside the
       fountain-front clipping region.
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


    const x =
        Math.round(
            player.x
        );


    const y =
        Math.round(
            player.y -
            48 +
            pulse
        );


    ctx.fillStyle =
        "rgba(10,10,15,0.92)";

    ctx.fillRect(

        x - 16,
        y - 16,

        32,
        32

    );


    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth = 2;

    ctx.strokeRect(

        x - 16,
        y - 16,

        32,
        32

    );


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

        drop.y +=
            drop.speed;


        if (
            drop.y > HEIGHT
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
            drop.y + drop.length
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


    ctx.fillStyle =
        "rgba(10,10,15,0.90)";

    ctx.fillRect(

        20,
        292,

        WIDTH - 40,
        32

    );


    ctx.strokeStyle =
        "rgba(255,255,255,0.35)";

    ctx.lineWidth = 1;

    ctx.strokeRect(

        20,
        292,

        WIDTH - 40,
        32

    );


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
   UPDATE
   ========================================================= */

function update() {

    updatePlayer();

    updateRain();

}


/* =========================================================
   DRAW
   ========================================================= */

function draw() {

    drawScenery();

    drawPlayer();

    drawFountainForeground();

    drawInteractionPrompt();

    drawRain();

    drawMessage();

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
