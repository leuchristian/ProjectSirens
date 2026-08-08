"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;


/* =========================================================
   PLAYER IMAGE
========================================================= */

const playerSprite = new Image();

let playerLoaded = false;

playerSprite.onload = function () {
    playerLoaded = true;
};

playerSprite.src =
    "assets/characters/player/player_sprite_sheet.png";


/* =========================================================
   SCENERY IMAGE
========================================================= */

const scenerySprite = new Image();

let sceneryLoaded = false;

scenerySprite.onload = function () {

    sceneryLoaded = true;

};

scenerySprite.onerror = function () {

    sceneryLoaded = false;

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

    x: 160,
    y: 115,

    width: 10,
    height: 10,

    speed: 1.5,

    facing: "down",

    moving: false,

    animationFrame: 0,

    animationTimer: 0

};


/* =========================================================
   SPRITE SHEET
========================================================= */

/*
   Four columns:

   0 = left
   1 = up
   2 = down
   3 = right

   Rows:

   0 = idle
   1 = walk
   2 = walk
   3 = walk
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
   MESSAGE
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

            y + player.height / 2 > wall.y &&

            y - player.height / 2 <
            wall.y + wall.h

        ) {

            return true;

        }

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


    if (dx !== 0 && dy !== 0) {

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


    /* Walking animation */

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
   SAVE
========================================================= */

function saveGame() {

    const data = {

        x: player.x,

        y: player.y

    };


    localStorage.setItem(

        "projectSirensSave",

        JSON.stringify(data)

    );

}


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
            typeof data.x === "number"
        ) {

            player.x = data.x;

        }


        if (
            typeof data.y === "number"
        ) {

            player.y = data.y;

        }

    }
    catch (error) {

        console.log(
            "Save could not be loaded."
        );

    }

}


/* =========================================================
   DRAW SCENERY
========================================================= */

function drawScenery() {

    /*
       Always draw a background first.
    */

    ctx.fillStyle = "#202026";

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    /*
       If scenery loaded, draw it.

       Otherwise the game continues with
       the plain background.
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
       If sprite hasn't loaded, draw a simple
       temporary character.
    */

    if (!playerLoaded) {

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
       Direction column.
    */

    let column = 2;


    if (player.facing === "left") {

        column = 0;

    }
    else if (player.facing === "up") {

        column = 1;

    }
    else if (player.facing === "down") {

        column = 2;

    }
    else if (player.facing === "right") {

        column = 3;

    }


    /*
       Animation row.

       Idle = row 0

       Walking =
       rows 1, 2, 3
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
       Draw character.
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
   RAIN UPDATE
========================================================= */

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


/* =========================================================
   RAIN DRAW
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
            drop.y + drop.length
        );

        ctx.stroke();

    }

}


/* =========================================================
   UI
========================================================= */

function drawUI() {

    if (messageTimer > 0) {

        ctx.fillStyle =
            "rgba(10,10,15,0.90)";

        ctx.fillRect(
            20,
            137,
            280,
            17
        );


        ctx.fillStyle = "#ffffff";

        ctx.font =
            "7px monospace";

        ctx.textAlign = "center";

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
   START
========================================================= */

loadGame();

gameLoop();
