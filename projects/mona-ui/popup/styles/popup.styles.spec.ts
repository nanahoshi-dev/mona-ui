import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createPopupStyleStrategy, POPUP_STYLE_STRATEGY, providePopupStyles } from "./popup.styles";

describe("popup style strategy", () => {
    it("uses a distinct enter/leave animation for Reina than Mona", () => {
        const strategy = createPopupStyleStrategy();

        const mona = strategy.resolve("mona");
        const reina = strategy.resolve("reina");

        expect(reina).not.toEqual(mona);
        expect(mona.enter).toBe("mona-popup-enter");
        expect(mona.leave).toBe("mona-popup-leave");
        expect(reina.enter).toBe("reina-popup-enter");
        expect(reina.leave).toBe("reina-popup-leave");
    });

    it("merges provider overrides after the built-in defaults", () => {
        const strategy = createPopupStyleStrategy([
            {
                enter: "provider-popup-enter"
            }
        ]);

        expect(strategy.resolve("mona").enter).toBe("provider-popup-enter");
        expect(strategy.resolve("reina").enter).toBe("provider-popup-enter");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createPopupStyleStrategy([
            {
                theme: "reina",
                enter: "reina-provider-popup-enter"
            }
        ]);

        expect(strategy.resolve("mona").enter).toBe("mona-popup-enter");
        expect(strategy.resolve("reina").enter).toBe("reina-provider-popup-enter");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                providePopupStyles({
                    enter: "injected-popup-enter"
                })
            ]
        });

        const strategy = TestBed.inject(POPUP_STYLE_STRATEGY);

        expect(strategy.resolve("mona").enter).toBe("injected-popup-enter");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                providePopupStyles({
                    strategy: {
                        resolve: () => ({ enter: "replacement-enter", leave: "replacement-leave" })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(POPUP_STYLE_STRATEGY);

        expect(strategy.resolve("mona")).toEqual({ enter: "replacement-enter", leave: "replacement-leave" });
    });
});
