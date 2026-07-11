import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createSplitterStyleStrategy, provideSplitterStyles, SPLITTER_STYLE_STRATEGY } from "./splitter.styles";

describe("splitter style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createSplitterStyleStrategy();

        const mona = strategy.resolve("mona").resizer({ orientation: "horizontal" });
        const reina = strategy.resolve("reina").resizer({ orientation: "horizontal" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("active:bg-primary/35");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createSplitterStyleStrategy([
            {
                resizer: { base: "provider-splitter-resizer" }
            }
        ]);

        const resizerClasses = strategy.resolve("mona").resizer();
        const baseClasses = strategy.resolve("mona").base();

        expect(resizerClasses).toContain("provider-splitter-resizer");
        expect(baseClasses).not.toContain("provider-splitter-resizer");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createSplitterStyleStrategy([
            {
                theme: "reina",
                resizerHandle: { base: "reina-provider-splitter-handle" }
            }
        ]);

        expect(strategy.resolve("mona").resizerHandle()).not.toContain("reina-provider-splitter-handle");
        expect(strategy.resolve("reina").resizerHandle()).toContain("reina-provider-splitter-handle");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideSplitterStyles({
                    base: { base: "injected-splitter-base" }
                })
            ]
        });

        const strategy = TestBed.inject(SPLITTER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toContain("injected-splitter-base");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideSplitterStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            resizer: () => "replacement-resizer",
                            resizerHandle: () => "replacement-resizer-handle"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(SPLITTER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
