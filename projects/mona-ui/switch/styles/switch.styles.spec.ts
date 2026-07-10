import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createSwitchStyleStrategy, provideSwitchStyles, SWITCH_STYLE_STRATEGY } from "./switch.styles";

describe("switch style strategy", () => {
    it("uses the shared recipe for Reina when only tokens differ", () => {
        const strategy = createSwitchStyleStrategy();

        const monaTrack = strategy.resolve("mona").track({ size: "large" });
        const reinaTrack = strategy.resolve("reina").track({ size: "large" });

        expect(reinaTrack).toBe(monaTrack);
    });

    it("merges provider track and handle overrides after the built-in recipe", () => {
        const strategy = createSwitchStyleStrategy([
            {
                track: { base: "provider-switch-track" },
                handle: { base: "provider-switch-handle" }
            }
        ]);

        expect(strategy.resolve("mona").track({})).toContain("provider-switch-track");
        expect(strategy.resolve("mona").handle({})).toContain("provider-switch-handle");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createSwitchStyleStrategy([
            {
                theme: "reina",
                label: { base: "reina-provider-switch-label" }
            }
        ]);

        expect(strategy.resolve("mona").label()).not.toContain("reina-provider-switch-label");
        expect(strategy.resolve("reina").label()).toContain("reina-provider-switch-label");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideSwitchStyles({
                    track: { base: "injected-switch-track" }
                })
            ]
        });

        const strategy = TestBed.inject(SWITCH_STYLE_STRATEGY);

        expect(strategy.resolve("mona").track({})).toContain("injected-switch-track");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideSwitchStyles({
                    strategy: {
                        resolve: () => ({
                            track: () => "replacement-switch-track",
                            handle: () => "replacement-switch-handle",
                            label: () => "replacement-switch-label"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(SWITCH_STYLE_STRATEGY);

        expect(strategy.resolve("mona").track({})).toBe("replacement-switch-track");
    });
});
