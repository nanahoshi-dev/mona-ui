import type { QrCodeOverlay } from "../models/QrCodeOverlay";
import { codewordBlocks } from "../utils/qr-code-encoder";
import type { QrCodeMatrix } from "../utils/qr-code-matrix";
import { blockLayout } from "../utils/qr-code-tables";

/** A square in the code's coordinates, which count modules from the outer edge of the quiet zone. */
export interface QrCodeBox {
    readonly size: number;
    readonly x: number;
    readonly y: number;
}

export interface QrCodeImageSceneOverlay {
    /** The square the image is fitted into. */
    readonly box: QrCodeBox;
    /** The cleared square behind it, on whole modules. */
    readonly clear: QrCodeBox;
    readonly kind: "image";
    readonly src: string;
}

export interface QrCodeSwissSceneOverlay {
    /** The square the cross sits on, inside the light frame. */
    readonly badge: QrCodeBox;
    /** The light frame around the badge. */
    readonly box: QrCodeBox;
    /** The cleared square behind it, on whole modules. */
    readonly clear: QrCodeBox;
    /** The corners of the cross, clockwise. */
    readonly cross: readonly QrCodePoint[];
    readonly kind: "swiss";
}

export type QrCodePoint = readonly [x: number, y: number];

export type QrCodeSceneOverlay = QrCodeImageSceneOverlay | QrCodeSwissSceneOverlay;

/** What the component draws, and what the exports draw the same way. */
export interface QrCodeScene {
    /** The dark modules after the overlay's square is cleared, row by row, without the quiet zone. */
    readonly modules: Uint8Array;
    /** The dark modules as SVG path data, one closed rectangle per horizontal run, offset by the quiet zone. */
    readonly modulesPath: string;
    readonly overlay: QrCodeSceneOverlay | null;
    /**
     * Whether the overlay hides more codewords of some block than error correction can recover, so the code may not
     * read.
     */
    readonly overlayExceedsCorrection: boolean;
    readonly quietZone: number;
    /** Modules on each side, quiet zone included: the side of the view box. */
    readonly size: number;
    readonly symbolSize: number;
}

export const DEFAULT_IMAGE_OVERLAY_SIZE = 0.2;

/** The Swiss cross is 7 mm on a 46 mm code. */
const SWISS_OVERLAY_SIZE = 7 / 46;

/** Its light frame is 0.5 mm of the 7 mm. */
const SWISS_FRAME_SHARE = 0.5 / 7;

/**
 * The cleared square stays clear of the finder patterns, their separators and the format information, which take the
 * first 9 modules from each edge it could reach.
 */
const PROTECTED_EDGE = 9;

export function buildQrCodeScene(matrix: QrCodeMatrix, quietZone: number, overlay: QrCodeOverlay | null): QrCodeScene {
    const symbolSize = matrix.size;
    const size = symbolSize + quietZone * 2;
    const modules = matrix.modules.slice();
    let sceneOverlay: QrCodeSceneOverlay | null = null;
    let overlayExceedsCorrection = false;

    if (overlay) {
        const swiss = overlay.type === "swiss";
        const share = swiss ? SWISS_OVERLAY_SIZE : imageOverlayShare(overlay.size);
        // An image gets half a module of clearing on each side at least; the cross brings its own frame.
        const padding = swiss ? 0 : 1;
        const clearCells = Math.min(oddCeiling(share * symbolSize + padding), symbolSize - PROTECTED_EDGE * 2);
        const clearStart = (symbolSize - clearCells) / 2;
        const drawnSize = Math.min(share * symbolSize, clearCells - padding);
        const center = quietZone + symbolSize / 2;
        const box: QrCodeBox = { size: drawnSize, x: center - drawnSize / 2, y: center - drawnSize / 2 };
        const clear: QrCodeBox = { size: clearCells, x: quietZone + clearStart, y: quietZone + clearStart };

        overlayExceedsCorrection = hidesTooMuch(matrix, clearStart, clearCells);
        for (let y = clearStart; y < clearStart + clearCells; y++) {
            modules.fill(0, y * symbolSize + clearStart, y * symbolSize + clearStart + clearCells);
        }
        sceneOverlay =
            overlay.type === "swiss" ? swissOverlay(box, clear) : { box, clear, kind: "image", src: overlay.src };
    }

    return {
        modules,
        modulesPath: modulesPath(modules, symbolSize, quietZone),
        overlay: sceneOverlay,
        overlayExceedsCorrection,
        quietZone,
        size,
        symbolSize
    };
}

