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
    console.log("Project Sirens player sprite loaded.");
};

playerSprite.onerror = function () {
    console.error(
        "Could not load the player sprite."
    );
};

playerSprite.src =
    "assets/characters/player/player_sprite_sheet.png";


/* =========================================================
   SCENERY
========================================================= */

const scenerySprite = new Image();

let scenerySpriteLoaded = false;


/*
    Using a URL based on the current game page makes
    this work correctly when the game is hosted as a
    GitHub Pages project site.

    Your exact file is:

    assets/scenery/project_sirens_scenery_transparent.png
*/

const sceneryPath = new URL(
    "assets/scenery/project_sirens_scenery_transparent.png",
    document.baseURI
).href;


scenerySprite.onload = function () {

    scenerySpriteLoaded = true;

    console.log(
        "Project Sirens scenery loaded successfully."
    );

};


scenerySprite.onerror = function () {

    console.error(
        "SCENERY FAILED TO LOAD:"
    );

    console.error(
        sceneryPath
    );

};


scenerySprite.src = sceneryPath;


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
            Prevent the browser from scrolling
            when the arrow keys are pressed.
        */

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

    }
);


window.addEventListener(
    "keyup",
    function (event) {

        const key =
            event.key.toLowerCase();

        keys[key] = false;

    }
);


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

    animationTimer: 0,

    animationFrame: 0

};


/* =========================================================
   PLAYER SPRITE SHEET SETTINGS
========================================================= */

/*
    The sprite sheet you uploaded is 640 × 640.

    The character frames are approximately 61 × 61.

    IMPORTANT:

    The SHEET is organized like this:

                 LEFT     UP      DOWN     RIGHT

        IDLE      [ ]      [ ]      [ ]      [ ]

        WALK 1    [ ]      [ ]      [ ]      [ ]

        WALK 2    [ ]      [ ]      [ ]      [ ]

        WALK 3    [ ]      [ ]      [ ]      [ ]

    Therefore:

        COLUMNS = directions

        ROWS = animation frames
*/


const FRAME_WIDTH = 61;

const FRAME_HEIGHT = 61;


/*
    Horizontal positions of the four directions.
*/

const FRAME_X = [

    5,      // LEFT

    68,     // UP / BACK

    131,    // DOWN / FRONT

    194     // RIGHT

];


/*
    Vertical positions.

    First row = idle.

    Next three rows = walking animation.
*/

const FRAME_Y = [

    3,      // IDLE

    68,     // WALK 1

    131,    // WALK 2

    195     // WALK 3

];


/* =========================================================
   WORLD
========================================================= */

const walls = [

    /*
        Outer boundaries.
    */

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

    y: 70,

    radius: 20,

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
            Math.random() * WIDTH,

        y:
            Math.random() * HEIGHT,

        speed:
            1 + Math.random() * 2,

        length:
            2 + Math.random() * 4

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
        Determine whether the player is walking.
    */

    player.moving =
        dx !== 0 ||
        dy !== 0;


    /*
        Attempt horizontal movement.
    */

    const newX =
        player.x +
        dx *
        player.speed;


    if (
        !collidesWithWall(
            newX,
            player.y
        )
    ) {

        player.x = newX;

    }


    /*
        Attempt vertical movement.
    */

    const newY =
        player.y +
        dy *
        player.speed;


    if (
        !collidesWithWall(
            player.x,
            newY
        )
    ) {

        player.y = newY;

    }


    /* =====================================================
       WALKING ANIMATION
    ===================================================== */

    if (player.moving) {

        player.animationTimer++;


        /*
            Controls walking speed.

            Lower = faster animation.
        */

        if (
            player.animationTimer >= 8
        ) {

            player.animationTimer = 0;

            player.animationFrame++;


            /*
                We have three walking frames:

                0
                1
                2
            */

            if (
                player.animationFrame >= 3
            ) {

                player.animationFrame = 0;

            }

        }

    }
    else {

        /*
            Return to the standing frame.
        */

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
            "Could not load save data."
        );

    }

}


/* =========================================================
   DRAW SCENERY
========================================================= */

