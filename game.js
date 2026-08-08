"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;


/* =========================================================
PLAYER SPRITE
========================================================= */

const playerSprite = new Image();

let playerSpriteLoaded = false;

playerSprite.onload = function () {
    playerSpriteLoaded = true;
};

playerSprite.onerror = function () {
    console.warn("Could not load player sprite.");
};

playerSprite.src =
    "assets/characters/player/player_sprite_sheet.png";


/* =========================================================
SCENERY BACKGROUND
========================================================= */

const scenerySprite = new Image();

let scenerySpriteLoaded = false;

scenerySprite.onload = function () {
    scenerySpriteLoaded = true;
};

scenerySprite.onerror = function () {
    console.warn("Could not load scenery image.");
};

scenerySprite.src =
    "assets/scenery/project_sirens_scenery_transparent.png";


/* =========================================================
INPUT
========================================================= */

const keys = {};

window.addEventListener("keydown", (event) => {

    keys[event.key.toLowerCase()] = true;

    if (event.key.toLowerCase() === "e") {
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

    x: 160,
    y: 112,

    width: 10,
    height: 10,

    speed: 1.5,

    facing: "down",

    moving: false,

    animationTimer: 0,

    animationFrame: 0

};


/* =========================================================
WORLD COLLISION
========================================================= */

/*
    These collision areas keep the player from walking
    through the major architectural boundaries.

    We can refine these later after seeing the scenery
    inside the game.
*/

const walls = [

    // Left wall
    {
        x: 12,
        y: 12,
        w: 10,
        h: 156
    },

    // Right wall
    {
        x: 298,
        y: 12,
        w: 10,
        h: 156
    },

    // Top wall
    {
        x: 12,
        y: 12,
        w: 296,
        h: 8
    },

    // Bottom wall
    {
        x: 12,
        y: 162,
        w: 296,
        h: 8
    }

];


/* =========================================================
FOUNTAIN
========================================================= */

const fountain = {

    /*
        The fountain in the scenery is approximately
        in the center of the upper room.
    */

    x: 160,

    y: 62,

    radius: 22,

    interactMessage:
        "The fountain water is strangely calming."

};


/* =========================================================
RAIN
========================================================= */

const rain = [];

for (let i = 0; i < 90; i++) {

    rain.push({

        x: Math.random() * WIDTH,

        y: Math.random() * HEIGHT,

        speed: 1 + Math.random() * 2,

        length: 2 + Math.random() * 4

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
INTERACTION
========================================================= */

function interact() {

    const distance = Math.hypot(

        player.x - fountain.x,

        player.y - fountain.y

    );


    if (distance < 32) {

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

    for (const wall of walls) {

        if (

            x + player.width / 2 > wall.x &&

            x - player.width / 2 <
            wall.x + wall.w &&

            y + player.height / 2 >
            wall.y &&

            y - player.height / 2 <
            wall.y + wall.h

        ) {

            return true;

        }

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


    /* -----------------------------------------
       Walking animation
       ----------------------------------------- */

    if (player.moving) {

        player.animationTimer++;

        if (
            player.animationTimer >= 8
        ) {

            player.animationTimer = 0;

            player.animationFrame++;

            if (
                player.animationFrame > 1
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

    }
    catch (error) {

        console.warn(
            "Could not load saved game."
        );

    }

}


/* =========================================================
DRAW SCENERY
========================================================= */

function drawScenery() {

    /*
        Dark floor underneath the transparent image.
    */

    ctx.fillStyle = "#111217";

    ctx.fillRect(

        0,

        0,

        WIDTH,

        HEIGHT

    );


    if (!scenerySpriteLoaded) {

        /*
            Fallback screen while the scenery
            image is loading.
        */

        ctx.fillStyle = "#202026";

        ctx.fillRect(

            0,

            0,

            WIDTH,

            HEIGHT

        );

        ctx.fillStyle = "#ffffff";

        ctx.font = "8px monospace";

        ctx.textAlign = "center";

        ctx.fillText(

            "Loading Project Sirens...",

            WIDTH / 2,

            HEIGHT / 2

        );

        return;

    }


    /*
        Original scenery:

        1536 × 1024

        Game canvas:

        320 × 180

        The scenery is slightly taller than
        the game's 16:9 view.

        We crop a small amount from the top
        and bottom rather than stretching it.
    */

    const sourceWidth = 1536;

    const sourceHeight = 864;

    const sourceX = 0;

    const sourceY = 80;


    ctx.drawImage(

        scenerySprite,

        sourceX,

        sourceY,

        sourceWidth,

        sourceHeight,

        0,

        0,

        WIDTH,

        HEIGHT

    );

}


/* =========================================================
PLAYER DRAW
========================================================= */

function drawPlayer() {

    /*
        Fallback player while the sprite loads.
    */

    if (!playerSpriteLoaded) {

        ctx.fillStyle = "#111116";

        ctx.fillRect(

            player.x - 5,

            player.y - 6,

            10,

            10

        );


        ctx.fillStyle = "#e4e4e8";

        ctx.fillRect(

            player.x - 4,

            player.y - 7,

            8,

            3

        );


        ctx.fillStyle = "#b13d68";

        ctx.fillRect(

            player.x - 4,

            player.y - 2,

            8,

            7

        );

        return;

    }


    /*
        Player sprite sheet:

        0 = LEFT
        1 = UP
        2 = DOWN
        3 = RIGHT
    */

    let frame = 2;


    if (
        player.facing === "left"
    ) {

        frame = 0;

    }


    if (
        player.facing === "up"
    ) {

        frame = 1;

    }


    if (
        player.facing === "down"
    ) {

        frame = 2;

    }


    if (
        player.facing === "right"
    ) {

        frame = 3;

    }


    const sourceX =
        frame * 64;


    const sourceY = 0;


    /*
        Small walking bob.
    */

    let bob = 0;


    if (player.moving) {

        if (
            player.animationFrame === 1
        ) {

            bob = -2;

        }

    }


    const drawWidth = 24;

    const drawHeight = 24;


    ctx.drawImage(

        playerSprite,

        sourceX,

        sourceY,

        64,

        64,

        player.x -
        drawWidth / 2,

        player.y -
        drawHeight +
        3 +
        bob,

        drawWidth,

        drawHeight

    );

}


/* =========================================================
RAIN
========================================================= */

function updateRain() {

    for (
        const drop of rain
    ) {

        drop.y += drop.speed;


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
UI
========================================================= */

function drawUI() {

    if (
        messageTimer > 0
    ) {

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
GAME LOOP
========================================================= */

function update() {

    updatePlayer();

    updateRain();

}


function draw() {

    /*
        Background scenery first.
    */

    drawScenery();


    /*
        Rain appears over the environment.
    */

    drawRain();


    /*
        Player appears over the environment.
    */

    drawPlayer();


    /*
        UI appears on top of everything.
    */

    drawUI();

}


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
