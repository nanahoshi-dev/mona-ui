import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QrCodeExportError } from "../../models/QrCodeExportError";
import type { QrCodeOverlay } from "../../models/QrCodeOverlay";
import { QrCodeComponent } from "./qr-code.component";

const pdfCalls = vi.hoisted(() => ({
    fill: 0,
    images: [] as unknown[][],
    moveTo: 0,
    options: [] as unknown[],
    rects: [] as unknown[][]
}));

vi.mock("jspdf", () => ({
    GState: class {
        public constructor(public readonly parameters: unknown) {}
    },
    jsPDF: class {
        public constructor(options: unknown) {
            pdfCalls.options.push(options);
        }
        public addImage(...args: unknown[]): void {
            pdfCalls.images.push(args);
        }
        public close(): void {}
        public fill(): void {
            pdfCalls.fill++;
        }
        public lineTo(): void {}
        public moveTo(): void {
            pdfCalls.moveTo++;
        }
        public output(): Blob {
            return new Blob(["%PDF-1.7"], { type: "application/pdf" });
        }
        public rect(...args: unknown[]): void {
            pdfCalls.rects.push(args);
        }
        public setFillColor(): void {}
        public setGState(): void {}
    }
}));

@Component({
    imports: [QrCodeComponent],
    template: `<mona-qr-code [value]="value()" aria-label="Event page" class="rounded-md" #qr="monaQrCode" />`
})
class HostComponent {
    public readonly value = signal("https://nanahoshi.dev");
}

