import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import StartGame from "./main";
import { EventBus } from "./EventBus";

export interface IRefPhaserGame {
    game: Phaser.Game | null;
    scene: Phaser.Scene | null;
    someFunction: () => void;
}

interface IProps {
    currentActiveScene?: (scene_instance: Phaser.Scene) => void;
    someFunction: () => void;
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(
    function PhaserGame({ currentActiveScene, someFunction }, ref) {
        const game = useRef<Phaser.Game | null>(null!);

        useLayoutEffect(() => {
            if (game.current === null) {
                game.current = StartGame("game-container");

                if (typeof ref === "function") {
                    ref({
                        game: game.current,
                        scene: null,
                        someFunction: someFunction,
                    });
                } else if (ref) {
                    ref.current = {
                        game: game.current,
                        scene: null,
                        someFunction: someFunction,
                    };
                }
            }

            return () => {
                if (game.current) {
                    game.current.destroy(true);
                    if (game.current !== null) {
                        game.current = null;
                    }
                }
            };
        }, [ref]);

        useEffect(() => {
            EventBus.on(
                "current-scene-ready",
                (scene_instance: Phaser.Scene) => {
                    if (
                        currentActiveScene &&
                        typeof currentActiveScene === "function"
                    ) {
                        currentActiveScene(scene_instance);
                    }

                    // Pass someFunction to the scene
                    (scene_instance as any).someFunction = someFunction;

                    if (typeof ref === "function") {
                        ref({
                            game: game.current,
                            scene: scene_instance,
                            someFunction: someFunction,
                        });
                    } else if (ref) {
                        ref.current = {
                            game: game.current,
                            scene: scene_instance,
                            someFunction: someFunction,
                        };
                    }
                }
            );
            return () => {
                EventBus.removeListener("current-scene-ready");
            };
        }, [currentActiveScene, ref, someFunction]);

        return <div id="game-container"></div>;
    }
);

