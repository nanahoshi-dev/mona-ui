import type { jsPDF } from "jspdf";
import { QrCodeExportError } from "../models/QrCodeExportError";
import type { QrCodeExportFormat } from "../models/QrCodeExportFormat";
import type { QrCodeExportResult } from "../models/QrCodeExportResult";
import { polygonPath, type QrCodeBox, type QrCodePoint, type QrCodeScene } from "./qr-code-scene";

/** A color with each channel, alpha included, from 0 to 255. */
export interface QrCodeColor {
    readonly a: number;
    readonly b: number;
    readonly g: number;
    readonly r: number;
}

export interface QrCodeExportRequest {
    readonly background: QrCodeColor;
    readonly document: Document;
    readonly foreground: QrCodeColor;
    readonly format: QrCodeExportFormat;
    /** The accessible name, written into an SVG's `<title>`. */
    readonly label: string;
    /** The width and height in CSS pixels. */
    readonly size: number;
}

export interface QrCodeSvgOptions {
    readonly background: QrCodeColor;
    readonly foreground: QrCodeColor;
    /** The overlay image's URL as the document should hold it, such as a data URL. */
    readonly imageHref: string | null;
    readonly label: string;
    readonly size: number;
}

/** PDF points per CSS pixel: 72 points and 96 pixels to the inch. */
export const PDF_POINTS_PER_PX = 0.75;

/** The largest canvas side every current browser draws. */
export const MAX_PNG_SIZE = 16384;

/** How long the overlay image may take to load before the export fails instead of waiting forever. */
export const IMAGE_LOAD_TIMEOUT_MS = 15_000;

/** The overlay image's pixels per point when a PDF embeds it. */
const PDF_IMAGE_PIXELS_PER_POINT = 4;

const MIME_TYPES: Readonly<Record<QrCodeExportFormat, string>> = {
    pdf: "application/pdf",
    png: "image/png",
    svg: "image/svg+xml"
};

export async function exportQrCodeScene(scene: QrCodeScene, request: QrCodeExportRequest): Promise<QrCodeExportResult> {
    const blob = await exportBlob(scene, request);
    return { blob, format: request.format, mimeType: MIME_TYPES[request.format], size: request.size };
}

/**
 * The code as a standalone SVG document. The background and the dark modules are a rectangle and a single path, drawn
 * with `crispEdges` so that modules meet without seams at any scale.
 */
export function renderQrCodeSvg(scene: QrCodeScene, options: QrCodeSvgOptions): string {
    const { background, foreground } = options;
    const parts = [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${options.size}" height="${options.size}" ` +
            `viewBox="0 0 ${scene.size} ${scene.size}" shape-rendering="crispEdges" role="img">`,
        `<title>${escapeXml(options.label)}</title>`
    ];
    if (background.a > 0) {
        parts.push(`<rect width="${scene.size}" height="${scene.size}"${svgFill(background)}/>`);
    }
    if (scene.modulesPath) {
        parts.push(`<path d="${scene.modulesPath}"${svgFill(foreground)}/>`);
    }
    const overlay = scene.overlay;
    if (overlay?.kind === "swiss") {
        parts.push(
            svgRect(overlay.box, background),
            svgRect(overlay.badge, foreground),
            `<path d="${polygonPath(overlay.cross)}"${svgFill(background)}/>`
        );
    } else if (overlay?.kind === "image" && options.imageHref) {
        const { box } = overlay;
        parts.push(
            `<image href="${escapeXml(options.imageHref)}" x="${round(box.x)}" y="${round(box.y)}" ` +
                `width="${round(box.size)}" height="${round(box.size)}" preserveAspectRatio="xMidYMid meet"/>`
        );
    }
    parts.push("</svg>");
    return parts.join("");
}

export function toCssColor(color: QrCodeColor): string {
    return `rgb(${color.r} ${color.g} ${color.b} / ${round(color.a / 255)})`;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        try {
            canvas.toBlob(blob => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new QrCodeExportError("png-rasterization-failed", "The browser couldn't encode the PNG."));
                }
            }, "image/png");
        } catch (error) {
            // A canvas holding an image another origin didn't allow can't be read.
            reject(
                new QrCodeExportError(
                    "resource-load-failed",
                    "The overlay image comes from another origin that doesn't allow reading it (CORS).",
                    { cause: error }
                )
            );
        }
    });
}

