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
    console.log("Player sprite loaded.");
};

playerSprite.onerror = function () {
    console.warn("Player sprite could not be loaded.");
};

playerSprite.src =
    "assets/characters/player/player_sprite_sheet.png";


/* =========================================================
SCENERY
========================================================= */

/*
    We try several possible locations.

    This prevents the game from getting stuck if the
    scenery file was uploaded somewhere slightly different.
*/

const sceneryPaths = [

    "assets/scenery/project_sirens_scenery_transparent.png",

    "assets/scenery.png",

    "assets/project_sirens_scenery_transparent.png",

    "project_sirens_scenery_transparent.png",

    "assets/scenery/scenery.png"

];


const scenerySprite = new Image();

let scenerySpriteLoaded = false;

let sceneryPathIndex = 0;


function tryNextSceneryPath() {

    if (
        sceneryPathIndex >=
        sceneryPaths.length
    ) {

        console.warn(
            "Project Sirens scenery could not be found."
        );

        return;

    }


    const path =
        sceneryPaths[sceneryPathIndex];


    console.log(
        "Trying scenery:",
        path
    );


    scenerySprite.src = path;

}


scenerySprite.onload = function () {

    scenerySpriteLoaded = true;

    console.log(
        "Scenery loaded successfully from:",
        sceneryPaths[sceneryPathIndex]
    );

};


scenerySprite.onerror = function () {

    sceneryPathIndex++;

    tryNextSceneryPath();

};


tryNextSceneryPath();


/* =========================================================
INPUT
========================================================= */

const keys = {};


window.addEventListener(
    "keydown",
    (event) => {

        const key =
            event.key.toLowerCase();

        keys[key] = true;


        if (key === "e") {

            interact();

        }

    }
);


window.addEventListener(
    "keyup",
    (event) => {

        keys[
            event.key.toLowerCase()
        ] = false;

    }
);


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

const walls = [

    {
        x: 12,
        y: 12,
        w: 10,
        h: 156
    },

    {
        x: 298,
        y: 12,
        w: 10,
        h: 156
    },

    {
        x: 12,
        y: 12,
        w: 296,
        h: 8
    },

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

    const distance =
        Math.hypot(

            player.x -
            fountain.x,

            player.y -
            fountain.y

        );


    if (
        distance < 32
    ) {

        showMessage(
            fountain.interactMessage
        );

        saveGame();

    }

}


/* =========================================================
COLLISION
========================================================= */

function collidesWithWall(
    x,
    y
) {

    for (
        const wall of walls
    ) {

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
        dx *
        player.speed;


    const newY =
        player.y +
        dy *
        player.speed;


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


    /* Walking animation */

    if (
        player.moving
    ) {

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
            typeof data.x ===
            "number"
        ) {

            player.x =
                data.x;

        }


        if (
            typeof data.y ===
            "number"
        ) {

            player.y =
                data.y;

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
        Dark background underneath the transparent PNG.
    */

    ctx.fillStyle =
        "#111217";


    ctx.fillRect(

        0,

        0,

        WIDTH,

        HEIGHT

    );


    if (
        !scenerySpriteLoaded
    ) {

        /*
            IMPORTANT:

            We no longer display a permanent
            loading screen.

            The game continues running normally
            while the scenery is being loaded.
        */

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
        The scenery image is:

        1536 × 1024

        Our game viewport is:

        320 × 180

        We crop the scenery slightly vertically
        so it fits the game's 16:9 view.
    */

    ctx.drawImage(

        scenerySprite,

        0,
        80,

        1536,
        864,

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
        Temporary fallback player.
    */

    if (
        !playerSpriteLoaded
    ) {

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
        Player sheet:

        0 = LEFT
        1 = UP
        2 = DOWN
        3 = RIGHT
    */

    let frame = 2;


    if (
        player.facing ===
        "left"
    ) {

        frame = 0;

    }


    if (
        player.facing ===
        "up"
    ) {

        frame = 1;

    }


    if (
        player.facing ===
        "down"
    ) {

        frame = 2;

    }


    if (
        player.facing ===
        "right"
    ) {

        frame = 3;

    }


    const sourceX =
        frame * 64;


    let bob = 0;


    if (
        player.moving &&
        player.animationFrame === 1
    ) {

        bob = -2;

    }


    ctx.drawImage(

        playerSprite,

        sourceX,

        0,

        64,

        64,

        player.x - 12,

        player.y - 21 + bob,

        24,

        24

    );

}


/* =========================================================
RAIN
========================================================= */

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

    drawScenery();

    drawRain();

    drawPlayer();

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
