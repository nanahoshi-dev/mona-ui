import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import { Component, computed, effect, ElementRef, inject, input, isDevMode, PLATFORM_ID } from "@angular/core";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { toCssValue } from "@nanahoshi/mona-ui/internal";
import { twMerge } from "tailwind-merge";
import { QR_CODE_DEFAULT_MESSAGES } from "../../i18n/qr-code.default-messages";
import { BLACK, resolveQrCodeColor, WHITE } from "../../internal/qr-code-color";
import { downloadBlob, qrCodeFileName } from "../../internal/qr-code-download";
import { exportQrCodeScene } from "../../internal/qr-code-export";
import { buildQrCodeScene, polygonPath } from "../../internal/qr-code-scene";
import type { QrCodeEncoding } from "../../models/QrCodeEncoding";
import type { QrCodeErrorCorrection } from "../../models/QrCodeErrorCorrection";
import { QrCodeExportError } from "../../models/QrCodeExportError";
import type { QrCodeDownloadOptions, QrCodeExportOptions } from "../../models/QrCodeExportOptions";
import type { QrCodeExportResult } from "../../models/QrCodeExportResult";
import type { QrCodeOverlay } from "../../models/QrCodeOverlay";
import type { QrCodeValueError } from "../../models/QrCodeValueError";
import { QR_CODE_HOST_CLASSES } from "../../styles/qr-code.styles";
import { encodeQrCode } from "../../utils/qr-code-encoder";
import { describeQrCodeValueError } from "../../utils/validate-qr-code-value";

/** The size an export uses when the code isn't rendered yet and its size isn't a number of pixels. */
const FALLBACK_EXPORT_SIZE = 200;

const DEFAULT_QUIET_ZONE = 4;

/** Version 1 leaves room for 3 modules between its finder patterns, too few for an overlay. */
const MIN_OVERLAY_VERSION = 2;

/**
 * Draws a value as a QR code in SVG, and exports it as a PNG, SVG or PDF file.
 */