function escapeXml(text: string): string {
    return text.replace(/[<>&"']/g, character => `&#${character.charCodeAt(0)};`);
}

async function exportBlob(scene: QrCodeScene, request: QrCodeExportRequest): Promise<Blob> {
    switch (request.format) {
        case "svg": {
            const overlay = scene.overlay;
            const imageHref = overlay?.kind === "image" ? await readAsDataUrl(overlay.src, request.document) : null;
            const svg = renderQrCodeSvg(scene, { ...request, imageHref });
            return new Blob([svg], { type: MIME_TYPES.svg });
        }
        case "png":
            return exportPng(scene, request);
        case "pdf":
            return exportPdf(scene, request);
    }
}

async function exportPdf(scene: QrCodeScene, request: QrCodeExportRequest): Promise<Blob> {
    let jsPdfModule: typeof import("jspdf");
    try {
        jsPdfModule = await import("jspdf");
    } catch (error) {
        throw new QrCodeExportError(
            "pdf-generation-failed",
            "Exporting a QR code as a PDF needs the jspdf package. Install it alongside Mona UI.",
            { cause: error }
        );
    }
    const overlay = scene.overlay;
    const image = overlay?.kind === "image" ? await loadImage(overlay.src, request.document) : null;

    try {
        const page = request.size * PDF_POINTS_PER_PX;
        const unit = page / scene.size;
        const pdf = new jsPdfModule.jsPDF({
            compress: true,
            format: [page, page],
            orientation: "portrait",
            unit: "pt"
        });
        const setFill = (color: QrCodeColor) => {
            pdf.setFillColor(color.r, color.g, color.b);
            pdf.setGState(new jsPdfModule.GState({ opacity: color.a / 255 }));
        };
        const fillBox = (box: QrCodeBox, color: QrCodeColor) => {
            if (color.a > 0) {
                setFill(color);
                pdf.rect(box.x * unit, box.y * unit, box.size * unit, box.size * unit, "F");
            }
        };

        fillBox({ size: scene.size, x: 0, y: 0 }, request.background);
        // One path for every module, so a viewer fills them as a single shape without hairlines where they meet.
        const runs = moduleRuns(scene);
        if (runs.length > 0 && request.foreground.a > 0) {
            setFill(request.foreground);
            for (const [x, y, length] of runs) {
                pdf.moveTo(x * unit, y * unit);
                pdf.lineTo((x + length) * unit, y * unit);
                pdf.lineTo((x + length) * unit, (y + 1) * unit);
                pdf.lineTo(x * unit, (y + 1) * unit);
                pdf.close();
            }
            pdf.fill();
        }

        if (overlay?.kind === "swiss") {
            fillBox(overlay.box, request.background);
            fillBox(overlay.badge, request.foreground);
            if (request.background.a > 0) {
                setFill(request.background);
                tracePolygon(overlay.cross, unit, pdf);
                pdf.fill();
            }
        } else if (overlay?.kind === "image" && image) {
            // jsPDF embeds raster images only, so an SVG logo is drawn to a canvas first.
            const pixels = Math.max(1, Math.round(overlay.box.size * unit * PDF_IMAGE_PIXELS_PER_POINT));
            const fitted = fitImage({ size: pixels, x: 0, y: 0 }, image);
            const canvas = request.document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(fitted.width));
            canvas.height = Math.max(1, Math.round(fitted.height));
            canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
            const box = fitImage(overlay.box, image);
            pdf.setGState(new jsPdfModule.GState({ opacity: 1 }));
            pdf.addImage(
                canvas.toDataURL("image/png"),
                "PNG",
                box.x * unit,
                box.y * unit,
                box.width * unit,
                box.height * unit
            );
        }
        return pdf.output("blob");
    } catch (error) {
        if (error instanceof QrCodeExportError) {
            throw error;
        }
        const tainted = error instanceof DOMException && error.name === "SecurityError";
        throw new QrCodeExportError(
            tainted ? "resource-load-failed" : "pdf-generation-failed",
            tainted
                ? "The overlay image comes from another origin that doesn't allow reading it (CORS)."
                : "jsPDF failed to write the page.",
            { cause: error }
        );
    }
}

async function exportPng(scene: QrCodeScene, request: QrCodeExportRequest): Promise<Blob> {
    const size = Math.round(request.size);
    if (size < scene.size || size > MAX_PNG_SIZE) {
        throw new QrCodeExportError(
            "invalid-size",
            `A PNG of this code is between ${scene.size} and ${MAX_PNG_SIZE} pixels wide, one pixel per module at least; ` +
                `got ${size}.`
        );
    }
    const canvas = request.document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) {
        throw new QrCodeExportError("png-rasterization-failed", "The browser has no 2D canvas to draw the PNG on.");
    }

    // Whole pixels per module keep the edges sharp, and the pixels left over widen the quiet zone.
    const modulePixels = Math.floor(size / scene.size);
    const offset = Math.floor((size - modulePixels * scene.size) / 2);
    const fill = (color: QrCodeColor, draw: () => void) => {
        if (color.a > 0) {
            context.fillStyle = toCssColor(color);
            draw();
        }
    };
    const fillBox = (box: QrCodeBox, color: QrCodeColor) =>
        fill(color, () => context.fillRect(box.x, box.y, box.size, box.size));

    fill(request.background, () => context.fillRect(0, 0, size, size));
    context.setTransform(modulePixels, 0, 0, modulePixels, offset, offset);
    fill(request.foreground, () => context.fill(new Path2D(scene.modulesPath)));

    const overlay = scene.overlay;
    if (overlay?.kind === "swiss") {
        fillBox(overlay.box, request.background);
        fillBox(overlay.badge, request.foreground);
        fill(request.background, () => context.fill(new Path2D(polygonPath(overlay.cross))));
    } else if (overlay?.kind === "image") {
        const image = await loadImage(overlay.src, request.document);
        const box = fitImage(overlay.box, image);
        context.drawImage(image, box.x, box.y, box.width, box.height);
    }
    return canvasToBlob(canvas);
}

