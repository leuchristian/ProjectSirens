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

    console.log(
        "Scenery loaded:",
        sceneryImage.width,
        "x",
        sceneryImage.height
    );

};


playerSprite.onload = () => {

    playerSpriteLoaded = true;

    console.log(
        "Player sprite loaded:",
        playerSprite.width,
        "x",
        playerSprite.height
    );

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

/*
   The sprite sheet uses:

       4 columns = animation frames
       8 rows    = directional rows

   We calculate each frame's actual dimensions
   from the image itself.
*/

const SPRITE_COLUMNS = 4;
const SPRITE_ROWS = 8;


/*
   Direction rows.

       0 = left
       1 = down
       2 = right
       3 = up
*/

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

/*
   The player can walk BETWEEN the back wall
   and the fountain.

   Only the actual back wall is solid.
*/

const backWall = {

    x: 47,
    y: 20,

    width: 545,
    height: 9

};


/* =========================================================
   FOUNTAIN
   ========================================================= */

/*
   The fountain is an elliptical collision object.

   The player can walk:

       - behind the fountain
       - beside the fountain
       - in front of the fountain

   but cannot walk INTO the fountain itself.
*/

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


/* ---------------------------------------------------------
   LEFT UPPER LEDGE
   --------------------------------------------------------- */

const leftUpperLedge = {

    x: 0,
    y: 194,

    width: 214,
    height: 8

};


/* ---------------------------------------------------------
   RIGHT UPPER LEDGE
   --------------------------------------------------------- */

const rightUpperLedge = {

    x: 426,
    y: 194,

    width: 214,
    height: 8

};


/* ---------------------------------------------------------
   LEFT STAIR-SIDE WALL
   --------------------------------------------------------- */

const leftStairSide = {

    x: 211,
    y: 194,

    width: 8,
    height: 58

};


/* ---------------------------------------------------------
   RIGHT STAIR-SIDE WALL
   --------------------------------------------------------- */

const rightStairSide = {

    x: 421,
    y: 194,

    width: 8,
    height: 58

};


/* ---------------------------------------------------------
   LEFT LOWER ROOM OUTER WALL
   --------------------------------------------------------- */

const leftLowerWall = {

    x: 49,
    y: 258,

    width: 8,
    height: 83

};


/* ---------------------------------------------------------
   RIGHT LOWER ROOM OUTER WALL
   --------------------------------------------------------- */

const rightLowerWall = {

    x: 584,
    y: 258,

    width: 8,
    height: 83

};


/* ---------------------------------------------------------
   LEFT LOWER ROOM TOP WALL
   --------------------------------------------------------- */

const leftLowerTopWall = {

    x: 50,
    y: 256,

    width: 165,
    height: 8

};


/* ---------------------------------------------------------
   RIGHT LOWER ROOM TOP WALL
   --------------------------------------------------------- */

const rightLowerTopWall = {

    x: 425,
    y: 256,

    width: 160,
    height: 8

};


/* ---------------------------------------------------------
   BOTTOM WALL
   --------------------------------------------------------- */

/*
   There is a doorway in the center.
*/

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
   ELLIPSE COLLISION
   ========================================================= */

function collidesWithFountain(x, y) {

    const dx =
        x - fountain.x;

    const dy =
        y - fountain.y;

    const nx =
        dx /
        fountain.collisionRadiusX;

    const ny =
        dy /
        fountain.collisionRadiusY;

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
       FOUNTAIN
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


    /* =====================================================
       WALKING ANIMATION
       ===================================================== */

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


    /* =====================================================
       HORIZONTAL MOVEMENT
       ===================================================== */

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


    /* =====================================================
       VERTICAL MOVEMENT
       ===================================================== */

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
   MESSAGE SYSTEM
   ========================================================= */

let message = "";
let messageTimer = 0;


function showMessage(text) {

    message = text;

    messageTimer = 180;

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
       STARTING POSITION

       On the stairs directly below
       the fountain.
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

            /*
               Do not restore an old save if
               it places the character inside
               a collision zone.
            */

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
       IMPORTANT:

       If the sprite has not loaded,
       use a temporary visible character.

       This means the player can NEVER
       silently disappear while debugging
       the PNG loading.
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


    /*
       Calculate the actual frame dimensions
       from the PNG.
    */

    const frameWidth =
        playerSprite.width /
        SPRITE_COLUMNS;

    const frameHeight =
        playerSprite.height /
        SPRITE_ROWS;


    /*
       Direction = ROW.
    */

    const row =
        directionRows[
            player.facing
        ];


    /*
       Animation frame = COLUMN.
    */

    const sourceX =
        player.animationFrame *
        frameWidth;

    const sourceY =
        row *
        frameHeight;


    /*
       Render size.

       x/y is the FEET position.
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
   IMPORTANT:

   Only the LOWER HALF of the fountain is
   rendered over the player.

   This means:

       - head remains visible
       - upper body remains visible
       - feet are hidden behind fountain lip
       - surrounding carpet does not cover player
       - player can walk behind fountain
*/

function drawFountainForeground() {

    if (
        !sceneryLoaded
    ) {

        return;

    }


    ctx.save();


    /*
       Lower half of fountain ellipse.
    */

    const cx = 320;
    const cy = 130;

    const rx = 91;
    const ry = 39;


    ctx.beginPath();


    /*
       Start at left side.
    */

    ctx.moveTo(
        cx - rx,
        cy
    );


    /*
       Lower half.
    */

    ctx.ellipse(

        cx,
        cy,

        rx,
        ry,

        0,

        Math.PI,
        Math.PI * 2

    );


    /*
       Close along center line.
    */

    ctx.closePath();


    ctx.clip();


    /*
       Redraw scenery only inside
       the clipped fountain area.
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
       Background.
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
       Border.
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
       Letter E.
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
       Dialogue background.
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
       Border.
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
       Crisp pixel-style text.
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
       BACKGROUND
    */

    drawScenery();


    /*
       PLAYER

       Drawn before fountain foreground.
    */

    drawPlayer();


    /*
       FOUNTAIN FRONT EDGE

       Only lower fountain edge is
       placed over the player.
    */

    drawFountainForeground();


    /*
       INTERACTION
    */

    drawInteractionPrompt();


    /*
       RAIN
    */

    drawRain();


    /*
       DIALOGUE
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
