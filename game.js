"use strict";

/* =========================================================
   CANVAS / GAME RESOLUTION
========================================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 640;
canvas.height = 360;

canvas.style.width = "min(960px, 92vw)";
canvas.style.height = "auto";
canvas.style.imageRendering = "pixelated";

ctx.imageSmoothingEnabled = false;

const WIDTH = 640;
const HEIGHT = 360;


/* =========================================================
   PLAYER SPRITE
========================================================= */

const playerSprite = new Image();

let playerLoaded = false;

playerSprite.onload = function () {
    playerLoaded = true;
};

playerSprite.onerror = function () {
    console.log("Player sprite could not be loaded.");
};

playerSprite.src =
    "assets/characters/player/player_sprite_sheet.png";


/* =========================================================
   SCENERY
========================================================= */

const scenerySprite = new Image();

let sceneryLoaded = false;

scenerySprite.onload = function () {
    sceneryLoaded = true;
    calculateSceneryCrop();
};

scenerySprite.onerror = function () {
    console.log("Scenery image could not be loaded.");
};

scenerySprite.src =
    "assets/scenery/project_sirens_scenery_transparent.png";


/* =========================================================
   SCENERY DISPLAY
========================================================= */

let scenerySourceX = 0;
let scenerySourceY = 0;
let scenerySourceWidth = 0;
let scenerySourceHeight = 0;


function calculateSceneryCrop() {

    if (!sceneryLoaded) {
        return;
    }

    const imageWidth =
        scenerySprite.naturalWidth;

    const imageHeight =
        scenerySprite.naturalHeight;

    const canvasRatio =
        WIDTH / HEIGHT;

    const imageRatio =
        imageWidth / imageHeight;


    if (imageRatio > canvasRatio) {

        scenerySourceHeight =
            imageHeight;

        scenerySourceWidth =
            imageHeight * canvasRatio;

        scenerySourceX =
            (imageWidth -
                scenerySourceWidth) / 2;

        scenerySourceY = 0;

    }
    else {

        scenerySourceWidth =
            imageWidth;

        scenerySourceHeight =
            imageWidth / canvasRatio;

        scenerySourceX = 0;

        scenerySourceY =
            (imageHeight -
                scenerySourceHeight) / 2;
    }
}


/* =========================================================
   INPUT
========================================================= */

const keys = {};

window.addEventListener(
    "keydown",
    function (event) {

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

    }
);


window.addEventListener(
    "keyup",
    function (event) {

        keys[
            event.key.toLowerCase()
        ] = false;

    }
);


/* =========================================================
   PLAYER
========================================================= */

const SPAWN_X = 320;
const SPAWN_Y = 220;


const player = {

    x: SPAWN_X,
    y: SPAWN_Y,

    width: 20,
    height: 20,

    speed: 3,

    facing: "up",

    moving: false,

    animationFrame: 0,

    animationTimer: 0

};


/* =========================================================
   PLAYER SPRITE SHEET
========================================================= */

const FRAME_WIDTH = 61;
const FRAME_HEIGHT = 61;


const FRAME_X = [

    5,
    68,
    131,
    194

];


const FRAME_Y = [

    3,
    68,
    131,
    195

];


/* =========================================================
   FOUNTAIN
========================================================= */

const fountain = {

    x: 320,

    y: 140,

    radius: 40,

    interactMessage:
        "The fountain water is strangely calming."

};


/* =========================================================
   WORLD BOUNDARIES
========================================================= */

const walls = [

    {
        x: 24,
        y: 24,
        w: 20,
        h: 312
    },

    {
        x: 596,
        y: 24,
        w: 20,
        h: 312
    },

    {
        x: 24,
        y: 24,
        w: 592,
        h: 16
    },

    {
        x: 24,
        y: 324,
        w: 592,
        h: 16
    }

];


/* =========================================================
   SCENERY COLLISION ZONES
========================================================= */

const sceneryCollisions = [

    /* Windows */

    {
        x: 182,
        y: 20,
        w: 276,
        h: 70
    },


    /* Upper-left bookcase */

    {
        x: 54,
        y: 54,
        w: 76,
        h: 48
    },


    /* Upper-right cabinet */

    {
        x: 440,
        y: 52,
        w: 96,
        h: 54
    },


    /* Upper-left table */

    {
        x: 44,
        y: 112,
        w: 86,
        h: 34
    },


    /* Upper-right table */

    {
        x: 510,
        y: 112,
        w: 86,
        h: 34
    },


    /* Lower-left furniture */

    {
        x: 50,
        y: 238,
        w: 92,
        h: 36
    },


    /* Lower-right furniture */

    {
        x: 458,
        y: 238,
        w: 116,
        h: 36
    },


    /* Lower-left plant */

    {
        x: 76,
        y: 210,
        w: 30,
        h: 30
    },


    /* Lower-right plant */

    {
        x: 524,
        y: 210,
        w: 30,
        h: 30
    },


    /* Lower center door */

    {
        x: 286,
        y: 302,
        w: 68,
        h: 34
    }

];


/* =========================================================
   RAIN
========================================================= */

