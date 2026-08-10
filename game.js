"use strict";

/* =========================================================
   PROJECT SIRENS
   =========================================================
   640 x 360 browser RPG
   - Scenery background
   - Animated player sprite
   - Fountain collision
   - Player can walk behind fountain
   - Player cannot walk into fountain
   - E interaction prompt
   - Rain
   - Save / load
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

const WIDTH = canvas.width;
const HEIGHT = canvas.height;


/* =========================================================
   ASSETS
   ========================================================= */

/*
   IMPORTANT:
   This is the player spritesheet.

   If your file has a different filename, ONLY change
   this path.
*/

const playerImage = new Image();

playerImage.src =
    "assets/characters/player/player_sprite.png";


/*
   Scenery image.
*/

const sceneryImage = new Image();

sceneryImage.src =
    "assets/scenery/project_sirens_scenery_transparent.png";


/* =========================================================
   ASSET STATUS
   ========================================================= */

let playerImageLoaded = false;
let sceneryImageLoaded = false;

playerImage.onload = () => {
    playerImageLoaded = true;
};

playerImage.onerror = () => {
    console.error(
        "PROJECT SIRENS: Player sprite could not be loaded:",
        playerImage.src
    );
};

sceneryImage.onload = () => {
    sceneryImageLoaded = true;
};

sceneryImage.onerror = () => {
    console.error(
        "PROJECT SIRENS: Scenery could not be loaded:",
        sceneryImage.src
    );
};


/* =========================================================
   INPUT
   ========================================================= */

const keys = {};

window.addEventListener("keydown", (event) => {

    const key = event.key.toLowerCase();

    keys[key] = true;

    /*
       Prevent the browser from scrolling when using
       arrow keys.
    */

    if (
        key === "arrowup" ||
        key === "arrowdown" ||
        key === "arrowleft" ||
        key === "arrowright" ||
        key === " "
    ) {
        event.preventDefault();
    }

    if (key === "e") {
        interact();
    }

});


window.addEventListener("keyup", (event) => {

    keys[event.key.toLowerCase()] = false;

});


/* =========================================================
   PLAYER
   ========================================================= */

const player = {

    /*
       Spawn on the stairs in front of the fountain.
    */

    x: 320,
    y: 183,

    /*
       Collision size.
       This is intentionally smaller than the visible sprite.
    */

    width: 10,
    height: 8,

    speed: 1.5,

    facing: "down",

    moving: false,

    animationFrame: 0,

    animationTimer: 0

};


/* =========================================================
   PLAYER SPRITESHEET SETTINGS
   ========================================================= */

/*
   The player spritesheet uses 64 x 64 cells.

   The first row contains the four basic directions:

       0 = down
       1 = left
       2 = right
       3 = up

   The animation system uses the same cell size and
   cycles through available animation frames.
*/

const PLAYER_FRAME_WIDTH = 64;
const PLAYER_FRAME_HEIGHT = 64;


/*
   Direction columns.

   These values can be changed easily if your spritesheet
   uses a different arrangement.
*/

const playerDirections = {

    down: 0,
    left: 1,
    right: 2,
    up: 3

};


/* =========================================================
   WORLD BOUNDS
   ========================================================= */

const worldBounds = {

    left: 30,
    right: 610,
    top: 18,
    bottom: 345

};


/* =========================================================
   COLLISION ZONES
   ========================================================= */

/*
   These are gameplay collision zones rather than the
   visible artwork itself.
*/


/*
   TOP BACK WALL

   The player may walk behind the fountain, but cannot
   walk through the actual back wall.
*/

const backWallCollision = {

    x: 55,
    y: 18,
    w: 530,
    h: 42

};


/*
   FOUNTAIN COLLISION

   The player cannot walk INTO the fountain.

   The important distinction is that the player is allowed
   to occupy the area behind the fountain.

   Only the actual fountain body is blocked.
*/

const fountainCollision = {

    x: 245,
    y: 102,
    w: 150,
    h: 68

};


/*
   STAIR / UPPER LEDGE COLLISION

   This prevents the player from walking directly through
   the large staircase structure.
*/

const upperLedgeCollision = {

    x: 50,
    y: 177,
    w: 560,
    h: 16

};


/*
   LOWER WALL / LEDGE
*/

const lowerLedgeCollision = {

    x: 50,
    y: 270,
    w: 560,
    h: 15

};


/*
   SIDE WALLS
*/

const sideWalls = [

    {
        x: 30,
        y: 18,
        w: 22,
        h: 325
    },

    {
        x: 588,
        y: 18,
        w: 22,
        h: 325
    }

];


/* =========================================================
   INTERACTION
   ========================================================= */

