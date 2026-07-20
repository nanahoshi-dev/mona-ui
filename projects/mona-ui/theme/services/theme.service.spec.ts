import { DOCUMENT } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import type { ThemeSelection } from "../models/Theme";
import type { ThemeProfile } from "../models/ThemeDefinition";
import { DefaultThemeStrategy } from "../strategies/default-theme.strategy";
import type { ThemeStrategy } from "../strategies/theme.strategy";
import { THEME_OPTIONS, THEME_STRATEGY } from "../tokens/theme.tokens";
import { ThemeService } from "./theme.service";
import { generateThemeColorPalette } from "../utils/generate-theme-color-palette";

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
        expect(root.getAttribute("data-mona-transparency")).toBe("reduced");
        expect(root.style.getPropertyValue("--mona-effect-control-background-color")).toBe("control-fallback");
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

    it("applies a runtime primary palette and exposes its immutable seed", () => {
        const expected = generateThemeColorPalette({ primary: "#0057b8" }).light;

        service.setPrimaryColor("#0057b8");

        expect(service.colorPaletteSeeds()).toEqual({ primary: "#0057b8" });
        expect(Object.isFrozen(service.colorPaletteSeeds())).toBe(true);
        expect(service.profile().colors["--color-primary"]).toBe(expected["--color-primary"]);
        expect(service.profile().colors["--color-primary-hover"]).toBe(expected["--color-primary-hover"]);
        expect(root.style.getPropertyValue("--color-primary")).toBe(expected["--color-primary"]);
        expect(root.style.getPropertyValue("--color-focus-indicator")).toBe("var(--color-primary)");
        expect(root.style.getPropertyValue("--color-selected")).toBe("var(--color-accent)");
        expect(root.style.getPropertyValue("--color-selected-hover")).toBe("var(--color-accent-hover)");
        expect(root.style.getPropertyValue("--color-selected-active")).toBe("var(--color-accent-active)");
        expect(root.style.getPropertyValue("--color-selected-focus")).toBe("var(--color-accent-hover)");
        expect(root.style.getPropertyValue("--color-selected-border")).toBe("var(--color-primary)");
    });

    it("replaces Luna's built-in selected colors with the runtime primary accent", () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                { provide: DOCUMENT, useValue: { documentElement: root } },
                { provide: THEME_OPTIONS, useValue: { initialTheme: { name: "luna", variant: "light" } } },
                { provide: THEME_STRATEGY, useValue: new DefaultThemeStrategy([], []) }
            ]
        });
        const configured = TestBed.inject(ThemeService);
        const expected = generateThemeColorPalette({ primary: "#e8aaf0" }).light;

        expect(root.style.getPropertyValue("--color-selected")).toBe("#e5ebfb");

        configured.setPrimaryColor("#e8aaf0");

        expect(root.style.getPropertyValue("--color-accent")).toBe(expected["--color-accent"]);
        expect(root.style.getPropertyValue("--color-selected")).toBe("var(--color-accent)");
        expect(root.style.getPropertyValue("--color-selected-foreground")).toBe("var(--color-accent-foreground)");
        expect(root.style.getPropertyValue("--color-selected-hover")).toBe("var(--color-accent-hover)");
        expect(root.style.getPropertyValue("--color-selected-active")).toBe("var(--color-accent-active)");
    });

    it("retains runtime palette seeds and uses the matching generated variant when switching themes", () => {
        const expected = generateThemeColorPalette({ primary: "#0057b8" });
        service.setPrimaryColor("#0057b8");

        service.setTheme({ name: "mona", variant: "dark" });

        expect(service.colorPaletteSeeds()).toEqual({ primary: "#0057b8" });
        expect(service.profile().colors["--color-primary"]).toBe(expected.dark["--color-primary"]);
        expect(root.style.getPropertyValue("--color-primary")).toBe(expected.dark["--color-primary"]);
    });

    it("retains non-primary runtime seeds when updating only the primary color", () => {
        service.setColorPalette({ primary: "#0057b8", success: "#137333" });

        service.setPrimaryColor("#7444c3");

        expect(service.colorPaletteSeeds()).toEqual({ primary: "#7444c3", success: "#137333" });
        const expected = generateThemeColorPalette({ primary: "#7444c3", success: "#137333" }).light;
        expect(root.style.getPropertyValue("--color-primary")).toBe(expected["--color-primary"]);
        expect(root.style.getPropertyValue("--color-success")).toBe(expected["--color-success"]);
    });

    it("clears the runtime palette and restores provider-resolved colors", () => {
        service.setPrimaryColor("#0057b8");
        expect(root.style.getPropertyValue("--color-accent")).not.toBe("");

        service.clearColorPalette();

        expect(service.colorPaletteSeeds()).toBeNull();
        expect(service.profile().colors["--color-primary"]).toBe("mona-light");
        expect(root.style.getPropertyValue("--color-primary")).toBe("mona-light");
        expect(root.style.getPropertyValue("--color-accent")).toBe("");
    });

    it("rejects invalid runtime colors without partially changing state or the DOM", () => {
        service.setPrimaryColor("#0057b8");
        const beforeStyle = root.getAttribute("style");
        const beforeProfile = service.profile();
        const beforeSeeds = service.colorPaletteSeeds();

        expect(() => service.setPrimaryColor("not-a-color")).toThrowError("Invalid primary theme color seed");
        expect(service.profile()).toBe(beforeProfile);
        expect(service.colorPaletteSeeds()).toBe(beforeSeeds);
        expect(root.getAttribute("style")).toBe(beforeStyle);
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
        expect("set" in service.colorPaletteSeeds).toBe(false);
        expect("set" in service.selection).toBe(false);
        expect("set" in service.profile).toBe(false);
        expect("set" in service.themeName).toBe(false);
        expect("set" in service.themeVariant).toBe(false);
    });

    it("uses full transparency when the standard backdrop filter is supported", () => {
        const environment = createTransparencyEnvironment(root, "backdrop-filter", false);
        const configured = configureService(root, environment.document);

        expect(configured.selection()).toEqual({ name: "mona", variant: "light" });
        expect(root.getAttribute("data-mona-transparency")).toBe("full");
        expect(root.style.getPropertyValue("--mona-effect-control-background-color")).toBe("control");
        expect(root.style.getPropertyValue("--mona-effect-control-background-image")).toBe("control-image");
        expect(root.style.getPropertyValue("--mona-effect-control-backdrop-filter")).toBe("blur(1px)");
    });

    it("recognizes WebKit backdrop filter support", () => {
        const environment = createTransparencyEnvironment(root, "-webkit-backdrop-filter", false);
        configureService(root, environment.document);

        expect(root.getAttribute("data-mona-transparency")).toBe("full");
    });

    it("starts in reduced mode when filtering is unsupported or transparency is reduced", () => {
        const unsupported = createTransparencyEnvironment(root, "unsupported", false);
        configureService(root, unsupported.document);

        expect(root.getAttribute("data-mona-transparency")).toBe("reduced");
        expect(root.style.getPropertyValue("--mona-effect-raised-background-color")).toBe("raised-fallback");

        const reduced = createTransparencyEnvironment(root, "backdrop-filter", true);
        configureService(root, reduced.document);

        expect(root.getAttribute("data-mona-transparency")).toBe("reduced");
        expect(root.style.getPropertyValue("--mona-effect-overlay-background-color")).toBe("overlay-fallback");
    });

    it("applies Luna's exact neutral fallbacks without changing its selection", () => {
        TestBed.resetTestingModule();
        const environment = createTransparencyEnvironment(root, "unsupported", false);
        TestBed.configureTestingModule({
            providers: [
                { provide: DOCUMENT, useValue: environment.document },
                { provide: THEME_OPTIONS, useValue: { initialTheme: { name: "luna", variant: "light" } } },
                { provide: THEME_STRATEGY, useValue: new DefaultThemeStrategy([], []) }
            ]
        });

        const configured = TestBed.inject(ThemeService);

        expect(configured.selection()).toEqual({ name: "luna", variant: "light" });
        expect(root.getAttribute("data-mona-transparency")).toBe("reduced");
        expect(root.style.getPropertyValue("--mona-effect-control-background-color")).toBe("#f3f4f5");
        expect(root.style.getPropertyValue("--mona-effect-raised-background-color")).toBe("#fbfbfb");
        expect(root.style.getPropertyValue("--mona-effect-overlay-background-color")).toBe("#f9f9fa");
    });

    it("reacts to reduced-transparency changes without changing theme selection and cleans up", () => {
        const environment = createTransparencyEnvironment(root, "backdrop-filter", false);
        const configured = configureService(root, environment.document);
        const beforeSelection = configured.selection();

        environment.media.setMatches(true);

        expect(configured.selection()).toEqual(beforeSelection);
        expect(root.getAttribute("data-mona-transparency")).toBe("reduced");
        expect(root.style.getPropertyValue("--mona-effect-overlay-background-color")).toBe("overlay-fallback");
        expect(root.style.getPropertyValue("--mona-effect-overlay-background-image")).toBe("none");
        expect(root.style.getPropertyValue("--mona-effect-overlay-backdrop-filter")).toBe("none");

        TestBed.resetTestingModule();
        expect(environment.media.removeCount).toBe(1);
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

function configureService(root: HTMLElement, configuredDocument: Document): ThemeService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
        providers: [
            { provide: DOCUMENT, useValue: configuredDocument },
            { provide: THEME_STRATEGY, useValue: createStrategy() }
        ]
    });
    return TestBed.inject(ThemeService);
}