const rain = [];

for (let i = 140; i > 0; i--) {

    rain.push({

        x:
            Math.random() * WIDTH,

        y:
            Math.random() * HEIGHT,

        speed:
            2 + Math.random() * 3,

        length:
            3 + Math.random() * 6

    });

}


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

function interact() {

    const distance =
        Math.hypot(

            player.x -
            fountain.x,

            player.y -
            fountain.y

        );


    if (distance < 84) {

        showMessage(
            fountain.interactMessage
        );

        saveGame();

    }

}


/* =========================================================
   RECTANGLE COLLISION
========================================================= */

function rectangleCollision(
    x,
    y,
    width,
    height,
    object
) {

    return (

        x + width / 2 >
        object.x &&

        x - width / 2 <
        object.x + object.w &&

        y + height / 2 >
        object.y &&

        y - height / 2 <
        object.y + object.h

    );

}


/* =========================================================
   COLLISION
========================================================= */

function collidesWithWall(x, y) {

    /* World boundaries */

    for (const wall of walls) {

        if (
            rectangleCollision(
                x,
                y,
                player.width,
                player.height,
                wall
            )
        ) {

            return true;

        }

    }


    /* Scenery */

    for (
        const object of sceneryCollisions
    ) {

        if (
            rectangleCollision(
                x,
                y,
                player.width,
                player.height,
                object
            )
        ) {

            return true;

        }

    }


    /*
       FOUNTAIN FRONT

       The player is allowed to walk behind
       the fountain.

       Only the lower/front basin prevents
       the player from walking completely
       through it.
    */

    const fountainFrontCollision = {

        x: 268,

        y: 146,

        w: 104,

        h: 36

    };


    if (
        rectangleCollision(
            x,
            y,
            player.width,
            player.height,
            fountainFrontCollision
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

        dy = -1;

        player.facing = "up";

    }


    if (
        keys["s"] ||
        keys["arrowdown"]
    ) {

        dy = 1;

        player.facing = "down";

    }


    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {

        dx = -1;

        player.facing = "left";

    }


    if (
        keys["d"] ||
        keys["arrowright"]
    ) {

        dx = 1;

        player.facing = "right";

    }


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


    const newX =
        player.x +
        dx * player.speed;

    const newY =
        player.y +
        dy * player.speed;


    if (
        !collidesWithWall(
            newX,
            player.y
        )
    ) {

        player.x = newX;

    }


    if (
        !collidesWithWall(
            player.x,
            newY
        )
    ) {

        player.y = newY;

    }


    /*
       Walking animation.
    */

    if (player.moving) {

        player.animationTimer++;


        if (
            player.animationTimer >= 8
        ) {

            player.animationTimer = 0;

            player.animationFrame++;


            if (
                player.animationFrame >= 3
            ) {

                player.animationFrame = 0;

            }

        }

    }
    else {

        player.animationTimer = 0;

        player.animationFrame = 0;

    }

}


/* =========================================================
   SAVE SYSTEM
========================================================= */

const SAVE_KEY =
    "projectSirensSaveV3";


function saveGame() {

    const saveData = {

        x: player.x,

        y: player.y

    };


    localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(saveData)
    );

}


function loadGame() {

    const saved =
        localStorage.getItem(
            SAVE_KEY
        );


    if (!saved) {

        player.x = SPAWN_X;
        player.y = SPAWN_Y;

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
        else {

            player.x = SPAWN_X;
            player.y = SPAWN_Y;

        }

    }
    catch (error) {

        console.log(
            "Save could not be loaded."
        );

        player.x = SPAWN_X;
        player.y = SPAWN_Y;

    }

}


/* =========================================================
   DRAW SCENERY
========================================================= */

