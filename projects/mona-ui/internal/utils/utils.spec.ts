import { firstValueFrom, Subject } from "rxjs";
import { rgba2hex } from "./color/rgba2hex";
import { createElementControlId } from "./core/createElementControlId";
import { rxFromResize } from "./core/rxFromResize";
import { toCssValue } from "./toCssValue";
import { findTypeaheadMatch, isTypeaheadKey, setupTypeahead, TYPEAHEAD_RESET_DELAY } from "./typeahead.util";

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

        it("should accept every other character a key types, so file names can be typed out", () => {
            for (const key of [" ", ".", "(", ")", "~", "$", "#", "+", "*", "'", "€", "😀", "لا"]) {
                expect(isTypeaheadKey(key), key).toBe(true);
            }
        });

        it("should reject named keys", () => {
            for (const key of ["Enter", "ArrowDown", "Tab", "Escape", "F5", "Dead", "Process", "Unidentified"]) {
                expect(isTypeaheadKey(key), key).toBe(false);
            }
        });

        it("should reject control and format characters", () => {
            for (const key of ["\t", "\n", "\u0000", "‍"]) {
                expect(isTypeaheadKey(key), JSON.stringify(key)).toBe(false);
            }
        });

        it("should ignore keys pressed with Ctrl, Meta or Alt", () => {
            expect(isTypeaheadKey("a", { ctrlKey: true })).toBe(false);
            expect(isTypeaheadKey("c", { metaKey: true })).toBe(false);
            expect(isTypeaheadKey("x", { altKey: true })).toBe(false);
            expect(isTypeaheadKey(".", { ctrlKey: true })).toBe(false);
            expect(isTypeaheadKey("A", { ctrlKey: false })).toBe(true);
        });
    });

    describe("setupTypeahead", () => {
        afterEach(() => vi.useRealTimers());

        it("should keep the buffer until no key comes for about a second", () => {
            vi.useFakeTimers();
            const keys$ = new Subject<string>();
            const buffers: string[] = [];
            const subscription = setupTypeahead(keys$).subscribe(buffer => buffers.push(buffer));
            keys$.next("R");
            vi.advanceTimersByTime(TYPEAHEAD_RESET_DELAY - 100);
            keys$.next("e");
            vi.advanceTimersByTime(TYPEAHEAD_RESET_DELAY);
            keys$.next("p");
            subscription.unsubscribe();
            expect(TYPEAHEAD_RESET_DELAY).toBeGreaterThanOrEqual(900);
            expect(buffers).toEqual(["r", "re", "p"]);
        });

        it("should start the buffer again at once for an empty string", () => {
            const keys$ = new Subject<string>();
            const buffers: string[] = [];
            const subscription = setupTypeahead(keys$).subscribe(buffer => buffers.push(buffer));
            keys$.next("a");
            keys$.next("");
            keys$.next("b");
            subscription.unsubscribe();
            expect(buffers).toEqual(["a", "b"]);
        });
    });

    describe("findTypeaheadMatch", () => {
        const names = ["aardvark", "Apple", "avocado", "Banana", "berry", "zz_old"];
        const find = (buffer: string, activeIndex: number, items: readonly (string | null)[] = names): number =>
            findTypeaheadMatch(buffer, items.length, activeIndex, index => items[index]);

        it("should move on from the active item for one character, ignoring case and wrapping around", () => {
            expect(find("b", -1)).toBe(3);
            expect(find("b", 3)).toBe(4);
            expect(find("b", 4)).toBe(3);
            expect(find("a", 1)).toBe(2);
            expect(find("a", 5)).toBe(0);
        });

        it("should keep the active item while more characters still match it", () => {
            expect(find("ba", 3)).toBe(3);
            expect(find("be", 3)).toBe(4);
            expect(find("av", 0)).toBe(2);
        });

        it("should step through the items that start with a letter typed again", () => {
            expect(find("aa", 0)).toBe(1);
            expect(find("aaa", 1)).toBe(2);
            expect(find("aaaa", 2)).toBe(0);
            expect(find("bb", 3)).toBe(4);
        });

        it("should prefer another item that starts with the repeated letters", () => {
            expect(find("zz", 5, ["zebra", "zoo", "zz_old"])).toBe(2);
            expect(find("zz", 0, ["zebra", "zoo", "zz_old"])).toBe(2);
            expect(find("zz", 2, ["zebra", "zoo", "zz_old"])).toBe(0);
        });

        it("should stay on the only item that starts with a repeated letter", () => {
            expect(find("zz", 5)).toBe(5);
        });

        it("should skip items without text and find nothing when nothing matches", () => {
            expect(find("b", -1, [null, "Banana", null, "berry"])).toBe(1);
            expect(find("q", 0)).toBe(-1);
            expect(find("qq", 0)).toBe(-1);
            expect(find("", 0)).toBe(-1);
            expect(findTypeaheadMatch("a", 0, -1, () => "a")).toBe(-1);
        });

        it("should match names with punctuation and spaces", () => {
            const files = ["(old)", ".config", "~$draft.docx", "New folder", "report.pdf"];
            expect(find(".", -1, files)).toBe(1);
            expect(find("~$", -1, files)).toBe(2);
            expect(find("new f", 3, files)).toBe(3);
            expect(find("report.p", 0, files)).toBe(4);
        });
    });
});
