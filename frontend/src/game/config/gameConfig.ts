export const GameConfig = {
    GRID: {
        SIZE: 5,
        TILE_SIZE: 40,
        SPACING: 1,
    },
    UI: {
        HEALTH_BAR: {
            WIDTH: 160,
            HEIGHT: 20,
        },
        TEXT: {
            FONT: "32px Arial",
            COLOR: "#fff",
            STROKE: "#000",
            STROKE_THICKNESS: 4,
        },
    },
    SCREEN: {
        WIDTH: 1024,
        HEIGHT: 768,
        CENTER_X: 512,
        CENTER_Y: 384,
    },
} as const;
