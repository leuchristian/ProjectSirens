"use strict";

/* =========================================================
   PROJECT SIRENS
   GAME.JS
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
const playerSprite = new Image();

sceneryImage.src =
    "assets/scenery/project_sirens_scenery_transparent.png";

playerSprite.src =
    "assets/characters/player/player_sprite.png";

let sceneryLoaded = false;
let playerSpriteLoaded = false;

sceneryImage.onload = () => {
    sceneryLoaded = true;
};

playerSprite.onload = () => {
    playerSpriteLoaded = true;
};

sceneryImage.onerror = () => {
    console.error(
        "Could not load scenery:",
        sceneryImage.src
    );
};

playerSprite.onerror = () => {
    console.error(
        "Could not load player sprite:",
        playerSprite.src
    );
};


/* =========================================================
   INPUT
   ========================================================= */

const keys = {};

window.addEventListener("keydown", (event) => {

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

window.addEventListener("keyup", (event) => {

    keys[event.key.toLowerCase()] = false;

});


/* =========================================================
   PLAYER
   ========================================================= */

const player = {

    /*
       x/y represents the player's FEET.
    */

    x: 320,
    y: 205,

    width: 14,
    height: 10,

    speed: 1.5,

    facing: "down",

    moving: false,

    animationFrame: 0,

    animationTimer: 0

};


/* =========================================================
   PLAYER SPRITE
   ========================================================= */

const SPRITE_COLUMNS = 4;
const SPRITE_ROWS = 8;

const directionRows = {

    left: 0,
    down: 1,
    right: 2,
    up: 3

};

const animationSpeed = 8;


/* =========================================================
   WORLD BOUNDS
   ========================================================= */

const worldBounds = {

    left: 30,
    right: 610,

    top: 20,
    bottom: 340

};


/* =========================================================
   BACK WALL
   ========================================================= */

const backWall = {

    x: 47,
    y: 20,

    width: 545,
    height: 9

};


/* =========================================================
   FOUNTAIN
   ========================================================= */

const fountain = {

    x: 320,
    y: 125,

    collisionRadiusX: 59,
    collisionRadiusY: 27,

    interactionRadius: 75,

    interactMessage:
        "The fountain water is strangely calming."

};


/* =========================================================
   LOWER FLOOR / STAIR COLLISION
   ========================================================= */

/*
   These zones represent the solid flooring/wall areas
   shown in the collision-zone screenshots.

   The central staircase remains open.
*/


/* LEFT UPPER LEDGE */

const leftUpperLedge = {

    x: 0,
    y: 194,

    width: 214,
    height: 8

};


/* RIGHT UPPER LEDGE */

const rightUpperLedge = {

    x: 426,
    y: 194,

    width: 214,
    height: 8

};


/* LEFT STAIR SIDE */

const leftStairSide = {

    x: 211,
    y: 194,

    width: 8,
    height: 58

};


/* RIGHT STAIR SIDE */

const rightStairSide = {

    x: 421,
    y: 194,

    width: 8,
    height: 58

};


/* LEFT LOWER ROOM OUTER WALL */

const leftLowerWall = {

    x: 49,
    y: 258,

    width: 8,
    height: 83

};


/* RIGHT LOWER ROOM OUTER WALL */

const rightLowerWall = {

    x: 584,
    y: 258,

    width: 8,
    height: 83

};


/* LEFT LOWER ROOM TOP WALL */

const leftLowerTopWall = {

    x: 50,
    y: 256,

    width: 165,
    height: 8

};


/* RIGHT LOWER ROOM TOP WALL */

const rightLowerTopWall = {

    x: 425,
    y: 256,

    width: 160,
    height: 8

};


/* BOTTOM WALL */

const bottomWallLeft = {

    x: 0,
    y: 339,

    width: 294,
    height: 9

};

const bottomWallRight = {

    x: 340,
    y: 339,

    width: 300,
    height: 9

};


/* =========================================================
   COLLISION OBJECT LIST
   ========================================================= */

const collisionRects = [

    backWall,

    leftUpperLedge,
    rightUpperLedge,

    leftStairSide,
    rightStairSide,

    leftLowerWall,
    rightLowerWall,

    leftLowerTopWall,
    rightLowerTopWall,

    bottomWallLeft,
    bottomWallRight

];


/* =========================================================
   FOUNTAIN COLLISION
   ========================================================= */

function collidesWithFountain(x, y) {

    const dx =
        x - fountain.x;

    const dy =
        y - fountain.y;

    const nx =
        dx / fountain.collisionRadiusX;

    const ny =
        dy / fountain.collisionRadiusY;

    return (
        nx * nx +
        ny * ny <
        1
    );

}


/* =========================================================
   RECTANGLE COLLISION
   ========================================================= */

function collidesWithRectangle(
    x,
    y,
    width,
    height,
    rect
) {

    return (

        x + width / 2 >
            rect.x &&

        x - width / 2 <
            rect.x + rect.width &&

        y + height / 2 >
            rect.y &&

        y - height / 2 <
            rect.y + rect.height

    );

}


/* =========================================================
   WORLD COLLISION
   ========================================================= */

function collidesWithWorld(x, y) {

    /*
       OUTER BOUNDS
    */

    if (

        x - player.width / 2 <
            worldBounds.left ||

        x + player.width / 2 >
            worldBounds.right ||

        y <
            worldBounds.top ||

        y >
            worldBounds.bottom

    ) {

        return true;

    }


    /*
       RECTANGULAR COLLISION ZONES
    */

    for (
        const rect of collisionRects
    ) {

        if (
            collidesWithRectangle(
                x,
                y,
                player.width,
                player.height,
                rect
            )
        ) {

            return true;

        }

    }


    /*
       FOUNTAIN COLLISION
    */

    if (
        collidesWithFountain(
            x,
            y
        )
    ) {

        return true;

    }


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


    /* DIAGONAL SPEED */

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


    /* WALKING ANIMATION */

    if (player.moving) {

        player.animationTimer++;

        if (
            player.animationTimer >=
            animationSpeed
        ) {

            player.animationTimer = 0;

            player.animationFrame++;

            if (
                player.animationFrame >=
                SPRITE_COLUMNS
            ) {

                player.animationFrame = 0;

            }

        }

    } else {

        player.animationFrame = 0;
        player.animationTimer = 0;

    }


    /* HORIZONTAL MOVEMENT */

    const newX =
        player.x +
        dx * player.speed;

    if (
        !collidesWithWorld(
            newX,
            player.y
        )
    ) {

        player.x = newX;

    }


    /* VERTICAL MOVEMENT */

    const newY =
        player.y +
        dy * player.speed;

    if (
        !collidesWithWorld(
            player.x,
            newY
        )
    ) {

        player.y = newY;

    }

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

function canInteractWithFountain() {

    const distance =
        Math.hypot(

            player.x -
            fountain.x,

            player.y -
            fountain.y

        );

    return (
        distance <=
        fountain.interactionRadius
    );

}


function interact() {

    if (
        canInteractWithFountain()
    ) {

        showMessage(
            fountain.interactMessage
        );

        saveGame();

    }

}


/* =========================================================
   SAVE
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
   LOAD
   ========================================================= */

function loadGame() {

    const save =
        localStorage.getItem(
            "projectSirensSave"
        );


    /*
       Starting position:

       directly below the fountain
       on the staircase area.
    */

    if (!save) {

        player.x = 320;
        player.y = 205;

        return;

    }


    try {

        const data =
            JSON.parse(save);


        if (

            typeof data.x === "number" &&
            typeof data.y === "number"

        ) {

            if (

                !collidesWithWorld(
                    data.x,
                    data.y
                )

            ) {

                player.x = data.x;
                player.y = data.y;

                return;

            }

        }

    } catch (error) {

        console.warn(
            "Could not load save:",
            error
        );

    }


    /*
       Safe fallback.
    */

    player.x = 320;
    player.y = 205;

}


/* =========================================================
   DRAW SCENERY
   ========================================================= */

function drawScenery() {

    /*
       Always draw a background first.
    */

    ctx.fillStyle =
        "#202026";

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    if (
        sceneryLoaded
    ) {

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

}


/* =========================================================
   DRAW PLAYER
   ========================================================= */

function drawPlayer() {

    /*
       Temporary fallback character
       while the sprite is loading.
    */

    if (
        !playerSpriteLoaded
    ) {

        ctx.fillStyle =
            "#b13d68";

        ctx.fillRect(

            Math.round(
                player.x - 6
            ),

            Math.round(
                player.y - 18
            ),

            12,
            14

        );

        return;

    }


    const frameWidth =
        playerSprite.width /
        SPRITE_COLUMNS;

    const frameHeight =
        playerSprite.height /
        SPRITE_ROWS;


    const row =
        directionRows[
            player.facing
        ];


    const sourceX =
        player.animationFrame *
        frameWidth;

    const sourceY =
        row *
        frameHeight;


    /*
       Render size.

       player.x / player.y represent
       the player's feet.
    */

    const drawWidth = 26;
    const drawHeight = 32;


    ctx.drawImage(

        playerSprite,

        sourceX,
        sourceY,

        frameWidth,
        frameHeight,

        Math.round(
            player.x -
            drawWidth / 2
        ),

        Math.round(
            player.y -
            drawHeight +
            5
        ),

        drawWidth,
        drawHeight

    );

}


/* =========================================================
   FOUNTAIN FOREGROUND
   ========================================================= */

/*
   Only the lower/front portion of the fountain is
   drawn over the player.

   This prevents the surrounding carpet from
   covering the character's head and body.
*/

function drawFountainForeground() {

    if (
        !sceneryLoaded
    ) {

        return;

    }


    ctx.save();


    /*
       Lower fountain ellipse.
    */

    const cx = 320;
    const cy = 130;

    const rx = 91;
    const ry = 39;


    ctx.beginPath();


    ctx.moveTo(
        cx - rx,
        cy
    );


    ctx.ellipse(

        cx,
        cy,

        rx,
        ry,

        0,

        Math.PI,
        Math.PI * 2

    );


    ctx.closePath();


    ctx.clip();


    /*
       Draw scenery again only inside
       the small fountain-front region.
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


    ctx.restore();

}


/* =========================================================
   INTERACTION PROMPT
   ========================================================= */

function drawInteractionPrompt() {

    if (
        !canInteractWithFountain()
    ) {

        return;

    }


    const promptX =
        fountain.x;

    const promptY =
        fountain.y - 42;


    /*
       Background
    */

    ctx.fillStyle =
        "rgba(10,10,15,0.94)";

    ctx.fillRect(

        promptX - 14,
        promptY - 14,

        28,
        28

    );


    /*
       Border
    */

    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth = 2;

    ctx.strokeRect(

        promptX - 14,
        promptY - 14,

        28,
        28

    );


    /*
       Letter
    */

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "bold 16px monospace";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(

        "E",

        promptX,
        promptY + 1

    );


    ctx.textBaseline =
        "alphabetic";

}


/* =========================================================
   RAIN
   ========================================================= */

/*
   IMPORTANT:
   This was missing from the previous version.

   Without this array, updateRain() throws a
   ReferenceError and stops the entire game loop.
*/

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

            drop.y = -5;

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

    ctx.lineWidth = 1;


    for (
        const drop of rain
    ) {

        ctx.beginPath();


        ctx.moveTo(

            Math.round(
                drop.x
            ),

            Math.round(
                drop.y
            )

        );


        ctx.lineTo(

            Math.round(
                drop.x - 1
            ),

            Math.round(
                drop.y +
                drop.length
            )

        );


        ctx.stroke();

    }

}


/* =========================================================
   UI / DIALOGUE
   ========================================================= */

function drawUI() {

    if (
        messageTimer <= 0
    ) {

        return;

    }


    /*
       Dialogue background
    */

    ctx.fillStyle =
        "rgba(10,10,15,0.90)";

    ctx.fillRect(

        20,
        310,

        WIDTH - 40,
        25

    );


    /*
       Border
    */

    ctx.strokeStyle =
        "rgba(255,255,255,0.35)";

    ctx.lineWidth = 1;

    ctx.strokeRect(

        20,
        310,

        WIDTH - 40,
        25

    );


    /*
       Crisp pixel-style text
    */

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "bold 10px monospace";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";


    ctx.fillText(

        message,

        WIDTH / 2,

        322

    );


    ctx.textBaseline =
        "alphabetic";


    messageTimer--;

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
       Background scenery
    */

    drawScenery();


    /*
       Player is drawn first.
    */

    drawPlayer();


    /*
       Fountain front edge is drawn over
       the player's feet.
    */

    drawFountainForeground();


    /*
       Interaction prompt
    */

    drawInteractionPrompt();


    /*
       Rain
    */

    drawRain();


    /*
       Dialogue
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
