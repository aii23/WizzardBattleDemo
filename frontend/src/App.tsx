import { useRef, useState, useEffect, use } from "react";
import { IRefPhaserGame, PhaserGame } from "./game/PhaserGame";
import { MainMenu } from "./game/scenes/MainMenu";
import { TRPCProvider } from "./providers/TRPCProvider";
import { trpc } from "./utils/trpc";
import { useXPStore } from "./store/xpStore";

declare global {
    interface Window {
        mina?: any;
        setLevel?: (level: number) => void;
        setMageLevel?: (wizardId: string, level: number) => void;
    }
}

function App() {
    // The sprite can only be moved in the MainMenu Scene
    const [canMoveSprite, setCanMoveSprite] = useState(true);

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const [address, setAddress] = useState<string | null>(null);

    const xpStore = useXPStore();

    const { data: xpData } = trpc.xp.get.useQuery(
        { address: address! },
        { enabled: !!address }
    );

    // Event emitted from the PhaserGame component
    const currentScene = (scene: Phaser.Scene) => {
        setCanMoveSprite(scene.scene.key !== "MainMenu");
    };

    useEffect(() => {
        (async () => {
            if (typeof window.mina !== "undefined") {
                console.log("Auro Wallet is installed!");
                const accounts = await window.mina.requestAccounts();
                setAddress(accounts[0]);
                console.log(accounts);
            } else {
                console.log("Auro Wallet is not installed!");
            }
        })();
    }, []);

    /*
    export interface WizardXPStat {
    wizardId: string;
    wizardLevel: number;
    wizardXP: number;
}

export interface XPState {
    address: string;
    accountLevel: number;
    accountXP: number;
    wizards: WizardXPStat[];
}
    */

    useEffect(() => {
        if (xpData) {
            window.setLevel = (level: number) => {
                xpStore.setXPData({
                    ...xpData,
                    accountLevel: level,
                });
            };

            window.setMageLevel = (wizardId: string, level: number) => {
                xpStore.setXPData({
                    ...xpData,
                    wizards: xpData.wizards.map((wizard) =>
                        wizard.wizardId === wizardId
                            ? { ...wizard, wizardLevel: level }
                            : wizard
                    ),
                });
            };
        }
    }, [xpData]);

    useEffect(() => {
        if (xpData) {
            xpStore.setXPData(xpData);
        }
    }, [xpData]);

    const someFunction = async () => {
        console.log("someFunction");
    };

    return (
        <TRPCProvider>
            <div id="app">
                <PhaserGame
                    ref={phaserRef}
                    currentActiveScene={currentScene}
                    someFunction={someFunction}
                />
                {/* <div>
                    <div>
                        <button className="button" onClick={changeScene}>Change Scene</button>
                    </div>
                    <div>
                        <button disabled={canMoveSprite} className="button" onClick={moveSprite}>Toggle Movement</button>
                    </div>
                    <div className="spritePosition">Sprite Position:
                        <pre>{`{\n  x: ${spritePosition.x}\n  y: ${spritePosition.y}\n}`}</pre>
                    </div>
                    <div>
                        <button className="button" onClick={addSprite}>Add New Sprite</button>
                    </div>
                </div> */}
            </div>
        </TRPCProvider>
    );
}

export default App;

