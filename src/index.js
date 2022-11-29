import Phaser from "phaser";
import C4C from 'c4c-editor-and-interpreter';
import {createEditor, createEventListeners, initializeEditor} from './modules/interpFunc.js'
import { loadProgram, publish } from "./modules/GameManager.js";

import platform from './assets/dist/platform.png'
import dot from './assets/dist/dot.png'
import ghost_dot from './assets/dist/ghost-dot.png'
import pink_ghost from './assets/dist/pink-ghost.webp'
import red_ghost from './assets/dist/red-ghost.webp'
import blue_ghost from './assets/dist/blue-ghost.webp'
import yellow_ghost from './assets/dist/yellow-ghost.webp'
import vulnerable_ghost from './assets/dist/vulnerable-ghost.webp'
import pacman from './assets/dist/pacman.png'
import tiles from './assets/dist/tiles.png'
import tile_map from './assets/dist/map.json'
import munch_mp3 from './assets/dist/waka-waka-munch-short.mp3'

import moveObj from './modules/moveFunc.js'

import ghostFunc from "./modules/ghostFunc";
import directFunc from "./modules/directFunc";
import worldFunc from "./modules/worldFunc"


  

const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 450,
    height: 550,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 0
            },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    dom: {
        createContainer: true,
      },
};

/**
 * @type {Phaser.Tilemaps.Tilemap}
*/



const GHOSTS = ['pink', 'red', 'blue', 'yellow'];

const PLAYER_SPEED = 80;
const GHOST_SPEED = 80;
const TILE_SIZE = 16;

var player;
var dots;
var ghostDots;
var ghosts;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var positionsArray;

var map;
var tileset;
var worldLayer;
var munch;

// Location of ghost code step
var location = [];

// How often to run the ghost code
var ghostLoopSpeed = 50;

// Current index for running ghost code
var ghostLoopI = 0;

var ghostDotsPositionsArray = [
    [25, 40],
    [25, 380],
    [425, 40],
    [425, 380]
];

createEditor(C4C);

let programText ='';
var game = new Phaser.Game(config);

// Helper function to restart game on death or on button press.
function restartGame() {
    game.destroy(true);
    dots = null;
    score = 0;
    gameOver = false;
    game = new Phaser.Game(config);
    location = [0];
    ghostLoopI = 0;
};

document.getElementById('start-over').addEventListener('click', restartGame);

document.getElementById('publish').addEventListener('click', () => {
    // Get the program text from the editor
    let txt = C4C.Editor.getText();
    let id = publish(txt);
    alert("Your id is: " + id);

});

document.getElementById('load').addEventListener('click', () => {
    let id = document.getElementById('game-code').value;
    let txt = loadProgram(id);
    if (txt) {
        porgramText = txt;
        C4C.Editor.setText(programText);
    } else 
        alert("Invalid id");
});

    

document.getElementById('submit').addEventListener('click', () => {
    // Delete the old array
    programText = C4C.Editor.getText();
    ghostLoopSpeed = document.getElementById('loopSpeed').value;
    ghostLoopI = 0;
    location = [];
    
    
});

function preload() {
    this.load.image('ground', platform);
    this.load.image('dot', dot);
    this.load.image('ghost-dot', ghost_dot);
    this.load.image('pink-ghost', pink_ghost, {
        frameWidth: 32,
        frameHeight: 48
    });
    this.load.image('red-ghost', red_ghost, {
        frameWidth: 32,
        frameHeight: 48
    });
    this.load.image('blue-ghost', blue_ghost, {
        frameWidth: 32,
        frameHeight: 48
    });
    this.load.image('yellow-ghost', yellow_ghost, {
        frameWidth: 32,
        frameHeight: 48
    });
    this.load.image('vulnerable-ghost', vulnerable_ghost, {
        frameWidth: 32,
        frameHeight: 48
    });
    this.load.spritesheet('pacman', pacman, {
        frameWidth: 32,
        frameHeight: 32
    });

    this.load.audio('munch', munch_mp3);

    this.load.image('tiles', tiles);
    this.load.tilemapTiledJSON('map', tile_map);
}

