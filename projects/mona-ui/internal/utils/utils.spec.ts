import { firstValueFrom } from "rxjs";
import { rgba2hex } from "./color/rgba2hex";
import { createElementControlId } from "./core/createElementControlId";
import { rxFromResize } from "./core/rxFromResize";
import { toCssValue } from "./toCssValue";
import { isTypeaheadKey } from "./typeahead.util";

describe("internal utils", () => {
    describe("rxFromResize", () => {
        it("should accept non-array iterables of elements", async () => {
            const observed: Element[] = [];
            const original = globalThis.ResizeObserver;
            globalThis.ResizeObserver = class {
                public constructor(private readonly callback: ResizeObserverCallback) {}
                public disconnect(): void {}
                public observe(target: Element): void {
                    observed.push(target);
                    this.callback([], this as unknown as ResizeObserver);
                }
                public unobserve(): void {}
            } as unknown as typeof ResizeObserver;
            try {
                const elements = new Set([document.createElement("div"), document.createElement("span")]);
                await firstValueFrom(rxFromResize(elements));
                expect(observed.length).toBeGreaterThanOrEqual(1);
            } finally {
                globalThis.ResizeObserver = original;
            }
        });

        it("should error for non-element targets", async () => {
            await expect(firstValueFrom(rxFromResize([{} as Element]))).rejects.toThrow(TypeError);
        });
    });

    describe("rgba2hex", () => {
        it("should round fractional channels and pad bytes", () => {
            expect(rgba2hex(127.5, 0, 15.2, 255)).toBe("#80000f");
        });

        it("should clamp channels into the byte range", () => {
            expect(rgba2hex(300, -4, 255, 255)).toBe("#ff00ff");
        });

        it("should append the alpha byte only when it is not opaque", () => {
            expect(rgba2hex(255, 0, 0, 128)).toBe("#ff000080");
        });

        it("should return an empty string for missing channels", () => {
            expect(rgba2hex(null, 0, 0, 255)).toBe("");
        });
    });

    describe("toCssValue", () => {
        it("should append px to numbers and numeric strings", () => {
            expect(toCssValue(12)).toBe("12px");
            expect(toCssValue("12")).toBe("12px");
            expect(toCssValue(0)).toBe("0");
        });

        it("should keep values that already have a unit", () => {
            expect(toCssValue("2rem")).toBe("2rem");
        });

        it("should return an empty string for blank values", () => {
            expect(toCssValue(" ")).toBe("");
            expect(toCssValue(null)).toBe("");
        });
    });

    describe("createElementControlId", () => {
        it("should produce ids that are valid unescaped CSS selectors", () => {
            const id = createElementControlId();
            expect(id).toMatch(/^mona-[0-9a-f]+$/);
            expect(() => document.querySelector(`#${id}`)).not.toThrow();
        });

        it("should grow the random part with the nesting level", () => {
            expect(createElementControlId(2, 7).length).toBe("mona-".length + 9);
        });
    });

    describe("isTypeaheadKey", () => {
        it("should accept letters and digits from any script", () => {
            for (const key of ["a", "Z", "7", "é", "ü", "ж", "ğ", "あ", "ا"]) {
                expect(isTypeaheadKey(key), key).toBe(true);
            }
        });

        it("should reject named keys", () => {
            for (const key of ["Enter", "ArrowDown", "Tab", "Escape", "F5"]) {
                expect(isTypeaheadKey(key)).toBe(false);
            }
        });

        it("should ignore keys pressed with Ctrl, Meta or Alt", () => {
            expect(isTypeaheadKey("a", { ctrlKey: true })).toBe(false);
            expect(isTypeaheadKey("c", { metaKey: true })).toBe(false);
            expect(isTypeaheadKey("x", { altKey: true })).toBe(false);
            expect(isTypeaheadKey("A", { ctrlKey: false })).toBe(true);
        });
    });
});
