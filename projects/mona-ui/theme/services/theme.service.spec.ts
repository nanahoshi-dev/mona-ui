import { DOCUMENT } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import type { ThemeId } from "../models/Theme";
import type { ThemeColors } from "../models/ThemeDefinition";
import { annaThemeShadows } from "../definitions/anna-theme-shadows";
import { monaThemeShadows } from "../definitions/mona-theme-shadows";
import type { ThemeColorStrategy } from "../strategies/theme-color.strategy";
import { THEME_COLOR_STRATEGY } from "../tokens/theme-color.tokens";
import { ThemeService } from "./theme.service";

describe("ThemeService", () => {
    let root: HTMLElement;
    let service: ThemeService;

    beforeEach(() => {
        root = document.createElement("html");
        const lightColors: ThemeColors = {
            "--color-primary": "light-primary",
            "--color-light-only": "light-only"
        };
        const darkColors: ThemeColors = {
            "--color-primary": "dark-primary",
            "--color-dark-only": "dark-only"
        };
        const strategy: ThemeColorStrategy = {
            resolve: (_theme, variant) => (variant === "light" ? lightColors : darkColors)
        };

        TestBed.configureTestingModule({
            providers: [
                { provide: DOCUMENT, useValue: { documentElement: root } },
                { provide: THEME_COLOR_STRATEGY, useValue: strategy }
            ]
        });
        service = TestBed.inject(ThemeService);
    });

    afterEach(() => TestBed.resetTestingModule());

    it("starts with Mona light and applies its resolved colors", () => {
        expect(service.themeId()).toBe("mona-light");
        expect(service.theme()).toBe("mona");
        expect(service.themeVariant()).toBe("light");
        expect(root.style.getPropertyValue("--color-primary")).toBe("light-primary");
        expect(root.style.getPropertyValue("--color-light-only")).toBe("light-only");
        expect(root.style.getPropertyValue("--shadow-raised")).toBe(monaThemeShadows.light["--shadow-raised"]);
    });

    it("updates all derived theme state atomically", () => {
        service.setThemeId("mona-dark");

        expect({
            id: service.themeId(),
            style: service.theme(),
            variant: service.themeVariant()
        }).toEqual({ id: "mona-dark", style: "mona", variant: "dark" });
        expect(root.style.getPropertyValue("--shadow-overlay")).toBe(monaThemeShadows.dark["--shadow-overlay"]);
    });

    it("supports Anna Light as a distinct style and variant", () => {
        service.setThemeId("anna-light");

        expect({ id: service.themeId(), style: service.theme(), variant: service.themeVariant() }).toEqual({
            id: "anna-light",
            style: "anna",
            variant: "light"
        });
        expect(root.style.getPropertyValue("--shadow-raised")).toBe(annaThemeShadows.light["--shadow-raised"]);
    });

    it("supports Anna Dark as a distinct style and variant", () => {
        service.setThemeId("anna-dark");

        expect({ id: service.themeId(), style: service.theme(), variant: service.themeVariant() }).toEqual({
            id: "anna-dark",
            style: "anna",
            variant: "dark"
        });
        expect(root.style.getPropertyValue("--shadow-raised")).toBe(annaThemeShadows.dark["--shadow-raised"]);
    });

    it("replaces values and removes variables missing from the next result", () => {
        service.setThemeId("mona-dark");

        expect(root.style.getPropertyValue("--color-primary")).toBe("dark-primary");
        expect(root.style.getPropertyValue("--color-light-only")).toBe("");
        expect(root.style.getPropertyValue("--color-dark-only")).toBe("dark-only");
    });

    it("rejects invalid runtime identifiers without changing active state", () => {
        expect(() => service.setThemeId("future-theme" as ThemeId)).toThrowError(
            'Unknown Mona UI theme identifier: "future-theme".'
        );
        expect(service.themeId()).toBe("mona-light");
    });

    it("exposes read-only signals", () => {
        expect("set" in service.themeId).toBe(false);
        expect("set" in service.theme).toBe(false);
        expect("set" in service.themeVariant).toBe(false);
    });

    it("safely skips DOM writes when no document element exists", () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                { provide: DOCUMENT, useValue: { documentElement: null } },
                {
                    provide: THEME_COLOR_STRATEGY,
                    useValue: { resolve: () => ({ "--color-primary": "value" }) } satisfies ThemeColorStrategy
                }
            ]
        });

        expect(() => TestBed.inject(ThemeService)).not.toThrow();
    });
});
