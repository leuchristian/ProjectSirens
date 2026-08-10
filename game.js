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


/* =========================================================
   ASSET LOADING
   ========================================================= */

let sceneryLoaded = false;
let playerSpriteLoaded = false;

sceneryImage.onload = () => {
    sceneryLoaded = true;
};

playerSprite.onload = () => {
    playerSpriteLoaded = true;
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
        key === "arrowright" ||
        key === " "
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

/*
    IMPORTANT:

    The player's x/y position represents the character's
    FEET / ground position.

    This makes collision and depth sorting much easier.
*/

const player = {

    x: 320,
    y: 195,

    width: 18,
    height: 26,

    speed: 1.5,

    facing: "down",

    moving: false,

    animationFrame: 0,

    animationTimer: 0

};


/* =========================================================
   PLAYER SPRITE SETTINGS
   ========================================================= */

/*
    The sprite sheet is assumed to contain:

        4 columns
        8 rows

    The first four rows are used for the playable character.

    If your current sprite sheet uses a different arrangement,
    these values can be adjusted without changing the rest
    of the game.
*/

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
   WORLD BOUNDARIES
   ========================================================= */

/*
    The outside boundaries keep the player inside the room.
*/

const worldBounds = {

    left: 34,
    right: 606,

    top: 31,
    bottom: 345

};


/* =========================================================
   BACK WALL
   ========================================================= */

/*
    THIS IS IMPORTANT.

    The back wall is its own collision object.

    The player is allowed to walk in the space BETWEEN
    this wall and the fountain.

    They simply cannot walk through the wall itself.
*/

const backWall = {

    x: 43,
    y: 28,

    width: 554,
    height: 10

};


/* =========================================================
   FOUNTAIN
   ========================================================= */

/*
    The fountain is treated as an elliptical solid object.

    It is NOT a rectangle extending all the way to the
    back wall.

    This means the player can walk behind it.
*/

const fountain = {

    x: 320,
    y: 124,

    collisionRadiusX: 62,
    collisionRadiusY: 28,

    interactionRadius: 72,

    interactMessage:
        "The fountain water is strangely calming."

};


/* =========================================================
   FOUNTAIN FOREGROUND
   ========================================================= */

/*
    This controls ONLY the visible front edge of the fountain.

    It is intentionally much smaller than the entire fountain
    image so that the carpet and surrounding floor do not
    cover the player's head/body.

    The player is drawn first.

    Then this small portion of the fountain is drawn over
    the player's feet.
*/

const fountainForeground = {

    x: 320,
    y: 130,

    radiusX: 91,
    radiusY: 39,

    startY: 130

};


/* =========================================================
   PLANTS / DECORATIVE COLLISION
   ========================================================= */

/*
    These are intentionally NOT collision objects.

    The scenery is primarily visual for now.
*/


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
   FOUNTAIN INTERACTION
   ========================================================= */

function getFountainDistance() {

    return Math.hypot(

        player.x - fountain.x,

        player.y - fountain.y

    );

}


function canInteractWithFountain() {

    return (
        getFountainDistance() <=
        fountain.interactionRadius
    );

}


function interact() {

    if (canInteractWithFountain()) {

        showMessage(
            fountain.interactMessage
        );

        saveGame();

    }

}


/* =========================================================
   ELLIPSE COLLISION
   ========================================================= */

/*
    Checks whether the player's feet are inside the
    fountain's collision ellipse.
*/

function collidesWithFountain(x, y) {

    const dx =
        x - fountain.x;

    const dy =
        y - fountain.y;

    const normalizedX =
        dx / fountain.collisionRadiusX;

    const normalizedY =
        dy / fountain.collisionRadiusY;

    return (
        normalizedX * normalizedX +
        normalizedY * normalizedY
        < 1
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

        x + width / 2 > rect.x &&

        x - width / 2 <
            rect.x + rect.width &&

        y + height / 2 > rect.y &&

        y - height / 2 <
            rect.y + rect.height

    );

}


/* =========================================================
   WORLD COLLISION
   ========================================================= */

function collidesWithWorld(x, y) {

    /*
        OUTER BOUNDARIES
    */

    if (
        x < worldBounds.left ||
        x > worldBounds.right ||
        y < worldBounds.top ||
        y > worldBounds.bottom
    ) {

        return true;

    }


    /*
        BACK WALL

        This does NOT block the area in front of it.

        It ONLY prevents the player from walking into
        the wall/windows themselves.
    */

    if (
        collidesWithRectangle(
            x,
            y,
            player.width,
            player.height,
            backWall
        )
    ) {

        return true;

    }


    /*
        FOUNTAIN

        This is the ONLY collision object in the
        fountain area.

        The space behind it remains completely walkable.
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


    /*
        UP
    */

    if (
        keys["w"] ||
        keys["arrowup"]
    ) {

        dy -= 1;

        player.facing = "up";

    }


    /*
        DOWN
    */

    if (
        keys["s"] ||
        keys["arrowdown"]
    ) {

        dy += 1;

        player.facing = "down";

    }


    /*
        LEFT
    */

    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {

        dx -= 1;

        player.facing = "left";

    }


    /*
        RIGHT
    */

    if (
        keys["d"] ||
        keys["arrowright"]
    ) {

        dx += 1;

        player.facing = "right";

    }


    /*
        DIAGONAL MOVEMENT
    */

    if (
        dx !== 0 &&
        dy !== 0
    ) {

        dx *= 0.7071;

        dy *= 0.7071;

    }


    /*
        MOVING?
    */

    player.moving =
        dx !== 0 ||
        dy !== 0;


    /*
        ANIMATION
    */

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


    /*
        NEW POSITION
    */

    const newX =
        player.x +
        dx * player.speed;

    const newY =
        player.y +
        dy * player.speed;


    /*
        X COLLISION

        Test horizontal movement separately.
    */

    if (
        !collidesWithWorld(
            newX,
            player.y
        )
    ) {

        player.x = newX;

    }


    /*
        Y COLLISION

        Test vertical movement separately.
    */

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


/* =========================================================
   LOAD SYSTEM
   ========================================================= */

function loadGame() {

    const save =
        localStorage.getItem(
            "projectSirensSave"
        );


    if (!save) {

        /*
            DEFAULT SPAWN:

            Directly on the stairs in front
            of the fountain.
        */

        player.x = 320;

        player.y = 195;

        return;

    }


    try {

        const data =
            JSON.parse(save);


        /*
            Only use the saved position if it is
            actually legal.

            This prevents an old save from putting
            the player inside the fountain.
        */

        if (
            typeof data.x === "number" &&
            typeof data.y === "number" &&
            !collidesWithWorld(
                data.x,
                data.y
            )
        ) {

            player.x = data.x;

            player.y = data.y;

        } else {

            player.x = 320;

            player.y = 195;

        }

    } catch (error) {

        player.x = 320;

        player.y = 195;

    }

}


/* =========================================================
   SCENERY DRAWING
   ========================================================= */

function drawScenery() {

    /*
        Background color behind transparent portions.
    */

    ctx.fillStyle = "#202026";

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    /*
        Draw scenery.
    */

    if (sceneryLoaded) {

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

    } else {

        /*
            Fallback so the screen does not
            become completely black if the image
            fails to load.
        */

        ctx.fillStyle = "#202026";

        ctx.fillRect(
            0,
            0,
            WIDTH,
            HEIGHT
        );

    }

}


/* =========================================================
   PLAYER DRAWING
   ========================================================= */

function drawPlayer() {

    if (
        !playerSpriteLoaded
    ) {

        /*
            Emergency fallback.
        */

        ctx.fillStyle = "#b13d68";

        ctx.fillRect(

            player.x - 6,

            player.y - 18,

            12,

            14

        );

        return;

    }


    /*
        Determine sprite dimensions.

        The sheet is assumed to have
        4 columns x 8 rows.
    */

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
        Draw character.

        The player's x/y represents
        their FEET position.
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
            drawHeight + 5
        ),

        drawWidth,
        drawHeight

    );

}