function create() {
    initializeEditor(C4C);
    createEventListeners(this);
    
    
    map = this.make.tilemap({
        key: "map"
    });
    tileset = map.addTilesetImage("blueTiles", 'tiles');
    worldLayer = map.createStaticLayer('Tile Layer 1', tileset);
    worldLayer.setCollisionByExclusion(-1, true);

    munch = this.sound.add('munch');

    const spawnPoint = map.findObject("Objects", obj => obj.name === "Spawn Point 1");

    // The player and its settings
    player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'pacman').setScale(.5);
    player.nextMove = null;
    player.isPowerful = false;


    let pinkGhost = this.physics.add.sprite(195, 230, 'pink-ghost');
    pinkGhost.color = 'pink';
    let redGhost = this.physics.add.sprite(225, 230, 'red-ghost');
    redGhost.color = 'red';
    let blueGhost = this.physics.add.sprite(255, 230, 'blue-ghost');
    blueGhost.color = 'blue';
    let yellowGhost = this.physics.add.sprite(225, 185, 'yellow-ghost');
    yellowGhost.color = 'yellow';
    

    ghosts = this.physics.add.group();

    ghosts.add(pinkGhost);
    ghosts.add(redGhost);
    ghosts.add(blueGhost);
    ghosts.add(yellowGhost);

    {
        let i = 0;
        ghosts.children.entries.forEach(ghost => ghost.color = GHOSTS[i++]);
    }

    this.physics.add.collider(player, worldLayer);
    this.physics.add.collider(ghosts, worldLayer);
    this.physics.add.collider(player, dots);

    ghostFunc.setGhostSize(ghosts, false);

    // Player physics properties. Give the little guy a slight bounce.

    player.setCollideWorldBounds(true); 

    yellowGhost.setCollideWorldBounds(true); 
    // Our player animations, turning, walking left and walking right.

    this.anims.create({
        key: 'chomp',
        frames: this.anims.generateFrameNumbers('pacman', {
            start: 0,
            end: 2
        }),
        frameRate: 10,
        repeat: -1
    });

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    //  = DOTS =

    // The dots are 4 by 4. One is placed per tile in tilemap. Tiles are 16px, dots are placed in the center of tile
    positionsArray = [];

    // Iterates through each tile on tilemap, checks if there is not a tile (or blocked location), and draws

    let count = 0;
    for (let i = 1; i < map.width - 1; i++) {
        for (let j = 1; j < map.height - 1; j++) {

            // Checking if tile exists at centered position of current tile

            let centeredPosX = (i * TILE_SIZE) + (TILE_SIZE / 2);
            let centeredPosY = (j * TILE_SIZE) + (TILE_SIZE / 2);
            let currentTile = map.getTileAt(i, j);

            if (currentTile === null) {
                positionsArray.push([centeredPosX, centeredPosY]);
            }
        }
    }
    

    dots = worldFunc.createDots(this, positionsArray);

    //  EAT GHOST DOTS
    var ghostDotsPositionsArray = [
        [25, 40],
        [25, 380],
        [425, 40],
        [425, 380]
    ];

    ghostDots = worldFunc.createGhostDots(this, ghostDotsPositionsArray);

    //  The score
    scoreText = this.add.text(0, 510, 'Score: 0', {
        fontSize: '32px',
        fill: '#fff'
    });

    //  Collide the player with the platforms
    this.physics.add.collider(player, platforms);

    //  Checks to see if the player overlaps with any of the normal dots, if he does call the eatDot function
    this.physics.add.overlap(player, dots, eatDot, null, this);
    //  Checks to see if the player overlaps with any of the eat-ghost powerup dots, if he does call the eatGhostDot function
    this.physics.add.overlap(player, ghostDots, eatGhostDot, null, this);
    this.physics.add.collider(player, ghosts, hitGhost, null, this);

    const isProduction = process.env.NODE_ENV == 'production';
    if (!isProduction) {
        window.player = player;
        window.ghosts = ghosts;
    }
}

