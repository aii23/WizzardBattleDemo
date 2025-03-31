import { GameObjects, Scene } from "phaser";
import { TileType } from "../../../../../common/types/matchmaking.types";
import { UserState } from "../../state/UserState";

const userState = UserState.getInstance();

export class MapPicker extends GameObjects.Container {
    private gridSize = 5; // Assuming 5x5 grid like in the game
    private tileSize = 30; // 150/5 = 30 pixels per tile
    private gridSpacing = 2; // Small spacing between tiles
    private background: GameObjects.Rectangle;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y);
        scene.add.existing(this);

        // Create a background rectangle
        // this.background = scene.add.rectangle(0, 0, 150, 150, 0x333333);
        // this.add(this.background);

        // Create grid tiles
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const tileX = x * (this.tileSize + this.gridSpacing);
                const tileY = y * (this.tileSize + this.gridSpacing);

                const tileType = userState.userMap.matrix[y][x];
                let tileImage = "";

                switch (tileType) {
                    case TileType.VALLEY:
                        tileImage = "valley";
                        break;
                    case TileType.ROCK:
                        tileImage = "rock";
                        break;
                    case TileType.WATER:
                        tileImage = "water";
                        break;
                }

                // For now, just create valley tiles as a placeholder
                const tile = scene.add
                    .image(
                        tileX + this.tileSize / 2,
                        tileY + this.tileSize / 2,
                        tileImage
                    )
                    .setDisplaySize(this.tileSize, this.tileSize);

                this.add(tile);
            }
        }

        // Add wizard at user's position
        const wizardX =
            userState.userPosition.x * (this.tileSize + this.gridSpacing) +
            this.tileSize / 2;
        const wizardY =
            userState.userPosition.y * (this.tileSize + this.gridSpacing) +
            this.tileSize / 2;

        const wizard = scene.add
            .image(wizardX, wizardY, `wizard_${userState.wizard.id}`)
            .setDisplaySize(this.tileSize * 0.8, this.tileSize * 0.8);

        this.add(wizard);

        this.setInteractive();
        this.setSize(150, 150);

        // Optional: add a hover effect
        this.on("pointerover", () => {
            this.background.setFillStyle(0xffaa00);
        });
        this.on("pointerout", () => {
            this.background.setFillStyle(0x333333);
        });
    }
}

