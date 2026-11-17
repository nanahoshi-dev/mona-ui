/**
 * An image, such as a logo, drawn over the center of the code.
 */
export interface QrCodeImageOverlay {
    /**
     * The image's width and height as a share of the code's, without the quiet zone. The image keeps its aspect ratio
     * inside that square. Defaults to `0.2`.
     */
    readonly size?: number;
    /**
     * The image's URL. Exporting reads it into the file, so an image from another origin has to allow it with CORS.
     */
    readonly src: string;
    readonly type: "image";
}

/**
 * The Swiss cross of a Swiss QR code, the code on a Swiss QR-bill, drawn over the center at the size the standard sets.
 */
export interface QrCodeSwissOverlay {
    readonly type: "swiss";
}

/**
 * What to draw over the center of the code. The modules beneath it are cleared, so the overlay relies on error
 * correction to read.
 */
export type QrCodeOverlay = QrCodeImageOverlay | QrCodeSwissOverlay;
