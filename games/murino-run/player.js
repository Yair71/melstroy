// murino-run/player.js
import { CONFIG } from './config.js';
import { STATES, gameState } from './gameState.js';
import { ASSETS } from './assets.js';
import { scene } from './world.js';

export class Player {
    constructor() {
        this.group = new THREE.Group();
        scene.add(this.group);

        this.models = {};
        this.activeModel = null;
        this.activeMixer = null;

        // Movement & Physics
        this.lane = 0; // -1 (Left), 0 (Center), 1 (Right)
        this.targetX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        
        this.initModels();
        this.setupVideoFace();

        // Randomly pick a dance for the INTRO state
        const startDance = Math.random() > 0.5 ? 'dance1' : 'dance2';
        this.switchModel(startDance);
    }

    initModels() {
        // Attach all models to the player group but hide them initially
        const modelNames = ['run', 'jump', 'fall', 'dance1', 'dance2'];
        
        modelNames.forEach(name => {
            const asset = ASSETS.models[name];
            if (asset && asset.scene) {
                // Clone the scene so we don't mutate the original asset directly
                const modelScene = asset.scene; 
                modelScene.visible = false; // Hide by default
                
                // Adjust scale or rotation if needed (assuming your models face +Z)
                modelScene.rotation.y = Math.PI; // Face away from camera

                this.group.add(modelScene);
                this.models[name] = {
                    scene: modelScene,
                    mixer: asset.mixer,
                    action: asset.action
                };
            }
        });
    }

    setupVideoFace() {
        if (!ASSETS.videoElement) return;

        // Create a video texture from the preloaded video element
        const videoTexture = new THREE.VideoTexture(ASSETS.videoElement);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.format = THREE.RGBAFormat;

        // Create a small plane for the face
        const faceGeo = new THREE.PlaneGeometry(0.5, 0.5); // Adjust size as needed
        const faceMat = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide });
        this.videoFace = new THREE.Mesh(faceGeo, faceMat);
        
        // Position it where the face should be (adjust Y and Z based on your model's height)
        this.videoFace.position.set(0, 1.6, -0.2); 
        this.videoFace.rotation.y = Math.PI; // Face the camera
        this.videoFace.visible = false; // Hidden until 'PLAY' is clicked

        // Attach it to the main player group so it moves with the player
        this.group.add(this.videoFace);
    }

    switchModel(name) {
        // Hide current model
        if (this.activeModel) {
            this.activeModel.scene.visible = false;
        }

        // Show new model
        const newModel = this.models[name];
        if (newModel) {
            newModel.scene.visible = true;
            this.activeModel = newModel;
            this.activeMixer = newModel.mixer;

            // Reset and play the animation from the start
            if (newModel.action) {
                newModel.action.reset();
                newModel.action.play();
            }
        }
    }

    startGame() {
        // Play the meme video and show it on the face
        if (ASSETS.videoElement) {
            ASSETS.videoElement.play();
            this.videoFace.visible = true;
        }

        // Switch to run animation
        this.switchModel('run');
    }

    moveLeft() {
        if (this.lane > -1 && gameState.current === STATES.PLAYING) {
            this.lane--;
            this.targetX = this.lane * CONFIG.GAME.LANE_WIDTH;
        }
    }

    moveRight() {
        if (this.lane < 1 && gameState.current === STATES.PLAYING) {
            this.lane++;
            this.targetX = this.lane * CONFIG.GAME.LANE_WIDTH;
        }
    }

    jump() {
        if (!this.isJumping && gameState.current === STATES.PLAYING) {
            this.isJumping = true;
            this.velocityY = CONFIG.GAME.JUMP_FORCE;
            this.switchModel('jump');
        }
    }

    die() {
        // Called when hitting an obstacle
        gameState.set(STATES.DYING);
        this.switchModel('fall');
        
        // Hide the video face when falling/dying to not break the dramatic effect
        if (this.videoFace) {
            this.videoFace.visible = false;
        }
    }

    update(delta, speed) {
        // 1. Update active animation
        if (this.activeMixer) {
            this.activeMixer.update(delta);
        }

        if (gameState.current === STATES.PLAYING) {
            // 2. Forward Movement
            this.group.position.z -= speed * delta;

            // 3. Lane Swapping (Smooth Lerp)
            this.group.position.x += (this.targetX - this.group.position.x) * CONFIG.GAME.LANE_CHANGE_SPEED * delta;

            // 4. Jumping & Gravity
            if (this.isJumping) {
                this.velocityY += CONFIG.GAME.GRAVITY * delta;
                this.group.position.y += this.velocityY * delta;

                // Landed on the ground
                if (this.group.position.y <= 0) {
                    this.group.position.y = 0;
                    this.isJumping = false;
                    this.velocityY = 0;
                    this.switchModel('run'); // Go back to running model
                }
            }
        }
    }
}
