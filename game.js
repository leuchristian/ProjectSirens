"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;


/* =========================================================
   SPRITE
========================================================= */

const playerSprite = new Image();

playerSprite.src =
    "assets/characters/player/player_sprite_sheet.png";

let spriteLoaded = false;

playerSprite.onload = () => {
    spriteLoaded = true;
};


/*
    The source sheet contains four directional poses
    across its top row.

    Approximate order:

    0 = left
    1 = up
    2 = down
    3 = right
*/

const SPRITE_FRAME_WIDTH = 62;
const SPRITE_FRAME_HEIGHT = 64;


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
    y: 125,

    width: 10,
    height: 10,

    speed: 1.5,

    facing: "down",

    moving: false,

    walkTime: 0

};


/* =========================================================
   WORLD
========================================================= */

const walls = [

    // Outer walls
    { x: 12, y: 12, w: 296, h: 6 },
    { x: 12, y: 162, w: 296, h: 6 },
    { x: 12, y: 12, w: 6, h: 156 },
    { x: 302, y: 12, w: 6, h: 156 },

    // Upper rooms
    { x: 45, y: 45, w: 80, h: 6 },
    { x: 195, y: 45, w: 80, h: 6 }

];


/* =========================================================
   FOUNTAIN
========================================================= */

const fountain = {

    x: 160,
    y: 75,

    radius: 20,

    interactMessage:
        "The fountain water is strangely calming."

};


/* =========================================================
   PLANTS
========================================================= */