describe("QrCodeComponent", () => {
    let fixture: ComponentFixture<QrCodeComponent>;
    let host: HTMLElement;

    const svg = () => host.querySelector("svg");
    const set = (name: string, value: unknown) => {
        fixture.componentRef.setInput(name, value);
        fixture.detectChanges();
    };

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [QrCodeComponent, HostComponent] });
        fixture = TestBed.createComponent(QrCodeComponent);
        host = fixture.nativeElement as HTMLElement;
        fixture.componentRef.setInput("value", "Mona UI");
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe("rendering", () => {
        it("draws the code as one path over its background, quiet zone included", () => {
            // "Mona UI" is a version 1 code: 21 modules and 4 on each side.
            expect(svg()?.getAttribute("viewBox")).toBe("0 0 29 29");
            expect(svg()?.getAttribute("shape-rendering")).toBe("crispEdges");
            const rect = host.querySelector("svg > rect") as SVGRectElement;
            const path = host.querySelector("svg > path") as SVGPathElement;
            expect(rect.getAttribute("width")).toBe("29");
            expect(rect.style.fill).toBe("rgb(255, 255, 255)");
            expect(path.style.fill).toBe("rgb(0, 0, 0)");
            expect(path.getAttribute("d")?.startsWith("M4 4h7v1h-7z")).toBe(true);
        });

        it("applies its colors as any CSS color", () => {
            set("color", "var(--brand)");
            set("background", "transparent");
            expect((host.querySelector("svg > path") as SVGPathElement).style.fill).toBe("var(--brand)");
            expect((host.querySelector("svg > rect") as SVGRectElement).style.fill).toBe("transparent");
        });

        it("sizes the host in pixels or any CSS length, and keeps it square", () => {
            expect(host.style.width).toBe("200px");
            set("size", 120);
            expect(host.style.width).toBe("120px");
            set("size", "100%");
            expect(host.style.width).toBe("100%");
            expect(host.classList).toContain("aspect-square");
            expect(host.classList).toContain("max-w-full");
        });

        it("draws the quiet zone it's given", () => {
            set("quietZone", 0);
            expect(svg()?.getAttribute("viewBox")).toBe("0 0 21 21");
            set("quietZone", 2.4);
            expect(svg()?.getAttribute("viewBox")).toBe("0 0 25 25");
            set("quietZone", Number.NaN);
            expect(svg()?.getAttribute("viewBox")).toBe("0 0 29 29");
        });

        it("grows with the error correction level", () => {
            set("value", "https://nanahoshi.dev/mona-ui");
            const sizeAt = (level: string) => {
                set("errorCorrection", level);
                return Number(svg()?.getAttribute("viewBox")?.split(" ")[2]);
            };
            expect(sizeAt("L")).toBeLessThan(sizeAt("H"));
        });

        it("encodes a number as its digits", () => {
            set("value", 1234567890);
            expect(svg()).not.toBeNull();
            expect(fixture.componentInstance.error()).toBeNull();
        });

        it("keeps its colors in forced colors mode and merges classes", () => {
            expect(host.classList).toContain("forced-color-adjust-none");
            const hostFixture = TestBed.createComponent(HostComponent);
            hostFixture.detectChanges();
            const element = (hostFixture.nativeElement as HTMLElement).querySelector("mona-qr-code") as HTMLElement;
            expect(element.classList).toContain("rounded-md");
            expect(element.classList).toContain("inline-block");
        });
    });

    describe("overlays", () => {
        it("draws an image over the cleared center, on a code with room for it", () => {
            set("errorCorrection", "H");
            set("overlay", { src: "logo.svg", type: "image" } satisfies QrCodeOverlay);
            const image = host.querySelector("svg > image");
            expect(image?.getAttribute("href")).toBe("logo.svg");
            expect(image?.getAttribute("preserveAspectRatio")).toBe("xMidYMid meet");
            // "Mona UI" fits version 1, but an overlay takes version 2 at least: 25 modules.
            expect(svg()?.getAttribute("viewBox")).toBe("0 0 33 33");
            expect(Number(image?.getAttribute("width"))).toBeCloseTo(25 * 0.2);
        });

        it("draws the Swiss cross in the code's colors", () => {
            set("value", "SPC\n0200\n1\nCH4431999123000889012");
            set("color", "#123456");
            set("overlay", { type: "swiss" } satisfies QrCodeOverlay);
            const rects = host.querySelectorAll("svg > rect");
            const paths = host.querySelectorAll("svg > path");
            expect(rects).toHaveLength(3);
            expect(paths).toHaveLength(2);
            expect((rects[2] as SVGRectElement).style.fill).toBe("rgb(18, 52, 86)");
            expect((paths[1] as SVGPathElement).style.fill).toBe("rgb(255, 255, 255)");
        });

        it("warns in development when the overlay hides too much", () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
            set("value", "https://nanahoshi.dev/mona-ui/components/qr-code");
            set("errorCorrection", "L");
            set("overlay", { size: 0.3, src: "logo.svg", type: "image" } satisfies QrCodeOverlay);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining(`error correction level "L"`));
        });
    });

    describe("accessibility", () => {
        it("is an image named by the localized fallback", () => {
            expect(host.getAttribute("role")).toBe("img");
            expect(host.getAttribute("aria-label")).toBe("QR code");
            expect(svg()?.getAttribute("aria-hidden")).toBe("true");
        });

        it("takes its name from aria-label", () => {
            const hostFixture = TestBed.createComponent(HostComponent);
            hostFixture.detectChanges();
            const element = (hostFixture.nativeElement as HTMLElement).querySelector("mona-qr-code");
            expect(element?.getAttribute("aria-label")).toBe("Event page");
        });

        it("leaves an empty value unnamed, with nothing drawn", () => {
            set("value", "");
            expect(svg()).toBeNull();
            expect(host.hasAttribute("role")).toBe(false);
            expect(host.hasAttribute("aria-label")).toBe(false);
            expect(fixture.componentInstance.error()).toBeNull();
        });
    });

    describe("errors", () => {
        it("reports a value too long to encode, draws nothing and warns in development", () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
            set("errorCorrection", "H");
            set("value", "a".repeat(1274));
            expect(fixture.componentInstance.error()).toMatchObject({ code: "too-long" });
            expect(svg()).toBeNull();
            expect(host.hasAttribute("role")).toBe(false);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining("mona-qr-code: The value needs"));
        });

        it("reports a character the encoding can't store", () => {
            vi.spyOn(console, "warn").mockImplementation(() => undefined);
            set("encoding", "iso-8859-1");
            set("value", "5 €");
            expect(fixture.componentInstance.error()).toEqual({
                character: "€",
                code: "unsupported-character",
                index: 2
            });
            set("encoding", "utf-8");
            expect(fixture.componentInstance.error()).toBeNull();
            expect(svg()).not.toBeNull();
        });
    });

    describe("exportQrCode", () => {
        it("exports a standalone SVG with the resolved colors and the accessible name", async () => {
            set("aria-label", "Event page");
            set("color", "rgb(10 20 30)");
            const result = await fixture.componentInstance.exportQrCode({ format: "svg", size: 300 });
            expect(result.format).toBe("svg");
            expect(result.mimeType).toBe("image/svg+xml");
            expect(result.size).toBe(300);
            const text = await result.blob.text();
            expect(text).toContain(`width="300" height="300" viewBox="0 0 29 29"`);
            expect(text).toContain("<title>Event page</title>");
            expect(text).toContain(`fill="#0a141e"`);
        });

        it("uses the size input when the code isn't laid out", async () => {
            set("size", 160);
            const result = await fixture.componentInstance.exportQrCode({ format: "svg" });
            expect(result.size).toBe(160);
        });

        it("embeds the overlay image in an SVG", async () => {
            set("errorCorrection", "H");
            set("overlay", { src: "data:image/png;base64,AAAA", type: "image" } satisfies QrCodeOverlay);
            const text = await (await fixture.componentInstance.exportQrCode({ format: "svg" })).blob.text();
            expect(text).toContain(`href="data:image/png;base64,AAAA"`);
        });

        it("fails with a reason when there's nothing to export or the size is wrong", async () => {
            set("value", "");
            await expect(fixture.componentInstance.exportQrCode({ format: "svg" })).rejects.toMatchObject({
                code: "not-ready"
            });
            set("value", "Mona UI");
            await expect(fixture.componentInstance.exportQrCode({ format: "svg", size: 0 })).rejects.toBeInstanceOf(
                QrCodeExportError
            );
            await expect(fixture.componentInstance.exportQrCode({ format: "png", size: 20 })).rejects.toMatchObject({
                code: "invalid-size"
            });
        });

        it("draws a PNG with whole pixels per module and the rest in the quiet zone", async () => {
            vi.stubGlobal(
                "Path2D",
                class {
                    public constructor(public readonly path: string) {}
                }
            );
            const context = {
                fill: vi.fn(),
                fillRect: vi.fn(),
                fillStyle: "",
                setTransform: vi.fn()
            };
            vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
                context as unknown as CanvasRenderingContext2D
            );
            vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback =>
                callback(new Blob(["png"], { type: "image/png" }))
            );

            const result = await fixture.componentInstance.exportQrCode({ format: "png", size: 100 });

            expect(result.mimeType).toBe("image/png");
            // 29 modules in 100 pixels: 3 pixels each, and the 13 left over split around them.
            expect(context.setTransform).toHaveBeenCalledWith(3, 0, 0, 3, 6, 6);
            expect(context.fillRect).toHaveBeenCalledWith(0, 0, 100, 100);
            expect(context.fill).toHaveBeenCalledTimes(1);
        });

        it("writes a PDF page with every module in one filled path", async () => {
            pdfCalls.fill = 0;
            pdfCalls.moveTo = 0;
            pdfCalls.options.length = 0;
            pdfCalls.rects.length = 0;
            const result = await fixture.componentInstance.exportQrCode({ format: "pdf", size: 200 });
            expect(result.mimeType).toBe("application/pdf");
            expect(pdfCalls.options[0]).toMatchObject({ format: [150, 150], unit: "pt" });
            expect(pdfCalls.rects[0]).toEqual([0, 0, 150, 150, "F"]);
            const path = host.querySelector("svg > path")?.getAttribute("d") ?? "";
            expect(pdfCalls.moveTo).toBe(path.match(/M/g)?.length);
            expect(pdfCalls.fill).toBe(1);
        });
    });

    describe("downloadQrCode", () => {
        it("saves the export under a file name with the format's extension", async () => {
            // jsdom has no object URLs, so the spec lends them and gives back exactly what it found.
            const original = Object.getOwnPropertyDescriptors(URL);
            const createObjectURL = vi.fn(() => "blob:qr");
            const revokeObjectURL = vi.fn();
            Object.assign(URL, { createObjectURL, revokeObjectURL });
            let fileName = "";
            vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
                fileName = this.download;
            });
            vi.useFakeTimers();
            try {
                const result = await fixture.componentInstance.downloadQrCode({ fileName: "ticket", format: "svg" });

                expect(result.format).toBe("svg");
                expect(createObjectURL).toHaveBeenCalledWith(result.blob);
                expect(fileName).toBe("ticket.svg");
                expect(document.querySelector("a[download]")).toBeNull();
                vi.runAllTimers();
                expect(revokeObjectURL).toHaveBeenCalledWith("blob:qr");
            } finally {
                vi.useRealTimers();
                for (const name of ["createObjectURL", "revokeObjectURL"] as const) {
                    if (original[name]) {
                        Object.defineProperty(URL, name, original[name]);
                    } else {
                        Reflect.deleteProperty(URL, name);
                    }
                }
            }
        });
    });
});