@Component({
    selector: "mona-qr-code",
    templateUrl: "./qr-code.component.html",
    exportAs: "monaQrCode",
    host: {
        "[class]": "classes()",
        "[style.width]": "cssSize()",
        "[attr.role]": "scene() ? 'img' : null",
        "[attr.aria-label]": "scene() ? label() : null"
    }
})
export class QrCodeComponent {
    readonly #document = inject(DOCUMENT);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #encoded = computed(() => {
        const text = String(this.value() ?? "");
        if (!text) {
            return null;
        }
        return encodeQrCode(text, {
            encoding: this.encoding(),
            errorCorrection: this.errorCorrection(),
            minVersion: this.overlay() ? MIN_OVERLAY_VERSION : undefined
        });
    });
    readonly #i18n = inject(MonaI18nService);
    readonly #platformId = inject(PLATFORM_ID);
    readonly #quietZone = computed(() => {
        const quietZone = this.quietZone();
        return Number.isFinite(quietZone) ? Math.max(0, Math.round(quietZone)) : DEFAULT_QUIET_ZONE;
    });
    protected readonly classes = computed(() => twMerge(QR_CODE_HOST_CLASSES, this.userClass()));
    protected readonly crossPath = computed(() => {
        const overlay = this.scene()?.overlay;
        return overlay?.kind === "swiss" ? polygonPath(overlay.cross) : "";
    });
    protected readonly cssSize = computed(() => toCssValue(this.size()));
    protected readonly imageOverlay = computed(() => {
        const overlay = this.scene()?.overlay;
        return overlay?.kind === "image" ? overlay : null;
    });
    protected readonly label = computed(() => this.ariaLabel() || this.messages().label);
    protected readonly messages = this.#i18n.componentMessages("qrCode", QR_CODE_DEFAULT_MESSAGES);
    protected readonly scene = computed(() => {
        const matrix = this.#encoded()?.matrix;
        return matrix ? buildQrCodeScene(matrix, this.#quietZone(), this.overlay()) : null;
    });
    protected readonly swissOverlay = computed(() => {
        const overlay = this.scene()?.overlay;
        return overlay?.kind === "swiss" ? overlay : null;
    });
    protected readonly viewBox = computed(() => {
        const size = this.scene()?.size ?? 0;
        return `0 0 ${size} ${size}`;
    });

    /**
     * @description Accessible name of the code. Say what scanning it does, such as "QR code for the event page". When
     * empty, falls back to the localized "QR code". The host has `role="img"` while there's a code to show.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description Color of the light modules and the quiet zone, as any CSS color. `"transparent"` lets the page show
     * through, which only scans on a light page.
     * @default "#ffffff"
     */
    public readonly background = input("#ffffff");

    /**
     * @description Color of the dark modules, as any CSS color. Readers need it much darker than `background`.
     * @default "#000000"
     */
    public readonly color = input("#000000");

    /**
     * @description Character set the text is stored in. `"utf-8"` stores any text; `"iso-8859-1"` stores Latin-1 only,
     * without the ECI header some older readers don't support.
     * @default "utf-8"
     */
    public readonly encoding = input<QrCodeEncoding>("utf-8");

    /**
     * @description Why the value can't be encoded, or `null` when it can or is empty. While it's set, nothing is drawn.
     * Use `validateQrCodeValue` to check a value before it reaches the component, such as in a form.
     */
    public readonly error = computed<QrCodeValueError | null>(() => this.#encoded()?.error ?? null);

    /**
     * @description How much of the code can be damaged or hidden and still read. Use `"H"` with an image overlay.
     * A higher level needs more modules for the same value.
     * @default "M"
     */
    public readonly errorCorrection = input<QrCodeErrorCorrection>("M");

    /**
     * @description An image or the Swiss cross to draw over the center. The modules beneath it are cleared, so raise
     * `errorCorrection` to keep the code readable; a warning is logged in development when it hides too much. With an
     * overlay, the code is version 2 at least, since version 1 has no room for one.
     * @default null
     */
    public readonly overlay = input<QrCodeOverlay | null>(null);

    /**
     * @description Width of the light border around the code, in modules. Readers expect 4; a smaller one only scans
     * when the surroundings are light.
     * @default 4
     */
    public readonly quietZone = input(DEFAULT_QUIET_ZONE);

    /**
     * @description Width and height, quiet zone included. A number is pixels; a string can be any CSS length, such as
     * `"100%"`. The code never grows wider than its container.
     * @default 200
     */
    public readonly size = input<number | string>(200);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Text to encode, such as a URL. A number is encoded as its digits. An empty value draws nothing.
     * @default ""
     */
    public readonly value = input<string | number>("");

    public constructor() {
        if (isDevMode()) {
            effect(() => {
                const error = this.error();
                if (error) {
                    console.warn(`mona-qr-code: ${describeQrCodeValueError(error)}`);
                }
            });
            effect(() => {
                if (this.scene()?.overlayExceedsCorrection) {
                    console.warn(
                        `mona-qr-code: The overlay hides more of the code than error correction level ` +
                            `"${this.errorCorrection()}" can recover, so it may not scan. Raise errorCorrection or make ` +
                            `the overlay smaller.`
                    );
                }
            });
        }
    }

    /**
     * @description Exports the code and saves it as a file. PDF export needs the `jspdf` package, which isn't installed
     * with Mona UI.
     * @param options The format, the size and the file's name.
     */
    public async downloadQrCode(options: QrCodeDownloadOptions): Promise<QrCodeExportResult> {
        const result = await this.exportQrCode(options);
        downloadBlob(this.#document, result.blob, qrCodeFileName(options.fileName, options.format));
        return result;
    }

    /**
     * @description Exports the code as a PNG image, an SVG document or a PDF page, drawn the same way it's shown, with
     * the colors resolved to what they paint. Rejects with a `QrCodeExportError`. PDF export needs the `jspdf` package,
     * which isn't installed with Mona UI.
     * @param options The format and the size.
     */
    public async exportQrCode(options: QrCodeExportOptions): Promise<QrCodeExportResult> {
        if (!isPlatformBrowser(this.#platformId)) {
            throw new QrCodeExportError("unsupported-environment", "QR codes can only be exported in a browser.");
        }
        const scene = this.scene();
        if (!scene) {
            const error = this.error();
            throw new QrCodeExportError(
                "not-ready",
                error ? describeQrCodeValueError(error) : "There's no value to encode."
            );
        }
        const size = options.size ?? this.#renderedSize();
        if (!Number.isFinite(size) || size <= 0) {
            throw new QrCodeExportError("invalid-size", `The export size has to be a positive number; got ${size}.`);
        }
        const host = this.#elementRef.nativeElement;
        return exportQrCodeScene(scene, {
            background: resolveQrCodeColor(host, this.background(), WHITE),
            document: this.#document,
            foreground: resolveQrCodeColor(host, this.color(), BLACK),
            format: options.format,
            label: this.label(),
            size
        });
    }

    #renderedSize(): number {
        const width = this.#elementRef.nativeElement.getBoundingClientRect().width;
        if (width > 0) {
            return width;
        }
        const size = this.size();
        return typeof size === "number" && size > 0 ? size : FALLBACK_EXPORT_SIZE;
    }
}
