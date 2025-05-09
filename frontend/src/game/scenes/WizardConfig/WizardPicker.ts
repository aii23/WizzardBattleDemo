import { GameObjects, Scene } from "phaser";
import { UserState } from "../../state/UserState";
import { allWizards } from "../../../../../common/wizards";
import { SpellPicker } from "./SpellPicker";
import { useXPStore } from "@/store/xpStore";

const state = UserState.getInstance();

export class WizardOption extends GameObjects.Container {
    private wizardImage: GameObjects.Image;
    private borderRect: GameObjects.Rectangle;
    wizardId: string;
    isSelected: boolean;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        wizardId: string,
        isSelected: boolean,
        available: boolean,
        onSelect: (wizardId: string) => void
    ) {
        super(scene, x, y);
        scene.add.existing(this);

        this.wizardId = wizardId;
        this.isSelected = isSelected;

        // Create border rectangle
        this.borderRect = scene.add.rectangle(50, 50, 100, 100, 0x00ff00);
        this.borderRect.setStrokeStyle(4, 0x00ff00);
        this.borderRect.setFillStyle(0x00ff00, 0);
        this.borderRect.setVisible(isSelected);
        this.add(this.borderRect);

        // Create wizard image
        this.wizardImage = scene.add.image(0, 0, `wizard_${wizardId + 1}`);
        this.wizardImage.setOrigin(0, 0);
        this.wizardImage.setDisplaySize(100, 100);
        this.wizardImage.setTint(available ? 0x00ff00 : 0xff0000);
        this.add(this.wizardImage);

        // Make the container interactive
        this.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, 100, 100),
            Phaser.Geom.Rectangle.Contains
        );

        // Optional: add a hover effect
        this.on("pointerover", () => {
            if (!this.isSelected) {
                this.wizardImage.setTint(0xffaa00);
            }
        });
        this.on("pointerout", () => {
            if (!this.isSelected) {
                this.wizardImage.clearTint();
            }
        });

        this.on("pointerdown", () => {
            if (!this.isSelected && available) {
                this.toggleSelection();
                onSelect(this.wizardId);
            }
        });
    }

    toggleSelection(): void {
        this.isSelected = !this.isSelected;
        this.wizardImage.clearTint();
        if (this.isSelected) {
            // this.wizardImage.setTint(0x00ff00);
            this.borderRect.setVisible(true);
        } else {
            // this.wizardImage.clearTint();
            this.borderRect.setVisible(false);
        }
    }
}

export class WizardPicker extends GameObjects.Container {
    private options: WizardOption[];
    private spellPicker: SpellPicker;
    constructor(scene: Scene, x: number, y: number, spellPicker: SpellPicker) {
        super(scene, x, y);
        scene.add.existing(this);
        this.options = [];
        this.spellPicker = spellPicker;

        const xpData = useXPStore().xpData;
        // Create multiple wizard options
        const spacing = 160; // Space between options
        let wizardIds = ["Mage", "Warrior"]; // Example wizard IDs
        let wizardIdsExpanded = wizardIds.map((id) => {
            const wizard = allWizards.find((w) => w.id === id);
            if (wizard && wizard.requiredLevel) {
                const curLevel = xpData?.accountLevel || 0;
                return {
                    id: id,
                    available: wizard.requiredLevel <= curLevel,
                };
            }

            return {
                id: id,
                available: true,
            };
        });

        wizardIdsExpanded.forEach((wizard, index) => {
            const option = new WizardOption(
                scene,
                index * spacing,
                0,
                wizard.id,
                wizard.id === state.wizard.id,
                wizard.available,
                (selectedId) => this.handleWizardSelection(selectedId)
            );
            this.options.push(option);
            this.add(option);
        });
    }

    private handleWizardSelection(wizardId: string): void {
        console.log("In handle wizard selection ", wizardId);
        // Deselect previous option if any
        const previousOption = this.options.find(
            (opt) => opt.wizardId === state.wizard.id
        );
        console.log("Previous option ", previousOption);
        if (previousOption) {
            previousOption.toggleSelection();
        }

        // Select new option
        console.log("In handle wizard selection ", wizardId);
        UserState.getInstance().wizard = allWizards.find(
            (w) => w.id === wizardId
        )!;
        console.log("User state ", UserState.getInstance().wizard);
        this.spellPicker.updateSpellsInfo();
    }
}

