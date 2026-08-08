"use strict";


/* =========================================================
   CANVAS / GAME RESOLUTION
========================================================= */

/*
   We are now using a 640 x 360 game canvas.

   This is twice the previous 320 x 180 resolution while
   keeping the same 16:9 aspect ratio.
*/

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");


canvas.width = 640;
canvas.height = 360;


/*
   Make the game visually larger on the webpage while
   preserving the 16:9 aspect ratio.

   The browser can shrink it automatically on smaller screens.
*/

canvas.style.width = "min(960px, 92vw)";
canvas.style.height = "auto";

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

};


scenerySprite.onerror = function () {

    console.log(
        "Scenery image could not be loaded."
    );

};


scenerySprite.src =
    "assets/scenery/project_sirens_scenery_transparent.png";


/* =========================================================
   SCENERY DISPLAY SETTINGS
========================================================= */

/*
   The scenery artwork is larger than the game canvas.

   Instead of stretching the artwork vertically, we use
   a 16:9 "cover" calculation.

   This preserves the proportions of the artwork.
*/

let sceneryScale = 1;

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

        /*
           Image is wider than the game.

           Crop the left and right.
        */

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

        /*
           Image is taller than the game.

           Crop the top and bottom.
        */

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


        /*
           Stop arrow keys from scrolling
           the browser page.
        */

        if (
            key === "arrowup" ||
            key === "arrowdown" ||
            key === "arrowleft" ||
            key === "arrowright"
        ) {

            event.preventDefault();

        }


        /*
           Fountain interaction.
        */

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

/*
   Starting position is on the stairs directly
   in front of the fountain.

   These coordinates are now based on 640 x 360.
*/

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

/*
   Sprite sheet layout:

       Column 0 = LEFT
       Column 1 = UP
       Column 2 = DOWN
       Column 3 = RIGHT

       Row 0 = idle
       Row 1 = walking frame 1
       Row 2 = walking frame 2
       Row 3 = walking frame 3
*/


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

/*
   Fountain position in the new 640 x 360
   coordinate system.
*/

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

    /*
       LEFT
    */

    {
        x: 24,
        y: 24,
        w: 20,
        h: 312
    },


    /*
       RIGHT
    */

    {
        x: 596,
        y: 24,
        w: 20,
        h: 312
    },


    /*
       TOP
    */

    {
        x: 24,
        y: 24,
        w: 592,
        h: 16
    },


    /*
       BOTTOM
    */

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

/*
   These coordinates have been doubled from the
   previous 320 x 180 game.
*/

