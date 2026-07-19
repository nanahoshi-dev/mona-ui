import { DOCUMENT } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import type { ThemeSelection } from "../models/Theme";
import type { ThemeProfile } from "../models/ThemeDefinition";
import type { ThemeStrategy } from "../strategies/theme.strategy";
import { THEME_OPTIONS, THEME_STRATEGY } from "../tokens/theme.tokens";
import { ThemeService } from "./theme.service";

describe("ThemeService", () => {
    let root: HTMLElement;
    let service: ThemeService;

    beforeEach(() => {
        root = document.createElement("html");
        TestBed.configureTestingModule({
            providers: [
                { provide: DOCUMENT, useValue: { documentElement: root } },
                { provide: THEME_STRATEGY, useValue: createStrategy() }
            ]
        });
        service = TestBed.inject(ThemeService);
    });

    afterEach(() => TestBed.resetTestingModule());

    it("defaults to Mona Light and applies its complete profile", () => {
        expect(service.selection()).toEqual({ name: "mona", variant: "light" });
        expect(service.themeName()).toBe("mona");
        expect(service.themeVariant()).toBe("light");
        expect(root.style.getPropertyValue("--color-primary")).toBe("mona-light");
        expect(root.style.getPropertyValue("--mona-motion-fast")).toBe("200ms");
        expect(root.getAttribute("data-mona-theme")).toBe("mona");
        expect(root.getAttribute("data-mona-variant")).toBe("light");
    });

    it("uses a configured initial selection", () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                { provide: DOCUMENT, useValue: { documentElement: root } },
                { provide: THEME_OPTIONS, useValue: { initialTheme: { name: "anna", variant: "dark" } } },
                { provide: THEME_STRATEGY, useValue: createStrategy() }
            ]
        });

        const configured = TestBed.inject(ThemeService);

        expect(configured.selection()).toEqual({ name: "anna", variant: "dark" });
        expect(root.style.getPropertyValue("--color-primary")).toBe("anna-dark");
    });

    it("switches signals, variables, and root attributes together", () => {
        service.setTheme({ name: "mona", variant: "dark" });

        expect(service.selection()).toEqual({ name: "mona", variant: "dark" });
        expect(service.profile().colors["--color-primary"]).toBe("mona-dark");
        expect(root.style.getPropertyValue("--color-primary")).toBe("mona-dark");
        expect(root.getAttribute("data-mona-theme")).toBe("mona");
        expect(root.getAttribute("data-mona-variant")).toBe("dark");
    });

    it("removes variables absent from the next profile", () => {
        expect(root.style.getPropertyValue("--example-light-only")).toBe("present");

        service.setTheme({ name: "mona", variant: "dark" });

        expect(root.style.getPropertyValue("--example-light-only")).toBe("");
    });

    it("leaves state and the DOM unchanged when resolution fails", () => {
        const beforeStyle = root.getAttribute("style");
        const beforeSelection = service.selection();

        expect(() => service.setTheme({ name: "unknown", variant: "light" })).toThrowError("Unknown selection");
        expect(service.selection()).toEqual(beforeSelection);
        expect(root.getAttribute("style")).toBe(beforeStyle);
        expect(root.getAttribute("data-mona-theme")).toBe("mona");
    });

    it("exposes read-only signals", () => {
        expect("set" in service.selection).toBe(false);
        expect("set" in service.profile).toBe(false);
        expect("set" in service.themeName).toBe(false);
        expect("set" in service.themeVariant).toBe(false);
    });

    it("safely skips DOM writes when no document element exists", () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                { provide: DOCUMENT, useValue: { documentElement: null } },
                { provide: THEME_STRATEGY, useValue: createStrategy() }
            ]
        });

        expect(() => TestBed.inject(ThemeService)).not.toThrow();
    });
});

function createStrategy(): ThemeStrategy {
    return {
        resolve(selection: ThemeSelection): ThemeProfile {
            const key = `${selection.name}-${selection.variant}`;
            if (!new Set(["mona-light", "mona-dark", "anna-dark"]).has(key)) {
                throw new Error("Unknown selection");
            }
            return createProfile(key, key === "mona-light");
        }
    };
}

function createProfile(primary: string, includeLightOnly = false): ThemeProfile {
    return {
        colors: { "--color-primary": primary },
        shadows: { "--shadow-control": "none" },
        motion: { "--mona-motion-fast": "200ms", "--mona-motion-standard": "300ms" },
        components: {
            "--mona-calendar-shadow": "none",
            "--mona-list-background": "transparent",
            "--mona-list-disabled-background": "transparent",
            "--mona-list-group-background": "transparent",
            "--mona-list-group-border-width": "0px",
            "--mona-list-group-font-weight": "700",
            "--mona-menubar-shadow": "none",
            "--mona-slider-handle-border-color": "transparent",
            "--mona-tab-content-background": "transparent"
        },
        custom: includeLightOnly ? { "--example-light-only": "present" } : undefined
    };
}
