import { EventBus } from "../EventBus";
import { GameObjects, Scene } from "phaser";
import { io, Socket } from "socket.io-client";
import { UserState } from "../state/UserState";
import { MatchFoundResponse } from "../../../../common/types/matchmaking.types";

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
    private socket: Socket;

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
        // #TODO move socket to user state
        this.socket = io(process.env.NEXT_PUBLIC_SERVER_URL!);
        this.socket.on("connect", () => {
            console.log("Connected to socket");
            this.socket.emit(
                "findMatch",
                userState.getPublicData(this.socket.id!)
            );
        });

        this.socket.on("waitingForOpponent", () => {
            console.log("Waiting for opponent...");
        });

        this.socket.on("matchFound", (data: MatchFoundResponse) => {
            console.log("Match found! Full data:", data);
            this.handleMatchFound(data);
        });

        EventBus.emit("current-scene-ready", this);
    }

    private handleMatchFound(data: MatchFoundResponse) {
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
        // if (this.socket) {
        //     this.socket.disconnect();
        //     this.socket = null;
        // }

        const matchMetaData = {
            matchId: data.matchId,
            opponent: data.opponent,
        };

        console.log("Match found! Full data:", data);
        console.log(this.socket.id);

        // Start game scene
        this.scene.start("Game", {
            metaData: matchMetaData,
            playerData: userState.getData(this.socket.id!),
            opponentData: data.state.find(
                (player) => player.playerId !== this.socket.id
            ),
            socket: this.socket,
        });
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
        // if (this.socket) {
        //     this.socket.disconnect();
        //     this.socket = null;
        // }
    }
}