function drawScenery() {

    ctx.fillStyle =
        "#202026";


    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    if (!sceneryLoaded) {
        return;
    }


    calculateSceneryCrop();


    ctx.drawImage(

        scenerySprite,

        scenerySourceX,
        scenerySourceY,

        scenerySourceWidth,
        scenerySourceHeight,

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
       Fallback character.
    */

    if (!playerLoaded) {

        ctx.fillStyle =
            "#111116";


        ctx.fillRect(

            player.x - 10,
            player.y - 12,

            20,
            20

        );


        ctx.fillStyle =
            "#e4e4e8";


        ctx.fillRect(

            player.x - 8,
            player.y - 14,

            16,
            6

        );


        ctx.fillStyle =
            "#b13d68";


        ctx.fillRect(

            player.x - 8,
            player.y - 4,

            16,
            14

        );


        return;

    }


    /*
       Direction column.
    */

    let column = 2;


    if (
        player.facing === "left"
    ) {

        column = 0;

    }
    else if (
        player.facing === "up"
    ) {

        column = 1;

    }
    else if (
        player.facing === "down"
    ) {

        column = 2;

    }
    else if (
        player.facing === "right"
    ) {

        column = 3;

    }


    /*
       Animation row.
    */

    let row = 0;


    if (player.moving) {

        row =
            player.animationFrame + 1;

    }


    const sourceX =
        FRAME_X[column];

    const sourceY =
        FRAME_Y[row];


    ctx.drawImage(

        playerSprite,

        sourceX,
        sourceY,

        FRAME_WIDTH,
        FRAME_HEIGHT,

        player.x - 24,
        player.y - 42,

        48,
        48

    );

}


/* =========================================================
   DRAW FOUNTAIN FOREGROUND
========================================================= */

/*
   IMPORTANT FIX:

   The previous version redrew a large polygon of the
   scenery after the player.

   That polygon also contained the staircase behind the
   fountain, which caused the staircase to appear on top
   of the player's head.

   This version ONLY covers the very bottom/front portion
   of the fountain.

   Result:

       HEAD       -> visible
       BODY       -> visible
       FEET       -> can disappear behind fountain
       STAIRCASE  -> never drawn over the player
*/

function drawFountainForeground() {

    if (!sceneryLoaded) {
        return;
    }


    ctx.save();


    /*
       FRONT BASIN ONLY

       The top edge has intentionally been moved
       downward so that the character's head and
       upper body cannot be covered.

       This is the actual foreground portion,
       rather than the entire fountain area.
    */

    ctx.beginPath();


    ctx.moveTo(
        258,
        180
    );


    ctx.lineTo(
        278,
        187
    );


    ctx.lineTo(
        300,
        193
    );


    ctx.lineTo(
        320,
        196
    );


    ctx.lineTo(
        340,
        193
    );


    ctx.lineTo(
        362,
        187
    );


    ctx.lineTo(
        382,
        180
    );


    /*
       Bottom/front edge.
    */

    ctx.lineTo(
        374,
        197
    );


    ctx.lineTo(
        350,
        205
    );


    ctx.lineTo(
        320,
        209
    );


    ctx.lineTo(
        290,
        205
    );


    ctx.lineTo(
        266,
        197
    );


    ctx.closePath();


    ctx.clip();


    /*
       Redraw the scenery only inside the
       narrow fountain-front mask.
    */

    ctx.drawImage(

        scenerySprite,

        scenerySourceX,
        scenerySourceY,

        scenerySourceWidth,
        scenerySourceHeight,

        0,
        0,

        WIDTH,
        HEIGHT

    );


    ctx.restore();

}


/* =========================================================
   RAIN UPDATE
========================================================= */

function updateRain() {

    for (
        const drop of rain
    ) {

        drop.y += drop.speed;


        if (
            drop.y > HEIGHT
        ) {

            drop.y = -8;


            drop.x =
                Math.random() *
                WIDTH;

        }

    }

}


/* =========================================================
   DRAW RAIN
========================================================= */

function drawRain() {

    ctx.strokeStyle =
        "rgba(150,180,210,0.25)";


    for (
        const drop of rain
    ) {

        ctx.beginPath();


        ctx.moveTo(
            drop.x,
            drop.y
        );


        ctx.lineTo(

            drop.x - 2,

            drop.y +
            drop.length

        );


        ctx.stroke();

    }

}


/* =========================================================
   UI
========================================================= */

function drawUI() {

    const fountainDistance =
        Math.hypot(

            player.x -
            fountain.x,

            player.y -
            fountain.y

        );


    /*
       FLOATING E PROMPT
    */

    if (
        fountainDistance < 84 &&
        messageTimer <= 0
    ) {

        const bob =
            Math.sin(
                Date.now() / 180
            ) * 3;


        const promptX =
            fountain.x;


        const promptY =
            fountain.y -
            60 +
            bob;


        ctx.fillStyle =
            "rgba(10,10,15,0.90)";


        ctx.fillRect(

            promptX - 16,
            promptY - 16,

            32,
            32

        );


        ctx.strokeStyle =
            "#ffffff";


        ctx.lineWidth = 2;


        ctx.strokeRect(

            promptX - 16,
            promptY - 16,

            32,
            32

        );


        ctx.fillStyle =
            "#ffffff";


        ctx.font =
            "bold 18px monospace";


        ctx.textAlign =
            "center";


        ctx.textBaseline =
            "middle";


        ctx.fillText(

            "E",

            promptX,
            promptY

        );


        ctx.textBaseline =
            "alphabetic";

    }


    /*
       DIALOGUE BOX
    */

    if (
        messageTimer > 0
    ) {

        ctx.fillStyle =
            "rgba(10,10,15,0.90)";


        ctx.fillRect(

            40,
            274,

            560,
            34

        );


        ctx.fillStyle =
            "#ffffff";


        ctx.font =
            "bold 14px monospace";


        ctx.textAlign =
            "center";


        ctx.fillText(

            message,

            WIDTH / 2,

            296

        );


        messageTimer--;

    }

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

    /*
       1. Background scenery
    */

    drawScenery();


    /*
       2. Rain behind the character
    */

    drawRain();


    /*
       3. Player
    */

    drawPlayer();


    /*
       4. ONLY the fountain's lower/front rim
          goes over the player.

          The staircase is NOT redrawn here.
    */

    drawFountainForeground();


    /*
       5. UI
    */

    drawUI();

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
