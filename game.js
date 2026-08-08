"use strict";


/* =========================================================
   CANVAS
========================================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;


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
   INPUT
========================================================= */

const keys = {};


window.addEventListener("keydown", function (event) {

    const key = event.key.toLowerCase();

    keys[key] = true;


    /*
        Prevent the browser from scrolling
        when the arrow keys are pressed.
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

});


window.addEventListener("keyup", function (event) {

    keys[event.key.toLowerCase()] = false;

});


/* =========================================================
   PLAYER
========================================================= */

/*
    This is the player's starting position.

    The character starts on the stairs,
    directly below the fountain.
*/

const SPAWN_X = 160;
const SPAWN_Y = 110;


const player = {

    x: SPAWN_X,
    y: SPAWN_Y,

    width: 10,
    height: 10,

    speed: 1.5,

    facing: "up",

    moving: false,

    animationFrame: 0,

    animationTimer: 0

};


/* =========================================================
   PLAYER SPRITE SHEET
========================================================= */

/*
    Sprite sheet directions:

    0 = left
    1 = up
    2 = down
    3 = right

    Rows:

    0 = idle
    1 = walking frame 1
    2 = walking frame 2
    3 = walking frame 3
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

const fountain = {

    x: 160,

    y: 70,

    radius: 20,

    interactMessage:
        "The fountain water is strangely calming."

};


/* =========================================================
   WALLS
========================================================= */

const walls = [

    /*
        Left wall
    */

    {
        x: 12,
        y: 12,
        w: 10,
        h: 156
    },


    /*
        Right wall
    */

    {
        x: 298,
        y: 12,
        w: 10,
        h: 156
    },


    /*
        Top wall
    */

    {
        x: 12,
        y: 12,
        w: 296,
        h: 8
    },


    /*
        Bottom wall
    */

    {
        x: 12,
        y: 162,
        w: 296,
        h: 8
    }

];


/* =========================================================
   RAIN
========================================================= */

const rain = [];


for (let i = 0; i < 90; i++) {

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


    /*
        The player must be close enough
        to interact with the fountain.
    */

    if (distance < 42) {

        showMessage(

            fountain.interactMessage

        );

        saveGame();

    }

}


/* =========================================================
   COLLISION
========================================================= */

function collidesWithWall(x, y) {

    /*
        Check normal walls.
    */

    for (const wall of walls) {

        if (

            x +
                player.width / 2 >
                wall.x &&

            x -
                player.width / 2 <
                wall.x +
                wall.w &&

            y +
                player.height / 2 >
                wall.y &&

            y -
                player.height / 2 <
                wall.y +
                wall.h

        ) {

            return true;

        }

    }


    /*
        Fountain collision.

        The fountain is treated as a circular
        solid object.
    */

    const fountainCollisionRadius = 31;


    const fountainDistance =
        Math.hypot(

            x -
                fountain.x,

            y -
                fountain.y

        );


    if (

        fountainDistance <
        fountainCollisionRadius

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
        Normalize diagonal movement.
    */

    if (

        dx !== 0 &&
        dy !== 0

    ) {

        dx *= 0.7071;

        dy *= 0.7071;

    }


    /*
        Determine whether player
        is currently walking.
    */

    player.moving =
        dx !== 0 ||
        dy !== 0;


    /*
        Calculate new position.
    */

    const newX =
        player.x +
        dx *
        player.speed;


    const newY =
        player.y +
        dy *
        player.speed;


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

/*
    Version 2 deliberately uses a new save key.

    This means the old save that placed the character
    directly on the fountain will NOT be loaded.
*/

const SAVE_KEY =
    "projectSirensSaveV2";


function saveGame() {

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


function loadGame() {

    const saved =
        localStorage.getItem(
            SAVE_KEY
        );


    /*
        No new save exists.

        Start on the stairs.
    */

    if (!saved) {

        player.x =
            SPAWN_X;

        player.y =
            SPAWN_Y;

        return;

    }


    try {

        const data =
            JSON.parse(saved);


        if (

            typeof data.x ===
            "number" &&

            typeof data.y ===
            "number"

        ) {

            player.x =
                data.x;

            player.y =
                data.y;

        }
        else {

            player.x =
                SPAWN_X;

            player.y =
                SPAWN_Y;

        }

    }
    catch (error) {

        console.log(
            "Save could not be loaded."
        );


        player.x =
            SPAWN_X;

        player.y =
            SPAWN_Y;

    }

}


/* =========================================================
   DRAW SCENERY
========================================================= */

function drawScenery() {

    /*
        Fallback background.
    */

    ctx.fillStyle =
        "#202026";


    ctx.fillRect(

        0,
        0,
        WIDTH,
        HEIGHT

    );


    /*
        Draw the actual scenery.
    */

    if (sceneryLoaded) {

        ctx.drawImage(

            scenerySprite,

            0,
            0,

            scenerySprite.naturalWidth,
            scenerySprite.naturalHeight,

            0,
            0,

            WIDTH,
            HEIGHT

        );

    }

}


/* =========================================================
   DRAW PLAYER
========================================================= */

function drawPlayer() {

    /*
        Fallback character in case
        the sprite hasn't loaded.
    */

    if (!playerLoaded) {

        ctx.fillStyle =
            "#111116";


        ctx.fillRect(

            player.x - 5,
            player.y - 6,

            10,
            10

        );


        ctx.fillStyle =
            "#e4e4e8";


        ctx.fillRect(

            player.x - 4,
            player.y - 7,

            8,
            3

        );


        ctx.fillStyle =
            "#b13d68";


        ctx.fillRect(

            player.x - 4,
            player.y - 2,

            8,
            7

        );


        return;

    }


    /*
        Determine sprite-sheet column
        based on direction.
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
        Determine animation row.
    */

    let row = 0;


    if (player.moving) {

        row =
            player.animationFrame +
            1;

    }


    const sourceX =
        FRAME_X[column];


    const sourceY =
        FRAME_Y[row];


    /*
        Draw sprite.
    */

    ctx.drawImage(

        playerSprite,

        sourceX,
        sourceY,

        FRAME_WIDTH,
        FRAME_HEIGHT,

        player.x - 12,
        player.y - 21,

        24,
        24

    );

}


/* =========================================================
   UPDATE RAIN
========================================================= */

function updateRain() {

    for (const drop of rain) {

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


/* =========================================================
   DRAW RAIN
========================================================= */

function drawRain() {

    ctx.strokeStyle =
        "rgba(150,180,210,0.25)";


    for (const drop of rain) {

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
   DRAW UI
========================================================= */

function drawUI() {

    /*
        Distance from player to fountain.
    */

    const fountainDistance =
        Math.hypot(

            player.x -
                fountain.x,

            player.y -
                fountain.y

        );


    /*
        Floating E prompt.

        It appears only when the player
        is close enough to interact.
    */

    if (

        fountainDistance < 42 &&
        messageTimer <= 0

    ) {

        /*
            Gentle floating animation.
        */

        const bob =
            Math.sin(
                Date.now() / 180
            ) * 1.5;


        const promptX =
            fountain.x;


        const promptY =
            fountain.y -
            30 +
            bob;


        /*
            Prompt background.
        */

        ctx.fillStyle =
            "rgba(10,10,15,0.90)";


        ctx.fillRect(

            promptX - 8,

            promptY - 8,

            16,

            16

        );


        /*
            Prompt border.
        */

        ctx.strokeStyle =
            "#ffffff";


        ctx.strokeRect(

            promptX - 8,

            promptY - 8,

            16,

            16

        );


        /*
            E.
        */

        ctx.fillStyle =
            "#ffffff";


        ctx.font =
            "bold 9px monospace";


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
        Dialogue box.
    */

    if (messageTimer > 0) {

        ctx.fillStyle =
            "rgba(10,10,15,0.90)";


        ctx.fillRect(

            20,
            137,

            280,
            17

        );


        ctx.fillStyle =
            "#ffffff";


        ctx.font =
            "7px monospace";


        ctx.textAlign =
            "center";


        ctx.fillText(

            message,

            WIDTH / 2,

            148

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

    drawScenery();

    drawRain();

    drawPlayer();

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
   START GAME
========================================================= */

loadGame();

gameLoop();