/** Where an image fits inside a square, keeping its aspect ratio. An SVG without a size counts as square. */
function fitImage(box: QrCodeBox, image: HTMLImageElement): { height: number; width: number; x: number; y: number } {
    const naturalWidth = image.naturalWidth || 1;
    const naturalHeight = image.naturalHeight || 1;
    const scale = box.size / Math.max(naturalWidth, naturalHeight);
    const width = naturalWidth * scale;
    const height = naturalHeight * scale;
    return { height, width, x: box.x + (box.size - width) / 2, y: box.y + (box.size - height) / 2 };
}

function loadImage(src: string, document: Document): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = document.createElement("img");
        const fail = (message: string) => {
            clearTimeout(timeout);
            reject(new QrCodeExportError("resource-load-failed", message));
        };
        const timeout = setTimeout(
            () => fail(`The overlay image didn't load within ${IMAGE_LOAD_TIMEOUT_MS} ms.`),
            IMAGE_LOAD_TIMEOUT_MS
        );
        // Asking for CORS lets a canvas read an image from another origin that allows it.
        image.crossOrigin = "anonymous";
        image.onload = () => {
            clearTimeout(timeout);
            resolve(image);
        };
        image.onerror = () => fail("The overlay image didn't load, or its origin doesn't allow reading it (CORS).");
        image.src = src;
    });
}

/** Each horizontal run of dark modules as [x, y, length], in the code's coordinates. */
function moduleRuns(scene: QrCodeScene): (readonly [number, number, number])[] {
    const runs: (readonly [number, number, number])[] = [];
    const { modules, quietZone, symbolSize } = scene;
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
            runs.push([start + quietZone, y + quietZone, x - start]);
        }
    }
    return runs;
}

/** The image as a data URL, so the SVG holds it instead of linking to it. */
async function readAsDataUrl(src: string, document: Document): Promise<string> {
    if (src.startsWith("data:")) {
        return src;
    }
    const view = document.defaultView;
    try {
        const response = await fetch(new URL(src, document.baseURI), { mode: "cors" });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const blob = await response.blob();
        return await new Promise<string>((resolve, reject) => {
            const reader = new (view?.FileReader ?? FileReader)();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        throw new QrCodeExportError(
            "resource-load-failed",
            "The overlay image didn't load, or its origin doesn't allow reading it (CORS).",
            { cause: error }
        );
    }
}

function round(value: number): number {
    return Math.round(value * 1000) / 1000;
}

function svgFill(color: QrCodeColor): string {
    const hex = `#${[color.r, color.g, color.b].map(channel => channel.toString(16).padStart(2, "0")).join("")}`;
    return color.a < 255 ? ` fill="${hex}" fill-opacity="${round(color.a / 255)}"` : ` fill="${hex}"`;
}

function svgRect(box: QrCodeBox, color: QrCodeColor): string {
    if (color.a === 0) {
        return "";
    }
    return `<rect x="${round(box.x)}" y="${round(box.y)}" width="${round(box.size)}" height="${round(box.size)}"${svgFill(color)}/>`;
}

function tracePolygon(points: readonly QrCodePoint[], unit: number, pdf: jsPDF): void {
    points.forEach(([x, y], index) => {
        if (index === 0) {
            pdf.moveTo(x * unit, y * unit);
        } else {
            pdf.lineTo(x * unit, y * unit);
        }
    });
    pdf.close();
}