/* =========================================================
   FOUNTAIN FOREGROUND
   ========================================================= */

/*
    This is the important depth trick.

    The entire scenery is already drawn in the background.

    Then:

        1. player is drawn
        2. only the FRONT portion of the fountain
           is drawn again

    Therefore the player can stand behind the fountain,
    while the fountain's front lip covers the feet.
*/

function drawFountainForeground() {

    if (!sceneryLoaded) {

        return;

    }


    ctx.save();


    /*
        Create an elliptical fountain foreground area.
    */

    ctx.beginPath();

    ctx.ellipse(

        fountainForeground.x,

        fountainForeground.y,

        fountainForeground.radiusX,

        fountainForeground.radiusY,

        0,

        0,

        Math.PI * 2

    );

    /*
        Only use the lower half of the ellipse.

        This prevents the fountain from covering
        the player's head when they stand behind it.
    */

    ctx.rect(

        0,

        fountainForeground.startY,

        WIDTH,

        HEIGHT

    );

    ctx.clip();


    /*
        Redraw the scenery inside the clipped area.

        This places the fountain lip in front of
        the player without putting the entire
        scenery image over them.
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


    /*
        Floating E prompt.
    */

    const promptX =
        fountain.x;

    const promptY =
        fountain.y - 38;


    /*
        Dark square.
    */

    ctx.fillStyle =
        "rgba(10,10,15,0.92)";

    ctx.fillRect(

        promptX - 14,

        promptY - 14,

        28,

        28

    );


    /*
        White border.
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
        E
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
   RAIN UPDATE
   ========================================================= */

function updateRain() {

    for (const drop of rain) {

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


    for (const drop of rain) {

        ctx.beginPath();

        ctx.moveTo(

            Math.round(drop.x),

            Math.round(drop.y)

        );

        ctx.lineTo(

            Math.round(drop.x - 1),

            Math.round(
                drop.y +
                drop.length
            )

        );

        ctx.stroke();

    }

}


/* =========================================================
   MESSAGE UI
   ========================================================= */

function drawUI() {

    if (
        messageTimer <= 0
    ) {

        return;

    }


    /*
        Dialogue box.
    */

    ctx.fillStyle =
        "rgba(10,10,15,0.88)";

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
        "rgba(255,255,255,0.3)";

    ctx.strokeRect(

        20,

        310,

        WIDTH - 40,

        25

    );


    /*
        Pixel-friendly text.
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
        1. Entire scenery
    */

    drawScenery();


    /*
        2. Player
    */

    drawPlayer();


    /*
        3. Fountain front lip

        ONLY the actual foreground portion
        is placed over the player.
    */

    drawFountainForeground();


    /*
        4. Interaction prompt
    */

    drawInteractionPrompt();


    /*
        5. Rain
    */

    drawRain();


    /*
        6. Dialogue
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