function createTransparencyEnvironment(
    root: HTMLElement,
    supportedProperty: string,
    reduced: boolean
): {
    readonly document: Document;
    readonly media: TestMediaQueryList;
} {
    const media = new TestMediaQueryList(reduced);
    const view = {
        CSS: { supports: (property: string): boolean => property === supportedProperty },
        matchMedia: (): MediaQueryList => media as unknown as MediaQueryList
    };
    return {
        document: { documentElement: root, defaultView: view } as unknown as Document,
        media
    };
}

class TestMediaQueryList {
    readonly #listeners = new Set<() => void>();
    public matches: boolean;
    public removeCount = 0;

    public constructor(matches: boolean) {
        this.matches = matches;
    }

    public addEventListener(_type: string, listener: () => void): void {
        this.#listeners.add(listener);
    }

    public removeEventListener(_type: string, listener: () => void): void {
        this.removeCount++;
        this.#listeners.delete(listener);
    }

    public setMatches(matches: boolean): void {
        this.matches = matches;
        for (const listener of this.#listeners) {
            listener();
        }
    }
}

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
        effects: {
            "--mona-effect-control-background-color": "control",
            "--mona-effect-control-fallback-background-color": "control-fallback",
            "--mona-effect-control-background-image": "control-image",
            "--mona-effect-control-backdrop-filter": "blur(1px)",
            "--mona-effect-raised-background-color": "raised",
            "--mona-effect-raised-fallback-background-color": "raised-fallback",
            "--mona-effect-raised-background-image": "raised-image",
            "--mona-effect-raised-backdrop-filter": "blur(2px)",
            "--mona-effect-overlay-background-color": "overlay",
            "--mona-effect-overlay-fallback-background-color": "overlay-fallback",
            "--mona-effect-overlay-background-image": "overlay-image",
            "--mona-effect-overlay-backdrop-filter": "blur(3px)"
        },
        shape: { "--radius-sm": "4px", "--radius-md": "6px", "--radius-lg": "8px" },
        components: {
            "--mona-calendar-background": "control",
            "--mona-calendar-shadow": "none",
            "--mona-list-background": "transparent",
            "--mona-list-disabled-background": "transparent",
            "--mona-list-group-background": "transparent",
            "--mona-list-group-border-width": "0px",
            "--mona-list-group-font-weight": "700",
            "--mona-menubar-background": "raised",
            "--mona-menubar-shadow": "none",
            "--mona-pager-background": "raised",
            "--mona-slider-handle-border-color": "transparent",
            "--mona-tab-list-background": "raised",
            "--mona-tab-content-background": "transparent"
        },
        custom: includeLightOnly ? { "--example-light-only": "present" } : undefined
    };
}
