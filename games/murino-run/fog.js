// murino-run/fog.js
import { CONFIG } from './config.js';
import { STATES, gameState } from './gameState.js';
import { scene } from './world.js';
import { ASSETS } from './assets.js';

export class FogMonster {
    constructor() {
        this.model = null;
        this.mixer = null;
        
        // Timer for the cinematic sequence
        this.deathTimer = 0;
        this.maxDeathTime = 2.5; // 2.5 seconds before game over UI shows
        
        this.initModel();
    }

    initModel() {
        const fogAsset = ASSETS.models['fog'];
        if (fogAsset && fogAsset.scene) {
            this.model = fogAsset.scene;
            this.mixer = fogAsset.mixer;
            
            // Scale and hide initially
            this.model.scale.set(1.5, 1.5, 1.5);
            this.model.visible = false;
            scene.add(this.model);
        } else {
            // Fallback if model not loaded: Big scary red cube
            const geo = new THREE.BoxGeometry(3, 4, 3);
            const mat = new THREE.MeshBasicMaterial({ color: 0x880000 });
            this.model = new THREE.Mesh(geo, mat);
            this.model.visible = false;
            scene.add(this.model);
        }
    }

    startDeathSequence(playerZ, playerX) {
        this.model.visible = true;
        // Position Fog behind the player (since player ran in -Z direction, behind is +Z)
        this.model.position.set(playerX, 0, playerZ + 15);
        this.model.rotation.y = Math.PI; // Face the player
        
        this.deathTimer = 0;
    }

    update(delta, camera) {
        if (this.mixer) {
            this.mixer.update(delta);
        }

        if (gameState.current === STATES.DYING) {
            this.deathTimer += delta;

            // Move the Fog closer to the camera/player
            this.model.position.z -= 8 * delta;

            // The "neck turn" cinematic logic happens in the main index.js camera update,
            // but after 2.5 seconds, the monster "eats" the player -> GAME OVER
            if (this.deathTimer >= this.maxDeathTime) {
                gameState.set(STATES.GAME_OVER);
            }
        }
    }

    reset() {
        this.model.visible = false;
        this.deathTimer = 0;
    }
}