const sceneryCollisions = [

    /*
       -----------------------------------------------------
       WINDOWS
       -----------------------------------------------------

       The character may approach the windows,
       but cannot walk onto them.
    */

    {
        x: 182,
        y: 20,
        w: 276,
        h: 70
    },


    /*
       -----------------------------------------------------
       UPPER LEFT BOOKCASE
       -----------------------------------------------------
    */

    {
        x: 54,
        y: 54,
        w: 76,
        h: 48
    },


    /*
       -----------------------------------------------------
       UPPER RIGHT CABINET
       -----------------------------------------------------
    */

    {
        x: 440,
        y: 52,
        w: 96,
        h: 54
    },


    /*
       -----------------------------------------------------
       UPPER LEFT TABLE
       -----------------------------------------------------
    */

    {
        x: 44,
        y: 112,
        w: 86,
        h: 34
    },


    /*
       -----------------------------------------------------
       UPPER RIGHT TABLE
       -----------------------------------------------------
    */

    {
        x: 510,
        y: 112,
        w: 86,
        h: 34
    },


    /*
       -----------------------------------------------------
       LOWER LEFT FURNITURE
       -----------------------------------------------------
    */

    {
        x: 50,
        y: 238,
        w: 92,
        h: 36
    },


    /*
       -----------------------------------------------------
       LOWER RIGHT FURNITURE
       -----------------------------------------------------
    */

    {
        x: 458,
        y: 238,
        w: 116,
        h: 36
    },


    /*
       -----------------------------------------------------
       LOWER LEFT PLANT
       -----------------------------------------------------
    */

    {
        x: 76,
        y: 210,
        w: 30,
        h: 30
    },


    /*
       -----------------------------------------------------
       LOWER RIGHT PLANT
       -----------------------------------------------------
    */

    {
        x: 524,
        y: 210,
        w: 30,
        h: 30
    },


    /*
       -----------------------------------------------------
       LOWER CENTER DOOR
       -----------------------------------------------------
    */

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

    /*
       OUTER WALLS
    */

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


    /*
       SCENERY
    */

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
       =====================================================
       FOUNTAIN FRONT COLLISION
       =====================================================

       IMPORTANT:

       The player is allowed to walk behind
       the fountain.

       Only the front rim blocks him.
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


    /*
       UP
    */

    if (
        keys["w"] ||
        keys["arrowup"]
    ) {

        dy = -1;

        player.facing = "up";

    }


    /*
       DOWN
    */

    if (
        keys["s"] ||
        keys["arrowdown"]
    ) {

        dy = 1;

        player.facing = "down";

    }


    /*
       LEFT
    */

    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {

        dx = -1;

        player.facing = "left";

    }


    /*
       RIGHT
    */

    if (
        keys["d"] ||
        keys["arrowright"]
    ) {

        dx = 1;

        player.facing = "right";

    }


    /*
       Diagonal movement normalization.
    */

    if (
        dx !== 0 &&
        dy !== 0
    ) {

        dx *= 0.7071;

        dy *= 0.7071;

    }


    /*
       Movement state.
    */

    player.moving =
        dx !== 0 ||
        dy !== 0;


    /*
       New position.
    */

    const newX =
        player.x +
        dx * player.speed;


    const newY =
        player.y +
        dy * player.speed;


    /*
       Horizontal collision.
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
       Vertical collision.
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


    /*
       Start at the stairs if no save exists.
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

    /*
       Background while scenery loads.
    */

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


    /*
       Calculate the proper crop.
    */

    calculateSceneryCrop();


    /*
       Draw the scenery without distorting
       its original proportions.
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


    /*
       Character is now approximately twice
       the previous displayed size.
    */

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
   IMPORTANT:

   This is intentionally NOT a large rectangle.

   We only redraw the actual FRONT EDGE of the fountain.

   Therefore:

       CARPET remains behind the character.

       CHARACTER'S HEAD remains visible.

       CHARACTER'S BODY remains visible.

       CHARACTER'S FEET disappear behind
       the fountain's front basin.

       FOUNTAIN FRONT is visually in front.
*/


function drawFountainForeground() {

    if (!sceneryLoaded) {

        return;

    }


    ctx.save();


    /*
       -----------------------------------------------------
       FOUNTAIN FRONT-RIM MASK
       -----------------------------------------------------

       This polygon follows the front portion
       of the fountain.

       It intentionally does NOT include the
       surrounding red carpet.
    */

    ctx.beginPath();


    /*
       Start at the left side of the fountain.
    */

    ctx.moveTo(
        236,
        148
    );


    /*
       Upper edge of the fountain rim.
    */

    ctx.lineTo(
        258,
        156
    );


    ctx.lineTo(
        282,
        164
    );


    ctx.lineTo(
        320,
        172
    );


    ctx.lineTo(
        358,
        164
    );


    ctx.lineTo(
        382,
        156
    );


    ctx.lineTo(
        404,
        148
    );


    /*
       Outer/front lower edge.
    */

    ctx.lineTo(
        394,
        174
    );


    ctx.lineTo(
        372,
        186
    );


    ctx.lineTo(
        344,
        194
    );


    ctx.lineTo(
        320,
        198
    );


    ctx.lineTo(
        296,
        194
    );


    ctx.lineTo(
        268,
        186
    );


    ctx.lineTo(
        246,
        174
    );


    ctx.closePath();


    /*
       Activate the clipping mask.
    */

    ctx.clip();


    /*
       Draw the original scenery again.

       Because of the clipping mask, only the
       fountain front region appears over the player.
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
       =====================================================
       FLOATING E PROMPT
       =====================================================
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


        /*
           Prompt background.
        */

        ctx.fillStyle =
            "rgba(10,10,15,0.90)";


        ctx.fillRect(

            promptX - 16,
            promptY - 16,

            32,
            32

        );


        /*
           Prompt border.
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
       =====================================================
       DIALOGUE BOX
       =====================================================
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
       FOUNTAIN FOREGROUND

       This happens AFTER the player.

       Only the front rim is redrawn, meaning
       the player's feet can disappear behind
       the fountain while his upper body remains
       visible.
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
