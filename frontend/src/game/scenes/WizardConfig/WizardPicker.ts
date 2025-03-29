import { GameObjects, Scene } from "phaser";

export class WizardOption extends GameObjects.Image {
    wizardId: number;
    isSelected: boolean;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        wizardId: number,
        onSelect: (wizardId: number) => void
    ) {
        console.log("In wizard option");
        super(scene, x, y, `wizard_${wizardId}`);
        this.setOrigin(0, 0);
        this.wizardId = wizardId;
        this.isSelected = false;
        this.setDisplaySize(150, 150);
        scene.add.existing(this);
        this.setInteractive();

        // Optional: add a hover effect
        this.on("pointerover", () => {
            if (!this.isSelected) {
                this.setTint(0xffaa00);
            }
        });
        this.on("pointerout", () => {
            if (!this.isSelected) {
                this.clearTint();
            }
        });

        this.on("pointerdown", () => {
            this.toggleSelection();
            onSelect(this.wizardId);
        });
    }

    toggleSelection(): void {
        this.isSelected = !this.isSelected;
        if (this.isSelected) {
            this.setTint(0x00ff00);
        } else {
            this.clearTint();
        }
    }
}

export class WizardPicker extends GameObjects.Container {
    private options: WizardOption[];
    private selectedWizardId: number | null = null;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y);
        scene.add.existing(this);
        this.options = [];

        // Create multiple wizard options
        const spacing = 160; // Space between options
        const wizardIds = [1, 2]; // Example wizard IDs

        wizardIds.forEach((wizardId, index) => {
            const option = new WizardOption(
                scene,
                index * spacing,
                0,
                wizardId,
                (selectedId) => this.handleWizardSelection(selectedId)
            );
            this.options.push(option);
            this.add(option);
        });
    }

    private handleWizardSelection(wizardId: number): void {
        // Deselect previous option if any
        if (this.selectedWizardId !== null) {
            const previousOption = this.options.find(
                (opt) => opt.wizardId === this.selectedWizardId
            );
            if (previousOption) {
                previousOption.toggleSelection();
            }
        }

        // Select new option
        this.selectedWizardId = wizardId;
    }

    getSelectedWizardId(): number | null {
        return this.selectedWizardId;
    }
}

