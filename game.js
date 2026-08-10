"use strict";

/* =========================================================
   CANVAS
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
    console.log(
        "Player sprite could not be loaded."
    );
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

    console.log(
        "Scenery image could not be loaded."
    );

};

scenerySprite.src =
    "assets/scenery/project_sirens_scenery_transparent.png";


/* =========================================================
   SCENERY CROP
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
            (
                imageWidth -
                scenerySourceWidth
            ) / 2;

        scenerySourceY = 0;

    }
    else {

        scenerySourceWidth =
            imageWidth;

        scenerySourceHeight =
            imageWidth / canvasRatio;

        scenerySourceX = 0;

        scenerySourceY =
            (
                imageHeight -
                scenerySourceHeight
            ) / 2;

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
   FOUNTAIN COLLISION
========================================================= */

/*
   This is deliberately separate from the visual
   fountain radius.

   The player cannot enter the fountain basin.

   However, because the collision is relatively narrow,
   the player can walk around either side and reach
   the area behind the fountain.
*/

const fountainCollision = {

    centerX: 320,

    centerY: 140,

    radiusX: 62,

    radiusY: 21

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
   SCENERY COLLISIONS
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


    /* Bottom door */

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
   MESSAGE
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


    /*
       Interaction only works when the player is
       near the fountain, but not inside it.
    */

    if (
        distance < 84 &&
        !insideFountain(
            player.x,
            player.y
        )
    ) {

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
   FOUNTAIN COLLISION TEST
========================================================= */

function insideFountain(
    x,
    y
) {

    /*
       Expand the collision ellipse slightly by the
       player's body size.

       This prevents the sprite from visually entering
       the fountain even though its center has not yet
       crossed the collision boundary.
    */

    const rx =
        fountainCollision.radiusX +
        player.width / 2;

    const ry =
        fountainCollision.radiusY +
        player.height / 2;


    const dx =
        x -
        fountainCollision.centerX;

    const dy =
        y -
        fountainCollision.centerY;


    const normalizedX =
        dx / rx;

    const normalizedY =
        dy / ry;


    return (
        normalizedX *
        normalizedX +

        normalizedY *
        normalizedY

    ) <= 1;

}


/* =========================================================
   COLLISION
========================================================= */

function collidesWithWall(
    x,
    y
) {

    /*
       WORLD BOUNDARIES
    */

    for (
        const wall of walls
    ) {

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


    /*
       SCENERY
    */

    for (
        const object of
        sceneryCollisions
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
       FOUNTAIN

       This is the important change.

       The entire basin is now treated as an
       obstacle rather than only its front edge.
    */

    if (
        insideFountain(
            x,
            y
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


    /*
       Horizontal movement.
    */

    if (
        !collidesWithWall(
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

    /*
       Never save an invalid fountain position.
    */

    if (
        insideFountain(
            player.x,
            player.y
        )
    ) {

        return;

    }


    const saveData = {

        x: player.x,

        y: player.y

    };


    localStorage.setItem(

        SAVE_KEY,

        JSON.stringify(
            saveData
        )

    );

}


/* =========================================================
   LOAD GAME
========================================================= */

function loadGame() {

    const saved =
        localStorage.getItem(
            SAVE_KEY
        );


    /*
       No save.
    */

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

            /*
               Do not restore an old position if
               it places the player inside the fountain.
            */

            if (
                !insideFountain(
                    data.x,
                    data.y
                )
            ) {

                player.x = data.x;

                player.y = data.y;

            }
            else {

                player.x = SPAWN_X;

                player.y = SPAWN_Y;

            }

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
   FOUNTAIN FOREGROUND
========================================================= */

/*
   IMPORTANT VISUAL LAYERING

   We do NOT redraw the staircase.

   We do NOT redraw the carpet.

   We only redraw the lower/front lip of the
   fountain itself.

   This gives us:

       PLAYER HEAD       visible
       PLAYER BODY       visible
       PLAYER FEET       partly hidden
       FOUNTAIN FRONT    foreground
       STAIRCASE         never over player
*/

function drawFountainForeground() {

    if (!sceneryLoaded) {
        return;
    }


    ctx.save();


    ctx.beginPath();


    /*
       LEFT FRONT EDGE
    */

    ctx.moveTo(
        252,
        148
    );


    /*
       TOP edge of front basin
    */

    ctx.lineTo(
        270,
        153
    );


    ctx.lineTo(
        292,
        158
    );


    ctx.lineTo(
        320,
        161
    );


    ctx.lineTo(
        348,
        158
    );


    ctx.lineTo(
        370,
        153
    );


    ctx.lineTo(
        388,
        148
    );


    /*
       FRONT / LOWER edge
    */

    ctx.lineTo(
        380,
        164
    );


    ctx.lineTo(
        360,
        172
    );


    ctx.lineTo(
        338,
        177
    );


    ctx.lineTo(
        320,
        179
    );


    ctx.lineTo(
        302,
        177
    );


    ctx.lineTo(
        280,
        172
    );


    ctx.lineTo(
        260,
        164
    );


    ctx.closePath();


    ctx.clip();


    /*
       Repaint only this tiny fountain-front
       region from the scenery image.
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
   RAIN DRAW
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
       E PROMPT
    */

    if (
        fountainDistance < 84 &&
        fountainDistance > 55 &&
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
       DIALOGUE
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
            "14px monospace";


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
       BACKGROUND
    */

    drawScenery();


    /*
       RAIN
    */

    drawRain();


    /*
       PLAYER
    */

    drawPlayer();


    /*
       FOUNTAIN FRONT

       Only the lower front lip is placed
       over the player.
    */

    drawFountainForeground();


    /*
       UI
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