function drawScenery() {

    /*
        Background underneath the transparent scenery.
    */

    ctx.fillStyle =
        "#111217";


    ctx.fillRect(

        0,

        0,

        WIDTH,

        HEIGHT

    );


    /*
        If the image hasn't loaded yet,
        leave the background visible.

        The rest of the game continues normally.
    */

    if (
        !scenerySpriteLoaded
    ) {

        return;

    }


    /*
        The source image is 1536 × 1024.

        Draw it into the 320 × 180 game
        viewport.

        This deliberately uses the entire image
        so we can confirm that the asset itself
        is displaying correctly.
    */

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


/* =========================================================
   DRAW PLAYER
========================================================= */

function drawPlayer() {

    /*
        Fallback character if the sprite hasn't
        loaded yet.
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
        Determine which COLUMN to use.

        LEFT = 0
        UP   = 1
        DOWN = 2
        RIGHT = 3
    */

    let directionColumn = 2;


    if (
        player.facing === "left"
    ) {

        directionColumn = 0;

    }
    else if (
        player.facing === "up"
    ) {

        directionColumn = 1;

    }
    else if (
        player.facing === "down"
    ) {

        directionColumn = 2;

    }
    else if (
        player.facing === "right"
    ) {

        directionColumn = 3;

    }


    /*
        Determine which ROW to use.

        Standing:

            row 0

        Walking:

            row 1
            row 2
            row 3
    */

    let animationRow = 0;


    if (player.moving) {

        animationRow =
            player.animationFrame + 1;

    }


    /*
        Get the exact source rectangle.
    */

    const sourceX =
        FRAME_X[directionColumn];


    const sourceY =
        FRAME_Y[animationRow];


    /*
        Draw the tiny pixel-art character
        at a larger size.

        Image smoothing is disabled above,
        so it remains crisp pixel art.
    */

    const drawWidth = 24;

    const drawHeight = 24;


    ctx.drawImage(

        playerSprite,

        sourceX,

        sourceY,

        FRAME_WIDTH,

        FRAME_HEIGHT,

        player.x -
            drawWidth / 2,

        player.y -
            drawHeight +
            3,

        drawWidth,

        drawHeight

    );

}


/* =========================================================
   RAIN UPDATE
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
        Draw order:

        1. Scenery
        2. Rain
        3. Player
        4. UI
    */

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
   PLAYER SPRITE SHEET
   ========================================================= */

const playerSprite = new Image();

let playerSpriteLoaded = false;

playerSprite.onload = function () {
    playerSpriteLoaded = true;
    console.log("Player sprite loaded.");
};

playerSprite.onerror = function () {
    console.error(
        "Could not load player sprite."
    );
};

playerSprite.src =
    "assets/characters/player/player_sprite_sheet.png";


/* =========================================================
   SCENERY
   ========================================================= */

const scenerySprite = new Image();

let scenerySpriteLoaded = false;

scenerySprite.onload = function () {

    scenerySpriteLoaded = true;

    console.log(
        "Scenery loaded successfully."
    );

};

scenerySprite.onerror = function () {

    console.error(
        "Could not load scenery:"
    );

    console.error(
        "assets/scenery/project_sirens_scenery_transparent.png"
    );

};

scenerySprite.src =
    "assets/scenery/project_sirens_scenery_transparent.png";


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


        if (key === "e") {

            interact();

        }

    }
);


window.addEventListener(
    "keyup",
    function (event) {

        const key =
            event.key.toLowerCase();

        keys[key] = false;

    }
);


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

    animationTimer: 0,

    animationFrame: 0

};


/* =========================================================
   SPRITE SHEET SETTINGS
   ========================================================= */

/*
   The supplied sheet is 640 × 640.

   The actual small character frames occupy the
   upper-left portion of the sheet.

   Each character frame is approximately 61 × 61.

   Four idle directions are located across the
   first row:

       0 = LEFT
       1 = UP
       2 = DOWN
       3 = RIGHT
*/


const FRAME_WIDTH = 61;
const FRAME_HEIGHT = 61;


/*
   X positions of the four character frames.
*/

const FRAME_X = [
    5,
    68,
    131,
    194
];


/*
   Idle row.
*/

const IDLE_Y = 2;