const plants = [

    { x: 35, y: 35 },
    { x: 55, y: 35 },
    { x: 265, y: 35 },
    { x: 285, y: 35 },

    { x: 35, y: 145 },
    { x: 285, y: 145 }

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
            x - player.width / 2 < wall.x + wall.w &&
            y + player.height / 2 > wall.y &&
            y - player.height / 2 < wall.y + wall.h
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

    if (keys["w"] || keys["arrowup"]) {

        dy -= 1;

        player.facing = "up";

    }

    if (keys["s"] || keys["arrowdown"]) {

        dy += 1;

        player.facing = "down";

    }

    if (keys["a"] || keys["arrowleft"]) {

        dx -= 1;

        player.facing = "left";

    }

    if (keys["d"] || keys["arrowright"]) {

        dx += 1;

        player.facing = "right";

    }


    player.moving =
        dx !== 0 || dy !== 0;


    if (dx !== 0 && dy !== 0) {

        dx *= 0.7071;
        dy *= 0.7071;

    }


    const newX =
        player.x +
        dx * player.speed;

    const newY =
        player.y +
        dy * player.speed;


    if (!collidesWithWall(newX, player.y)) {

        player.x = newX;

    }


    if (!collidesWithWall(player.x, newY)) {

        player.y = newY;

    }


    if (player.moving) {

        player.walkTime += 0.18;

    } else {

        player.walkTime = 0;

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

    const data =
        JSON.parse(save);

    player.x = data.x;
    player.y = data.y;

}


/* =========================================================
   DRAW WORLD
========================================================= */

function drawWorld() {

    // Floor

    ctx.fillStyle = "#202026";

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    // Floor tiles

    ctx.strokeStyle = "#292931";

    for (let x = 18; x < 302; x += 16) {

        for (let y = 18; y < 162; y += 16) {

            ctx.strokeRect(
                x,
                y,
                16,
                16
            );

        }

    }


    // Walls

    ctx.fillStyle = "#464650";

    for (const wall of walls) {

        ctx.fillRect(
            wall.x,
            wall.y,
            wall.w,
            wall.h
        );

    }


    // Plants

    for (const plant of plants) {

        ctx.fillStyle = "#214b35";

        ctx.fillRect(
            plant.x - 4,
            plant.y - 5,
            8,
            8
        );

        ctx.fillStyle = "#356d49";

        ctx.fillRect(
            plant.x - 2,
            plant.y - 7,
            4,
            4
        );

    }


    // Fountain

    ctx.beginPath();

    ctx.fillStyle = "#34343d";

    ctx.arc(
        fountain.x,
        fountain.y,
        fountain.radius + 4,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.fillStyle = "#375d78";

    ctx.arc(
        fountain.x,
        fountain.y,
        fountain.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Animated fountain water

    const pulse =
        Math.sin(Date.now() / 300) * 2;

    ctx.beginPath();

    ctx.strokeStyle = "#78a9c5";

    ctx.arc(
        fountain.x,
        fountain.y,
        9 + pulse,
        0,
        Math.PI * 2
    );

    ctx.stroke();

}


/* =========================================================
   PLAYER SPRITE
========================================================= */

function getFacingFrame() {

    switch (player.facing) {

        case "left":
            return 0;

        case "up":
            return 1;

        case "down":
            return 2;

        case "right":
            return 3;

        default:
            return 2;

    }

}


function drawPlayer() {

    /*
        If the image hasn't loaded yet,
        use a tiny temporary placeholder.
    */

    if (!spriteLoaded) {

        ctx.fillStyle = "#b13d68";

        ctx.fillRect(
            player.x - 5,
            player.y - 5,
            10,
            10
        );

        return;

    }


    const frame =
        getFacingFrame();


    /*
        Subtle bob while walking.
        This gives the character a little life
        before we replace it with the full
        walking animation.
    */

    let bob = 0;

    if (player.moving) {

        bob =
            Math.sin(player.walkTime) * 1.2;

    }


    /*
        Draw the sprite larger than its original
        game-space footprint.
    */

    const drawWidth = 22;
    const drawHeight = 23;


    const sourceX =
        frame * SPRITE_FRAME_WIDTH;


    const sourceY = 0;


    ctx.drawImage(

        playerSprite,

        sourceX,
        sourceY,

        SPRITE_FRAME_WIDTH,
        SPRITE_FRAME_HEIGHT,

        player.x - drawWidth / 2,
        player.y - drawHeight + 4 + bob,
        drawWidth,
        drawHeight

    );

}


/* =========================================================
   RAIN
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
            "rgba(10,10,15,0.85)";

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
   GAME LOOP
========================================================= */

function update() {

    updatePlayer();

    updateRain();

}


function draw() {

    drawWorld();

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
   START GAME
========================================================= */

loadGame();

gameLoop();"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

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
    y: 125,

    width: 10,
    height: 10,

    speed: 1.5,

    facing: "down"

};


/* =========================================================
   WORLD
========================================================= */

const walls = [

    // Outer walls
    { x: 12, y: 12, w: 296, h: 6 },
    { x: 12, y: 162, w: 296, h: 6 },
    { x: 12, y: 12, w: 6, h: 156 },
    { x: 302, y: 12, w: 6, h: 156 },

    // Upper rooms
    { x: 45, y: 45, w: 80, h: 6 },
    { x: 195, y: 45, w: 80, h: 6 }

];


/* =========================================================
   FOUNTAIN
========================================================= */

const fountain = {

    x: 160,
    y: 75,

    radius: 20,

    interactMessage:
        "The fountain water is strangely calming."

};


/* =========================================================
   PLANTS
========================================================= */

const plants = [

    { x: 35, y: 35 },
    { x: 55, y: 35 },
    { x: 265, y: 35 },
    { x: 285, y: 35 },

    { x: 35, y: 145 },
    { x: 285, y: 145 }

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
            x - player.width / 2 < wall.x + wall.w &&
            y + player.height / 2 > wall.y &&
            y - player.height / 2 < wall.y + wall.h
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

    if (keys["w"] || keys["arrowup"]) {
        dy -= 1;
        player.facing = "up";
    }

    if (keys["s"] || keys["arrowdown"]) {
        dy += 1;
        player.facing = "down";
    }

    if (keys["a"] || keys["arrowleft"]) {
        dx -= 1;
        player.facing = "left";
    }

    if (keys["d"] || keys["arrowright"]) {
        dx += 1;
        player.facing = "right";
    }

    if (dx !== 0 && dy !== 0) {

        dx *= 0.7071;
        dy *= 0.7071;

    }

    const newX =
        player.x +
        dx * player.speed;

    const newY =
        player.y +
        dy * player.speed;


    if (!collidesWithWall(newX, player.y)) {
        player.x = newX;
    }

    if (!collidesWithWall(player.x, newY)) {
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

    const data =
        JSON.parse(save);

    player.x = data.x;
    player.y = data.y;

}


/* =========================================================
   DRAWING
========================================================= */

function drawWorld() {

    // Floor
    ctx.fillStyle = "#202026";
    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    // Floor tiles
    ctx.strokeStyle = "#292931";

    for (let x = 18; x < 302; x += 16) {

        for (let y = 18; y < 162; y += 16) {

            ctx.strokeRect(
                x,
                y,
                16,
                16
            );

        }

    }


    // Walls

    ctx.fillStyle = "#464650";

    for (const wall of walls) {

        ctx.fillRect(
            wall.x,
            wall.y,
            wall.w,
            wall.h
        );

    }


    // Plants

    for (const plant of plants) {

        ctx.fillStyle = "#214b35";

        ctx.fillRect(
            plant.x - 4,
            plant.y - 5,
            8,
            8
        );

        ctx.fillStyle = "#356d49";

        ctx.fillRect(
            plant.x - 2,
            plant.y - 7,
            4,
            4
        );

    }


    // Fountain

    ctx.beginPath();

    ctx.fillStyle = "#34343d";

    ctx.arc(
        fountain.x,
        fountain.y,
        fountain.radius + 4,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.fillStyle = "#375d78";

    ctx.arc(
        fountain.x,
        fountain.y,
        fountain.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Fountain water

    const pulse =
        Math.sin(Date.now() / 300) * 2;

    ctx.beginPath();

    ctx.strokeStyle = "#78a9c5";

    ctx.arc(
        fountain.x,
        fountain.y,
        9 + pulse,
        0,
        Math.PI * 2
    );

    ctx.stroke();

}


/* =========================================================
   PLAYER DRAW
========================================================= */

function drawPlayer() {

    ctx.fillStyle = "#111116";

    ctx.fillRect(
        player.x - 5,
        player.y - 6,
        10,
        10
    );


    // Hair

    ctx.fillStyle = "#e4e4e8";

    ctx.fillRect(
        player.x - 4,
        player.y - 7,
        8,
        3
    );


    // Jacket

    ctx.fillStyle = "#b13d68";

    ctx.fillRect(
        player.x - 4,
        player.y - 2,
        8,
        7
    );

}


/* =========================================================
   RAIN DRAWING
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
            "rgba(10,10,15,0.85)";

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
   GAME LOOP
========================================================= */

function update() {

    updatePlayer();

    updateRain();

}


function draw() {

    drawWorld();

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
