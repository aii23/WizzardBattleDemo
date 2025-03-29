import { GameObjects, Scene } from "phaser";
import { UserState } from "../../state/UserState";

const state = UserState.getInstance();

export class WizardOption extends GameObjects.Container {
    private wizardImage: GameObjects.Image;
    private borderRect: GameObjects.Rectangle;
    wizardId: number;
    isSelected: boolean;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        wizardId: number,
        isSelected: boolean,
        onSelect: (wizardId: number) => void
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
        this.wizardImage = scene.add.image(0, 0, `wizard_${wizardId}`);
        this.wizardImage.setOrigin(0, 0);
        this.wizardImage.setDisplaySize(100, 100);
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
            if (!this.isSelected) {
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
                wizardId === state.userWizardId,
                (selectedId) => this.handleWizardSelection(selectedId)
            );
            this.options.push(option);
            this.add(option);
        });
    }

    private handleWizardSelection(wizardId: number): void {
        console.log("In handle wizard selection ", wizardId);
        // Deselect previous option if any
        const previousOption = this.options.find(
            (opt) => opt.wizardId === state.userWizardId
        );
        console.log("Previous option ", previousOption);
        if (previousOption) {
            previousOption.toggleSelection();
        }

        // Select new option
        UserState.getInstance().userWizardId = wizardId;
    }
}