/*
   Walking animation rows.

   These correspond to the animated rows
   underneath the idle row.

   Each direction uses four frames.

   If your particular sheet uses a slightly
   different ordering, these are isolated here
   so we can adjust them without touching the
   rest of the game.
*/

const WALK_ROWS = {

    left: [
        67,
        131,
        195
    ],

    up: [
        323,
        387,
        451
    ],

    down: [
        515,
        515,
        515
    ],

    right: [
        67,
        131,
        195
    ]

};


/* =========================================================
   WORLD COLLISION
   ========================================================= */

const walls = [

    // Outer left wall
    {
        x: 12,
        y: 12,
        w: 10,
        h: 156
    },

    // Outer right wall
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

    x: 160,

    y: 70,

    radius: 20,

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
            Math.random() * WIDTH,

        y:
            Math.random() * HEIGHT,

        speed:
            1 + Math.random() * 2,

        length:
            2 + Math.random() * 4

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


    /*
       Animation timing.

       Lower number = faster animation.
    */

    if (player.moving) {

        player.animationTimer++;

        if (
            player.animationTimer >= 7
        ) {

            player.animationTimer = 0;

            player.animationFrame++;

            if (
                player.animationFrame >= 4
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
            "Save data could not be loaded."
        );

    }

}


/* =========================================================
   DRAW SCENERY
   ========================================================= */

function drawScenery() {

    /*
       Background color behind the transparent image.
    */

    ctx.fillStyle =
        "#111217";


    ctx.fillRect(

        0,
        0,
        WIDTH,
        HEIGHT

    );


    if (!scenerySpriteLoaded) {

        /*
           Don't stop the game if scenery
           hasn't loaded yet.
        */

        return;

    }


    /*
       The scenery image is 1536 × 1024.

       We display the entire image scaled
       into the 320 × 180 game window.

       This makes sure the image definitely
       appears instead of relying on a crop.
    */

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


/* =========================================================
   DRAW PLAYER
   ========================================================= */

function drawPlayer() {

    if (!playerSpriteLoaded) {

        /*
           Simple fallback.
        */

        ctx.fillStyle =
            "#111116";


        ctx.fillRect(

            player.x - 5,
            player.y - 6,
            10,
            10

        );


        return;

    }


    let sourceX;

    let sourceY;


    /*
       -----------------------------------------------
       IDLE
       -----------------------------------------------

       Top row contains:

       LEFT | UP | DOWN | RIGHT
    */


    if (!player.moving) {

        if (
            player.facing === "left"
        ) {

            sourceX =
                FRAME_X[0];

        }
        else if (
            player.facing === "up"
        ) {

            sourceX =
                FRAME_X[1];

        }
        else if (
            player.facing === "down"
        ) {

            sourceX =
                FRAME_X[2];

        }
        else {

            sourceX =
                FRAME_X[3];

        }


        sourceY =
            IDLE_Y;

    }


    /*
       -----------------------------------------------
       WALKING
       -----------------------------------------------
    */

    else {

        /*
           Select animation row based on direction.
        */

        let rows;


        if (
            player.facing === "left"
        ) {

            rows =
                WALK_ROWS.left;

        }
        else if (
            player.facing === "up"
        ) {

            rows =
                WALK_ROWS.up;

        }
        else if (
            player.facing === "right"
        ) {

            rows =
                WALK_ROWS.right;

        }
        else {

            rows =
                WALK_ROWS.down;

        }


        /*
           Cycle horizontally through the four
           frames in the animation.
        */

        sourceX =
            FRAME_X[
                player.animationFrame
            ];


        /*
           Select one of the animation rows.

           The rows are cycled as the character
           walks.
        */

        const rowIndex =
            Math.floor(
                player.animationFrame / 2
            );


        sourceY =
            rows[
                Math.min(
                    rowIndex,
                    rows.length - 1
                )
            ];

    }


    /*
       Draw the sprite.

       The original character is tiny, so we
       enlarge it for our game while keeping
       pixel-art edges sharp.
    */

    const drawWidth = 24;

    const drawHeight = 24;


    ctx.drawImage(

        playerSprite,

        sourceX,

        sourceY,

        FRAME_WIDTH,

        FRAME_HEIGHT,

        player.x -
            drawWidth / 2,

        player.y -
            drawHeight +
            3,

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