/**
 * Whether some block has more codewords under the cleared square than it can correct. The square counts as unknown
 * rather than light, since an overlay can be read as either.
 */
function hidesTooMuch(matrix: QrCodeMatrix, clearStart: number, clearCells: number): boolean {
    const layout = blockLayout(matrix.version, matrix.errorCorrection);
    const blockOf = codewordBlocks(matrix.version, matrix.errorCorrection);
    const hidden = new Set<number>();
    for (let y = clearStart; y < clearStart + clearCells; y++) {
        for (let x = clearStart; x < clearStart + clearCells; x++) {
            const codeword = matrix.codewordIndices[y * matrix.size + x];
            if (codeword >= 0) {
                hidden.add(codeword);
            }
        }
    }
    const perBlock = new Array<number>(layout.blocks).fill(0);
    hidden.forEach(codeword => perBlock[blockOf[codeword]]++);
    const correctable = Math.floor((layout.ecCodewordsPerBlock - layout.misdecodeProtection) / 2);
    return perBlock.some(count => count > correctable);
}

function imageOverlayShare(size: number | undefined): number {
    return size !== undefined && Number.isFinite(size) && size > 0 ? Math.min(size, 1) : DEFAULT_IMAGE_OVERLAY_SIZE;
}

function modulesPath(modules: Uint8Array, symbolSize: number, quietZone: number): string {
    const parts: string[] = [];
    for (let y = 0; y < symbolSize; y++) {
        let x = 0;
        while (x < symbolSize) {
            if (!modules[y * symbolSize + x]) {
                x++;
                continue;
            }
            const start = x;
            while (x < symbolSize && modules[y * symbolSize + x]) {
                x++;
            }
            parts.push(`M${start + quietZone} ${y + quietZone}h${x - start}v1h${start - x}z`);
        }
    }
    return parts.join("");
}

/** The smallest odd whole number at least as large, so a square of that many modules centers on the symbol's grid. */
function oddCeiling(value: number): number {
    const ceiling = Math.ceil(value);
    return ceiling % 2 === 1 ? ceiling : ceiling + 1;
}

/**
 * A dark square in a light frame with the Swiss flag's cross: arms a sixth longer than they are wide, spanning 20/32 of
 * the square.
 */
function swissOverlay(box: QrCodeBox, clear: QrCodeBox): QrCodeSwissSceneOverlay {
    const frame = box.size * SWISS_FRAME_SHARE;
    const badge: QrCodeBox = { size: box.size - frame * 2, x: box.x + frame, y: box.y + frame };
    // The box is centered on the symbol, so both axes share these coordinates.
    const center = box.x + box.size / 2;
    const arm = (badge.size * 3) / 32;
    const reach = (badge.size * 10) / 32;
    const near = center - arm;
    const far = center + arm;
    const start = center - reach;
    const end = center + reach;
    const cross: QrCodePoint[] = [
        [near, start],
        [far, start],
        [far, near],
        [end, near],
        [end, far],
        [far, far],
        [far, end],
        [near, end],
        [near, far],
        [start, far],
        [start, near],
        [near, near]
    ];
    return { badge, box, clear, cross, kind: "swiss" };
}

/** A polygon as SVG path data, rounded to a thousandth of a module. */
export function polygonPath(points: readonly QrCodePoint[]): string {
    const round = (value: number) => Math.round(value * 1000) / 1000;
    return `M${points.map(([x, y]) => `${round(x)} ${round(y)}`).join("L")}Z`;
}