const fountain = {

    x: 320,
    y: 135,

    interactionRadius: 62,

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
   FOUNTAIN INTERACTION
   ========================================================= */

function canInteractWithFountain() {

    const distance = Math.hypot(
        player.x - fountain.x,
        player.y - fountain.y
    );

    return distance < fountain.interactionRadius;

}


function interact() {

    if (!canInteractWithFountain()) {
        return;
    }

    showMessage(
        fountain.interactMessage
    );

    saveGame();

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
   PLAYER COLLISION TEST
   ========================================================= */

function playerWouldCollide(x, y) {

    /*
       Player collision box.
    */

    const playerBox = {

        x: x - player.width / 2,
        y: y - player.height / 2,

        w: player.width,
        h: player.height

    };


    /*
       World boundaries.
    */

    if (
        playerBox.x < worldBounds.left ||
        playerBox.x + playerBox.w > worldBounds.right ||
        playerBox.y < worldBounds.top ||
        playerBox.y + playerBox.h > worldBounds.bottom
    ) {

        return true;

    }


    /*
       Side walls.
    */

    for (const wall of sideWalls) {

        if (rectanglesOverlap(playerBox, wall)) {
            return true;
        }

    }


    /*
       Back wall.

       This is what allows the player to walk BEHIND the
       fountain while preventing them from walking into
       the windows / back wall.
    */

    if (
        rectanglesOverlap(
            playerBox,
            backWallCollision
        )
    ) {

        return true;

    }


    /*
       Fountain.

       The fountain itself is blocked.
    */

    if (
        rectanglesOverlap(
            playerBox,
            fountainCollision
        )
    ) {

        return true;

    }


    /*
       Upper staircase / ledge.
    */

    if (
        rectanglesOverlap(
            playerBox,
            upperLedgeCollision
        )
    ) {

        return true;

    }


    /*
       Lower staircase / ledge.
    */

    if (
        rectanglesOverlap(
            playerBox,
            lowerLedgeCollision
        )
    ) {

        return true;

    }


    return false;

}


/* =========================================================
   PLAYER MOVEMENT
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
       Movement animation.
    */

    if (player.moving) {

        player.animationTimer++;

        if (player.animationTimer >= 8) {

            player.animationTimer = 0;

            player.animationFrame++;

            /*
               Three-frame walking cycle.
            */

            if (player.animationFrame > 2) {
                player.animationFrame = 0;
            }

        }

    } else {

        player.animationTimer = 0;
        player.animationFrame = 0;

    }


    /*
       Calculate movement.
    */

    const newX =
        player.x +
        dx * player.speed;

    const newY =
        player.y +
        dy * player.speed;


    /*
       X movement.
    */

    if (
        !playerWouldCollide(
            newX,
            player.y
        )
    ) {

        player.x = newX;

    }


    /*
       Y movement.
    */

    if (
        !playerWouldCollide(
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


function loadGame() {

    const save =
        localStorage.getItem(
            "projectSirensSave"
        );


    if (!save) {

        return;

    }


    try {

        const data =
            JSON.parse(save);


        if (
            typeof data.x === "number" &&
            typeof data.y === "number"
        ) {

            player.x = data.x;
            player.y = data.y;

        }

    } catch (error) {

        console.error(
            "PROJECT SIRENS: Save data could not be loaded.",
            error
        );

    }

}


/* =========================================================
   DRAW SCENERY
   ========================================================= */

function drawScenery() {

    if (!sceneryImageLoaded) {

        ctx.fillStyle = "#202026";

        ctx.fillRect(
            0,
            0,
            WIDTH,
            HEIGHT
        );

        return;

    }


    /*
       Draw the complete scenery image.

       The image is scaled to the 640 x 360 game canvas.
    */

    ctx.drawImage(

        sceneryImage,

        0,
        0,
        sceneryImage.width,
        sceneryImage.height,

        0,
        0,
        WIDTH,
        HEIGHT

    );

}


/* =========================================================
   PLAYER DRAWING
   ========================================================= */

function drawPlayer() {

    /*
       DO NOT draw the old pink placeholder.

       If the image has not loaded yet, simply don't draw
       anything rather than displaying a pink square.
    */

    if (!playerImageLoaded) {

        return;

    }


    /*
       Determine the row/column used by the spritesheet.
    */

    const directionColumn =
        playerDirections[player.facing];


    /*
       Animation frames.

       The first frame is the standing pose.

       Walking frames use the following cells:

           frame 0 = standing
           frame 1 = walk
           frame 2 = walk
    */

    let sourceX =
        directionColumn *
        PLAYER_FRAME_WIDTH;

    let sourceY = 0;


    if (player.moving) {

        /*
           Use additional rows for the walking animation.

           This keeps the character from simply spinning
           between the four directions.
        */

        sourceY =
            player.animationFrame *
            PLAYER_FRAME_HEIGHT;

    }


    /*
       Draw the sprite.

       The character is deliberately drawn larger than the
       collision box.
    */

    const drawWidth = 64;
    const drawHeight = 64;


    ctx.drawImage(

        playerImage,

        sourceX,
        sourceY,

        PLAYER_FRAME_WIDTH,
        PLAYER_FRAME_HEIGHT,

        Math.round(
            player.x - drawWidth / 2
        ),

        Math.round(
            player.y - drawHeight + 8
        ),

        drawWidth,
        drawHeight

    );

}


/* =========================================================
   FOUNTAIN FOREGROUND
   ========================================================= */

/*
   The scenery image contains the complete fountain.

   We therefore use a foreground mask to reproduce the
   important top-down RPG depth effect:

        BACK WALL
            |
        PLAYER
            |
      FOUNTAIN FRONT

   The player can walk behind the fountain, but the lower
   portion of the player is hidden by the front of it.
*/

function drawFountainForeground() {

    /*
       Approximate front basin area.

       This is intentionally narrow so the carpeting on
       either side does NOT hide the player's entire body.
    */

    ctx.save();

    ctx.beginPath();

    ctx.ellipse(

        320,
        151,

        76,
        22,

        0,
        0,
        Math.PI * 2

    );

    ctx.clip();


    /*
       Redraw only the fountain's lower region from the
       scenery image.

       This gives the fountain foreground depth while
       leaving the surrounding carpet visible.
    */

    if (sceneryImageLoaded) {

        const sx =
            (320 - 78) /
            WIDTH *
            sceneryImage.width;

        const sy =
            (128) /
            HEIGHT *
            sceneryImage.height;

        const sw =
            156 /
            WIDTH *
            sceneryImage.width;

        const sh =
            48 /
            HEIGHT *
            sceneryImage.height;


        ctx.drawImage(

            sceneryImage,

            sx,
            sy,
            sw,
            sh,

            242,
            128,
            156,
            48

        );

    }

    ctx.restore();

}


/* =========================================================
   INTERACTION PROMPT
   ========================================================= */

function drawInteractionPrompt() {

    if (!canInteractWithFountain()) {

        return;

    }


    const pulse =
        Math.sin(
            Date.now() / 180
        ) * 2;


    const promptX = 320;
    const promptY =
        player.y - 43 + pulse;


    /*
       Shadow / backing.
    */

    ctx.fillStyle =
        "rgba(10,10,15,0.85)";

    ctx.fillRect(

        promptX - 16,
        promptY - 16,

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

        promptX - 16,
        promptY - 16,

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
        promptX,
        promptY
    );

}


/* =========================================================
   RAIN
   ========================================================= */

const rain = [];


for (let i = 0; i < 90; i++) {

    rain.push({

        x:
            Math.random() * WIDTH,

        y:
            Math.random() * HEIGHT,

        speed:
            1 +
            Math.random() * 2,

        length:
            2 +
            Math.random() * 4

    });

}


function updateRain() {

    for (const drop of rain) {

        drop.y += drop.speed;


        if (drop.y > HEIGHT) {

            drop.y = -5;

            drop.x =
                Math.random() * WIDTH;

        }

    }

}


function drawRain() {

    ctx.strokeStyle =
        "rgba(150,180,210,0.25)";

    ctx.lineWidth = 1;


    for (const drop of rain) {

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
   MESSAGE UI
   ========================================================= */

function drawUI() {

    if (messageTimer <= 0) {

        return;

    }


    /*
       Dark dialogue box.
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
       Crisp pixel-style text.

       Disable smoothing before rendering.
    */

    ctx.imageSmoothingEnabled = false;

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
   DRAW ORDER
   ========================================================= */

/*
   THIS ORDER IS VERY IMPORTANT.

   1. Scenery
   2. Player
   3. Fountain foreground
   4. Interaction prompt
   5. Rain
   6. Dialogue
*/

function draw() {

    ctx.clearRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    /*
       Background scenery.
    */

    drawScenery();


    /*
       Player.
    */

    drawPlayer();


    /*
       Fountain foreground.

       This happens AFTER the player so that the front
       of the fountain can visually cover the player's feet.
    */

    drawFountainForeground();


    /*
       Interaction indicator.
    */

    drawInteractionPrompt();


    /*
       Rain goes over everything.
    */

    drawRain();


    /*
       Dialogue goes last.
    */

    drawUI();

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
