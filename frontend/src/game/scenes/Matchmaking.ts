import { EventBus } from "../EventBus";
import { GameObjects, Scene } from "phaser";
import { io } from "socket.io-client";
import { UserState } from "../state/UserState";

const userState = UserState.getInstance();

export class Matchmaking extends Scene {
    private camera: Phaser.Cameras.Scene2D.Camera;
    private background: GameObjects.Image;
    private statusText: GameObjects.Text;
    private timerText: GameObjects.Text;
    private loadingDots: GameObjects.Text;
    private timeElapsed: number = 0;
    private loadingTimer: Phaser.Time.TimerEvent | null = null;
    private dotsTimer: Phaser.Time.TimerEvent | null = null;
    private socket: any;

    constructor() {
        super("Matchmaking");
    }

    create() {
        this.camera = this.cameras.main;
        // this.camera.setBackgroundColor(0xff0000);

        this.background = this.add.image(512, 384, "main_screen");
        // this.background.setAlpha(0.5);

        // Status text
        this.statusText = this.add
            .text(512, 300, "Looking for opponent", {
                fontFamily: "Arial Black",
                fontSize: 48,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 8,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        // Loading dots
        this.loadingDots = this.add
            .text(512, 350, "", {
                fontFamily: "Arial Black",
                fontSize: 48,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 8,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        // Timer text
        this.timerText = this.add
            .text(512, 400, "Time: 0s", {
                fontFamily: "Arial Black",
                fontSize: 32,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 8,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        // Start timers
        this.startTimers();

        // Connect to socket and start matchmaking
        this.socket = io("http://localhost:3030");
        this.socket.emit("findMatch", {
            spells: userState.userSpells,
            mapStructure: userState.userMap,
        });

        this.socket.on("waitingForOpponent", () => {
            console.log("Waiting for opponent...");
        });

        this.socket.on(
            "matchFound",
            (data: { matchId: string; opponent: string }) => {
                console.log("Match found!", data);
                this.handleMatchFound(data);
            }
        );

        EventBus.emit("current-scene-ready", this);
    }

    private handleMatchFound(data: { matchId: string; opponent: string }) {
        // Stop timers
        if (this.loadingTimer) {
            this.loadingTimer.destroy();
            this.loadingTimer = null;
        }
        if (this.dotsTimer) {
            this.dotsTimer.destroy();
            this.dotsTimer = null;
        }

        // Hide UI elements
        if (this.statusText) this.statusText.setVisible(false);
        if (this.loadingDots) this.loadingDots.setVisible(false);
        if (this.timerText) this.timerText.setVisible(false);

        // Disconnect socket
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        // Start game scene
        this.scene.start("Game", data);
    }

    private startTimers() {
        // Timer for elapsed time
        this.loadingTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true,
        });

        // Timer for loading dots animation
        this.dotsTimer = this.time.addEvent({
            delay: 500,
            callback: this.updateLoadingDots,
            callbackScope: this,
            loop: true,
        });
    }

    private updateTimer() {
        this.timeElapsed++;
        this.timerText.setText(`Time: ${this.timeElapsed}s`);
    }

    private updateLoadingDots() {
        const dots =
            this.loadingDots.text.length >= 3
                ? ""
                : this.loadingDots.text + ".";
        this.loadingDots.setText(dots);
    }

    destroy() {
        // Clean up timers
        if (this.loadingTimer) {
            this.loadingTimer.destroy();
            this.loadingTimer = null;
        }
        if (this.dotsTimer) {
            this.dotsTimer.destroy();
            this.dotsTimer = null;
        }

        // Clean up socket connection
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

