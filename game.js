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
       Spawn directly below the fountain,
       on the staircase.
    */

    x: 320,
    y: 184,

    /*
       Small collision box at the feet.
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
   BACK WALL
   ========================================================= */

/*
   The player CAN walk between the back wall
   and the fountain.

   The player CANNOT walk into the back wall.
*/

const backWall = {

    x: 50,
    y: 18,

    w: 540,
    h: 38

};


/* =========================================================
   FOUNTAIN COLLISION
   ========================================================= */

/*
   ONLY the front/lower portion of the fountain
   is solid.

   The area behind the fountain remains walkable.
*/

const fountainCollision = {

    x: 250,
    y: 138,

    w: 140,
    h: 31

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
   FOUNTAIN
   ========================================================= */

const fountain = {

    x: 320,
    y: 132,

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
       OUTER WORLD LIMITS
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

       The player can walk behind the fountain,
       but cannot walk into its front basin.
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
       NO LARGE STAIRCASE COLLISION.
       The staircase/flooring remains walkable.
    */

    return false;

}


/* =========================================================
   MOVEMENT
   ========================================================= */

function updatePlayer() {

    let dx = 0;
    let dy = 0;


    /* UP */

    if (
        keys["w"] ||
        keys["arrowup"]
    ) {

        dy -= 1;

        player.facing = "up";

    }


    /* DOWN */

    if (
        keys["s"] ||
        keys["arrowdown"]
    ) {

        dy += 1;

        player.facing = "down";

    }


    /* LEFT */

    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {

        dx -= 1;

        player.facing = "left";

    }


    /* RIGHT */

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


    /* =====================================================
       NEW POSITION
       ===================================================== */

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

            /*
               Only restore a valid position.
            */

            if (
                !playerCollides(
                    data.x,
                    data.y
                )
            ) {

                player.x = data.x;
                player.y = data.y;

            }

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
       Draw the scenery once as the background.
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
       IMPORTANT:

       This is the original 64x64 sprite-sheet
       implementation.

       We do NOT automatically calculate the frame
       size anymore.
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
       Visible character size.
    */

    const drawWidth = 48;
    const drawHeight = 48;


    /*
       Player x/y represents the feet.
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
   Draw ONLY the front basin of the fountain
   over the player's feet.

   The character remains visible behind it.
*/

function drawFountainForeground() {

    if (!sceneryReady) {

        return;

    }


    ctx.save();


    /*
       FRONT BASIN SHAPE
    */

    ctx.beginPath();

    ctx.moveTo(
        246,
        139
    );

    ctx.quadraticCurveTo(

        320,
        150,

        394,
        139

    );

    ctx.quadraticCurveTo(

        397,
        153,

        385,
        164

    );

    ctx.quadraticCurveTo(

        320,
        177,

        255,
        164

    );

    ctx.quadraticCurveTo(

        243,
        153,

        246,
        139

    );

    ctx.closePath();

    ctx.clip();


    /*
       Convert screen coordinates back into
       source-image coordinates.
    */

    const scaleX =
        sceneryImage.naturalWidth /
        WIDTH;

    const scaleY =
        sceneryImage.naturalHeight /
        HEIGHT;


    const destX = 225;
    const destY = 92;

    const destW = 190;
    const destH = 88;


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
       Redraw only the clipped fountain area.
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


    /*
       Prompt background.
    */

    ctx.fillStyle =
        "rgba(10,10,15,0.92)";

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
       E.
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


    ctx.fillStyle =
        "rgba(10,10,15,0.90)";

    ctx.fillRect(

        20,
        292,

        WIDTH - 40,
        32

    );


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
       1. Scenery
    */

    drawScenery();


    /*
       2. Player
    */

    drawPlayer();


    /*
       3. Fountain front edge
    */

    drawFountainForeground();


    /*
       4. Interaction prompt
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
