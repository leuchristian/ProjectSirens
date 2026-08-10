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

/*
   IMPORTANT:
   Use the player filename that your project has actually
   been using.

   We are NOT assuming a new filename here.
*/
playerImage.src =
    "assets/characters/player/player_sprite.png";

let sceneryReady = false;
let playerReady = false;


/* =========================================================
   SCENERY LOADING
   ========================================================= */

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


/* =========================================================
   PLAYER LOADING
   ========================================================= */

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
       Spawn on the staircase directly below
       the fountain.
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
   The spritesheet is assumed to be arranged:

       COLUMN 0 = DOWN
       COLUMN 1 = LEFT
       COLUMN 2 = RIGHT
       COLUMN 3 = UP

   ROWS are walking animation frames.

   We calculate the cell size from the actual image
   instead of hard-coding 64x64.

   This makes the code much less likely to make
   the player disappear because of an incorrect
   spritesheet size.
*/

const SPRITE_COLUMNS = 4;
const SPRITE_ROWS = 3;

let SPRITE_WIDTH = 64;
let SPRITE_HEIGHT = 64;


/* =========================================================
   UPDATE SPRITE SIZE AFTER IMAGE LOAD
   ========================================================= */

playerImage.addEventListener("load", function () {

    if (
        playerImage.naturalWidth >= SPRITE_COLUMNS &&
        playerImage.naturalHeight >= SPRITE_ROWS
    ) {

        SPRITE_WIDTH =
            Math.floor(
                playerImage.naturalWidth /
                SPRITE_COLUMNS
            );

        SPRITE_HEIGHT =
            Math.floor(
                playerImage.naturalHeight /
                SPRITE_ROWS
            );

    }

    console.log(
        "Detected sprite cell:",
        SPRITE_WIDTH,
        "x",
        SPRITE_HEIGHT
    );

});


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
   BACK WALL COLLISION
   ========================================================= */

/*
   The BACK WALL is the upper wall/window area.

   The player may walk in the space between
   this wall and the fountain.

   The player may NOT walk into the wall itself.
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
   IMPORTANT:

   This is ONLY the front/lower basin.

   The player is allowed to walk BEHIND the
   fountain.

   The player cannot walk INTO the fountain.

   There is deliberately NO collision rectangle
   covering the fountain's upper/back portion.
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
   FOUNTAIN INTERACTION
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

       This is the ONLY upper-wall collision.
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

       Only the front basin is blocked.
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
       NO GIANT STAIRCASE COLLISION.

       The player can freely walk around
       the staircase/flooring area.
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
                player.frame >= SPRITE_ROWS
            ) {

                player.frame = 0;

            }

        }

    } else {

        player.frame = 0;

        player.animationTimer = 0;

    }


    /* =====================================================
       CALCULATE NEW POSITION
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
               Only restore the saved position if
               that position is still valid.
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
       Draw the entire scenery once.

       This is the BASE layer.
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
       Do not draw a placeholder.

       If the image has not loaded yet,
       simply wait.
    */

    if (!playerReady) {

        return;

    }


    /*
       Determine spritesheet position.
    */

    const column =
        directionColumn[player.facing];


    const row =
        player.frame;


    const sourceX =
        column *
        SPRITE_WIDTH;


    const sourceY =
        row *
        SPRITE_HEIGHT;


    /*
       Visible size of character.
    */

    const drawWidth = 48;
    const drawHeight = 48;


    /*
       The player's x/y represent
       the FEET position.
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

        SPRITE_WIDTH,
        SPRITE_HEIGHT,

        drawX,
        drawY,

        drawWidth,
        drawHeight

    );

}


/* =========================================================
   DRAW FOUNTAIN FRONT
   ========================================================= */

/*
   This is the key layering system.

   BASE:
       scenery

   THEN:
       player

   THEN:
       ONLY the front lip of the fountain

   This allows the character's upper body to remain
   visible while the character's feet can disappear
   naturally behind the fountain.
*/

function drawFountainForeground() {

    if (!sceneryReady) {

        return;

    }


    ctx.save();


    /*
       FRONT FOUNTAIN BASIN MASK

       Notice that this is NOT a giant rectangle.

       It is only the lower basin.
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
       Because the scenery was already scaled from
       1536 x 1024 to 640 x 360, convert the
       destination coordinates back into source
       coordinates.
    */

    const scaleX =
        sceneryImage.naturalWidth /
        WIDTH;

    const scaleY =
        sceneryImage.naturalHeight /
        HEIGHT;


    /*
       Screen region containing the fountain.
    */

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
       Redraw only the clipped fountain region.
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


    /*
       Put the E above the player's head.
    */

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
       Background.
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


    /*
       Dialogue box.
    */

    ctx.fillStyle =
        "rgba(10,10,15,0.90)";

    ctx.fillRect(

        20,
        292,

        WIDTH - 40,
        32

    );


    /*
       Crisp pixel-style text.
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
   DRAW
   ========================================================= */

function draw() {

    /*
       1. BACKGROUND
    */

    drawScenery();


    /*
       2. PLAYER
    */

    drawPlayer();


    /*
       3. FOUNTAIN FRONT

       Only the basin/lower lip is drawn over
       the player.
    */

    drawFountainForeground();


    /*
       4. INTERACTION PROMPT
    */

    drawInteractionPrompt();


    /*
       5. RAIN
    */

    drawRain();


    /*
       6. DIALOGUE
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

/*
   Start at the intended spawn point unless
   a valid saved position exists.
*/

loadGame();

gameLoop();