function update() {
    if (ghostLoopI == 0) {
        let origLoc = [...location];
        // Which ghosts have moved so far, bitboard
        // If the first bit is set, the first ghost has moved
        // If the second bit is set, the second ghost has moved ...
        let moved = 0b0000;
        do  {
            
            // Run one step of ghost AI
            let [result, loc] = C4C.Interpreter.stepRun(programText, location);
            
            
            
            // If at end of program, reset location
            if (location[0] == 1) location = [];

            // If a result is returned, probably run another step
            if (result) {
                let newMoved = 0b0000;
                
                // If the result is a ghost, set that ghost's bit to 1
                let ghost = result.ghost;
                if (ghost == 'pink') newMoved = 0b0001;
                else if (ghost == 'red') newMoved = 0b0010;
                else if (ghost == 'blue') newMoved = 0b0100;
                else if (ghost == 'orange') newMoved = 0b1000;
                else if (ghost == 'all') newMoved = 0b1111;

                // If the ghost has already moved, stop running
                if (moved & newMoved) break;

                // Otherwise, go to the new location and set the ghost's bit to 1, and run
                moved |= newMoved;
                location = loc;
                result.func();
           }
        } while (JSON.stringify(location) != JSON.stringify(origLoc));
    }
    ghostLoopI++;
    if (ghostLoopI >= ghostLoopSpeed) {
        ghostLoopI = 0;
    }
    
    if (gameOver) {
        return;
    }
    if (cursors.left.isDown) {
        moveObj.moveLeft(player);
    } else if (cursors.right.isDown) {
        moveObj.moveRight(player);
    } else if (cursors.up.isDown) {
        moveObj.moveUp(player);
    } else if (cursors.down.isDown) {
        moveObj.moveDown(player);
    }

    if (player.x > 440) {
        player.setPosition(9, 232);
    } else if (player.x < 8) {
        player.setPosition(439, 232);
    }

    for (var i=0; i < ghosts.children.entries.length ; i++){
        var gx = ghosts.children.entries[i]
        if (gx.x > 440) {
            gx.setPosition(8, 232);
        } else if (gx.x < -50) {
            gx.setPosition(440, 232);
        }
    }   
    

    if (player.nextMove) {
        pipeBoundsCheck(player);
       // console.log("X: " + player.x.toString() + "  Y: " + player.y.toString())
        if (player.x < 0) {
            player.x = 0;
            pipeBoundsCheck(player);
        } else {
            pipeBoundsCheck(player);
        }
    }
    
    moveObj.processNextMove(player, PLAYER_SPEED);
    player.x = Math.round(player.x);
    player.y = Math.round(player.y);
    ghosts.children.entries.forEach(ghost => moveObj.processNextMove(ghost, GHOST_SPEED, true));
}


function pipeBoundsCheck(player) {

    //console.log(player)

    let direction = player.nextMove.dir
    let sign = player.nextMove.sign
    let tile;

    // get the current tile of the player
    /**
     * @type {Phaser.Tilemaps.Tile}
     */

    let currentTile = map.getTileAtWorldXY(player.x, player.y, true, null, worldLayer);
    let tileX = currentTile.x;
    let tileY = currentTile.y;


    /* get the tile that pacman wants to enter */
    if (direction == 'x') {
        if (sign == 1) {
            tile = map.getTileAt(tileX + 1, tileY)
        } else if (sign == -1) {
            map.getTileAt(tileX - 1, tileY)
        }

    } else if (direction == 'y') {
        if (sign == 1) {
            map.getTileAt(tileX, tileY + 1)
        } else if (sign == -1) {
            map.getTileAt(tileX + 1, tileY - 1)
        }
    }
}

function winGame () {
    //this.physics.pause();

    player.setTint(0x00ff00);
    player.anims.stop();

    gameOver = true;
    
    setTimeout(() => alert("You Win!"), 200);
    // Start the game over after 2 seconds
    setTimeout(restartGame, 2000);
}

function eatDot(player, dot) {
    dot.disableBody(true, true);

    //  Add and update the score
    score += 10;
    scoreText.setText('Score: ' + score);

    // munch sound plays
    munch.play();

    if ((dots.countActive(true) === 0) && ghostDots.countActive(true) === 0) {
        this.physics.pause();
        winGame();
    }
}

let reEnableTimeout = null;
function eatGhostDot(player, ghostDot) {
    ghostDot.disableBody(true, true);

    //  Add and update the score
    score += 50;
    scoreText.setText('Score: ' + score);

    // Change all ghost images to blue vulnerable ghost
    ghosts.children.iterate((child) => {
        child.setTexture('vulnerable-ghost');
    });
    ghostFunc.setGhostSize(ghosts, true);

    // Make player able to eat ghosts
    player.isPowerful = true;

    // Remake dots if they're all eaten
    if ((dots.countActive(true) === 0) && ghostDots.countActive(true) === 0) {
        this.physics.pause();
        winGame();

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
    } else {
        // Get rid of the reEnable timeout
        if (reEnableTimeout) {
            clearTimeout(reEnableTimeout);
        }
        // Set the new timeout
        reEnableTimeout = setTimeout(ghostFunc.enableGhosts, 10 * 1000);
    }
}

function hitGhost(player, ghost) {
    if (player.isPowerful) {
        ghost.disableBody(true, true);
        
        // Remove ghost and then respawn it in the box
        ghostFunc.respawnGhost(ghost);
        score += 100;
        
    } else {
        this.physics.pause();

        player.setTint(0xff0000);
        player.anims.stop();

        gameOver = true;
        // Start the game over after 2 seconds
        setTimeout(restartGame, 2000);
    }
}
