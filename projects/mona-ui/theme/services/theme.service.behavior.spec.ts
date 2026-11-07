import { OverlayContainer } from "@angular/cdk/overlay";
import { createEnvironmentInjector, DOCUMENT, EnvironmentInjector } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { monaTheme } from "../definitions/mona-theme";
import type { ThemePreference } from "../models/Theme";
import type { ThemeOptions } from "../models/ThemeDefinition";
import type { ThemeStorage } from "../models/ThemeStorage";
import {
    provideThemeFamily,
    provideThemeOptions,
    provideThemeRoot,
    provideThemeStorage
} from "../providers/theme.providers";
import { DefaultThemeStrategy } from "../strategies/default-theme.strategy";
import { LocalStorageThemeStorage } from "../strategies/local-storage-theme.strategy";
import type { ThemeStrategy } from "../strategies/theme.strategy";
import { THEME_STRATEGY } from "../tokens/theme.tokens";
import { ThemeService } from "./theme.service";

interface FakeMedia {
    readonly listeners: Set<() => void>;
    matches: boolean;
}

/** A document with its own root, and a color scheme that can be flipped. */
function createDocument(root: HTMLElement, dark: boolean): { document: Document; media: FakeMedia } {
    const media: FakeMedia = { listeners: new Set(), matches: dark };
    const view = {
        matchMedia: (query: string) =>
            query.includes("color-scheme")
                ? {
                      addEventListener: (_: string, listener: () => void) => media.listeners.add(listener),
                      get matches(): boolean {
                          return media.matches;
                      },
                      removeEventListener: (_: string, listener: () => void) => media.listeners.delete(listener)
                  }
                : { addEventListener: () => undefined, matches: false, removeEventListener: () => undefined }
    };
    return { document: { defaultView: view, documentElement: root } as unknown as Document, media };
}

function flip(media: FakeMedia, dark: boolean): void {
    media.matches = dark;
    for (const listener of media.listeners) {
        listener();
    }
}

/** The overlay module loads on demand, so what a service does with it happens after this. */
async function overlayModuleSettled(): Promise<void> {
    await import("@angular/cdk/overlay");
    await new Promise(resolve => setTimeout(resolve));
}

function createStorage(stored: unknown = null): ThemeStorage & { readonly writes: ThemePreference[] } {
    const writes: ThemePreference[] = [];
    return {
        read: () => stored as ThemePreference | null,
        write: (_key, preference) => {
            writes.push(preference);
        },
        writes
    };
}

describe("ThemeService behavior", () => {
    let root: HTMLElement;

    beforeEach(() => {
        root = document.createElement("html");
        const entries = new Map<string, string>();
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => entries.get(key) ?? null,
            removeItem: (key: string) => entries.delete(key),
            setItem: (key: string, value: string) => entries.set(key, value)
        });
    });

    afterEach(() => {
        TestBed.resetTestingModule();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    function configure(
        options: ThemeOptions | null,
        dark = false,
        ...providers: unknown[]
    ): { media: FakeMedia; service: ThemeService } {
        const environment = createDocument(root, dark);
        TestBed.configureTestingModule({
            providers: [
                { provide: DOCUMENT, useValue: environment.document },
                ...(options ? [provideThemeOptions(options)] : []),
                ...(providers as never[])
            ]
        });
        return { media: environment.media, service: TestBed.inject(ThemeService) };
    }

    describe("at startup", () => {
        it("applies the theme without anything injecting the service", () => {
            const environment = createDocument(root, false);
            TestBed.configureTestingModule({
                providers: [
                    { provide: DOCUMENT, useValue: environment.document },
                    provideThemeOptions({ initialTheme: { name: "luna", variant: "dark" } })
                ]
            });
            TestBed.inject(DOCUMENT);

            expect(root.getAttribute("data-mona-theme")).toBe("luna");
        });

        it("applies it for every kind of theme provider", () => {
            const environment = createDocument(root, false);
            TestBed.configureTestingModule({
                providers: [
                    { provide: DOCUMENT, useValue: environment.document },
                    provideThemeFamily({ name: "custom", variants: { dark: monaTheme.variants.dark } })
                ]
            });
            TestBed.inject(DOCUMENT);

            expect(root.getAttribute("data-mona-theme")).toBe("mona");
        });

        it("fails there for a theme that can't be applied", () => {
            const environment = createDocument(root, false);
            TestBed.configureTestingModule({
                providers: [
                    { provide: DOCUMENT, useValue: environment.document },
                    provideThemeOptions({ initialTheme: { name: "nope", variant: "dark" } })
                ]
            });

            expect(() => TestBed.inject(DOCUMENT)).toThrow('Unknown Mona UI theme "nope"');
        });

        it("does nothing to the page without a theme provider", () => {
            const environment = createDocument(root, false);
            TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: environment.document }] });
            TestBed.inject(DOCUMENT);

            expect(root.hasAttribute("data-mona-theme")).toBe(false);
        });
    });

    describe("color-scheme", () => {
        it("follows the variant, so native controls and scrollbars match", () => {
            const { service } = configure({ initialTheme: { name: "mona", variant: "dark" } });
            expect(root.style.getPropertyValue("color-scheme")).toBe("dark");

            service.setTheme({ name: "mona", variant: "light" });

            expect(root.style.getPropertyValue("color-scheme")).toBe("light");
        });
    });

    describe('variant "system"', () => {
        it("takes the operating system's setting and says what it came to", () => {
            const { service } = configure({ initialTheme: { name: "mona", variant: "system" } }, true);

            expect(service.preference().variant).toBe("system");
            expect(service.selection()).toEqual({ name: "mona", variant: "dark" });
            expect(service.themeVariant()).toBe("dark");
            expect(root.getAttribute("data-mona-variant")).toBe("dark");
        });

        it("defaults to light where there's no such setting", () => {
            TestBed.configureTestingModule({
                providers: [
                    { provide: DOCUMENT, useValue: { documentElement: root } },
                    provideThemeOptions({ initialTheme: { name: "mona", variant: "system" } })
                ]
            });

            expect(TestBed.inject(ThemeService).selection().variant).toBe("light");
        });

        it("follows a change, and keeps the preference", () => {
            const { media, service } = configure({ initialTheme: { name: "mona", variant: "system" } });
            expect(service.themeVariant()).toBe("light");

            flip(media, true);

            expect(service.themeVariant()).toBe("dark");
            expect(service.preference().variant).toBe("system");
            expect(root.style.getPropertyValue("color-scheme")).toBe("dark");
        });

        it("ignores a change once a variant has been chosen", () => {
            const { media, service } = configure({ initialTheme: { name: "mona", variant: "system" } });
            service.setTheme({ name: "mona", variant: "light" });
            const selection = service.selection();

            flip(media, true);

            expect(service.themeVariant()).toBe("light");
            expect(service.selection()).toBe(selection);
        });

        it("picks up a change again after going back to it", () => {
            const { media, service } = configure({ initialTheme: { name: "mona", variant: "light" } });
            service.setTheme({ name: "mona", variant: "system" });

            flip(media, true);

            expect(service.themeVariant()).toBe("dark");
        });

        it("takes the variant a theme has when it only has one", () => {
            const { media, service } = configure({ initialTheme: { name: "anna", variant: "system" } });
            expect(service.selection()).toEqual({ name: "anna", variant: "dark" });

            flip(media, true);
            flip(media, false);

            expect(service.selection()).toEqual({ name: "anna", variant: "dark" });
        });

        it("still rejects a theme that doesn't exist", () => {
            const { service } = configure({ initialTheme: { name: "mona", variant: "light" } });

            expect(() => service.setTheme({ name: "nope", variant: "system" })).toThrow('Unknown Mona UI theme "nope"');
            expect(service.preference().name).toBe("mona");
        });

        it("keeps a runtime palette through a change", () => {
            const { media, service } = configure({ initialTheme: { name: "mona", variant: "system" } });
            service.setPrimaryColor("#0057b8");
            const light = root.style.getPropertyValue("--color-primary");

            flip(media, true);

            expect(root.style.getPropertyValue("--color-primary")).not.toBe(light);
            expect(service.colorPaletteSeeds()?.primary).toBe("#0057b8");
        });

        it("stops listening when destroyed", () => {
            const { media } = configure({ initialTheme: { name: "mona", variant: "system" } });
            expect(media.listeners.size).toBe(1);

            TestBed.resetTestingModule();

            expect(media.listeners.size).toBe(0);
        });
    });

    describe("what's available", () => {
        it("lists the themes and their variants", () => {
            const { service } = configure(
                { initialTheme: { name: "mona", variant: "light" } },
                false,
                provideThemeFamily({ name: "custom", variants: { dark: monaTheme.variants.dark } })
            );

            expect(service.availableThemes()).toEqual(
                expect.arrayContaining([
                    { name: "anna", variants: ["dark"] },
                    { name: "custom", variants: ["dark"] },
                    { name: "mona", variants: ["light", "dark"] }
                ])
            );
        });

        it("says whether a theme has a variant", () => {
            const { service } = configure({ initialTheme: { name: "mona", variant: "light" } });

            expect(service.supportsVariant("anna", "dark")).toBe(true);
            expect(service.supportsVariant("anna", "light")).toBe(false);
            expect(service.supportsVariant("nope", "dark")).toBe(false);
        });

        it("is empty for a custom strategy that doesn't report any", () => {
            const strategy: ThemeStrategy = { resolve: () => monaTheme.variants.light };
            const { service } = configure(null, false, { provide: THEME_STRATEGY, useValue: strategy });

            expect(service.availableThemes()).toEqual([]);
            expect(service.supportsVariant("anything", "dark")).toBe(true);
        });

        it("can be asked of a custom strategy that wraps the default one", () => {
            const inner = new DefaultThemeStrategy([], []);
            const strategy: ThemeStrategy = {
                availableThemes: () => inner.availableThemes().filter(theme => theme.name !== "anna"),
                resolve: selection => inner.resolve(selection)
            };
            const { service } = configure(null, false, { provide: THEME_STRATEGY, useValue: strategy });

            expect(service.availableThemes().map(theme => theme.name)).not.toContain("anna");
        });
    });

    describe("remembering the theme", () => {
        const options: ThemeOptions = { initialTheme: { name: "mona", variant: "light" }, persistKey: "app-theme" };

        it("restores what's stored in place of the initial theme", () => {
            const storage = createStorage({ name: "luna", variant: "dark" });
            const { service } = configure(options, false, provideThemeStorage(storage));

            expect(service.selection()).toEqual({ name: "luna", variant: "dark" });
            expect(service.preference()).toEqual({ name: "luna", variant: "dark" });
            expect(root.getAttribute("data-mona-theme")).toBe("luna");
        });

        it("restores a stored system preference", () => {
            const storage = createStorage({ name: "luna", variant: "system" });
            const { service } = configure(options, true, provideThemeStorage(storage));

            expect(service.preference().variant).toBe("system");
            expect(service.selection()).toEqual({ name: "luna", variant: "dark" });
        });

        it("writes nothing until the theme changes", () => {
            const storage = createStorage();
            configure(options, false, provideThemeStorage(storage));

            expect(storage.writes).toEqual([]);
        });

        it("writes what was asked for when it changes", () => {
            const storage = createStorage();
            const read = vi.spyOn(storage, "read");
            const { service } = configure(options, false, provideThemeStorage(storage));

            service.setTheme({ name: "luna", variant: "system" });

            expect(read).toHaveBeenCalledWith("app-theme");
            expect(storage.writes).toEqual([{ name: "luna", variant: "system" }]);
        });

        it("doesn't write when set to what's stored", () => {
            const storage = createStorage({ name: "luna", variant: "dark" });
            const { service } = configure(options, false, provideThemeStorage(storage));

            service.setTheme({ name: "luna", variant: "dark" });
            expect(storage.writes).toEqual([]);

            service.setTheme({ name: "luna", variant: "light" });
            service.setTheme({ name: "luna", variant: "light" });
            expect(storage.writes).toEqual([{ name: "luna", variant: "light" }]);
        });

        it("doesn't write a change that only came from the operating system", () => {
            const storage = createStorage({ name: "luna", variant: "system" });
            const { media } = configure(options, false, provideThemeStorage(storage));

            flip(media, true);

            expect(storage.writes).toEqual([]);
        });

        it("doesn't write a theme it couldn't apply", () => {
            const storage = createStorage();
            const { service } = configure(options, false, provideThemeStorage(storage));

            expect(() => service.setTheme({ name: "nope", variant: "dark" })).toThrow();

            expect(storage.writes).toEqual([]);
        });

        it.each([
            ["a theme that's gone", { name: "gone", variant: "dark" }],
            ["a variant the theme doesn't have", { name: "anna", variant: "light" }],
            ["a system preference for a theme that's gone", { name: "gone", variant: "system" }],
            ["a variant that isn't one", { name: "mona", variant: "dim" }],
            ["no name", { variant: "dark" }],
            ["a name that isn't text", { name: 3, variant: "dark" }],
            ["something else entirely", "dark"],
            ["null as a stored value", null]
        ])("counts %s as nothing stored, and leaves it", (_label, stored) => {
            const storage = createStorage(stored);
            const { service } = configure(options, false, provideThemeStorage(storage));

            expect(service.selection()).toEqual({ name: "mona", variant: "light" });
            expect(storage.writes).toEqual([]);
        });

        it.each([
            ["no name", { variant: "dark" }],
            ["a name that isn't text", { name: 3, variant: "dark" }],
            ["a variant that isn't one", { name: "mona", variant: "dim" }],
            ["something else entirely", "dark"]
        ])("counts %s as nothing stored under a strategy that would accept it", (_label, stored) => {
            const strategy: ThemeStrategy = { resolve: () => monaTheme.variants.light };
            const { service } = configure(options, false, provideThemeStorage(createStorage(stored)), {
                provide: THEME_STRATEGY,
                useValue: strategy
            });

            expect(service.preference()).toEqual({ name: "mona", variant: "light" });
        });

        it("isn't created without a key", () => {
            const factory = vi.fn(() => createStorage());
            configure({ initialTheme: { name: "mona", variant: "light" } }, false, provideThemeStorage(factory));

            expect(factory).not.toHaveBeenCalled();
        });

        it("isn't consulted without a key", () => {
            const storage = createStorage({ name: "luna", variant: "dark" });
            const read = vi.spyOn(storage, "read");
            const write = vi.spyOn(storage, "write");
            const { service } = configure(
                { initialTheme: { name: "mona", variant: "light" } },
                false,
                provideThemeStorage(storage)
            );

            service.setTheme({ name: "luna", variant: "light" });

            expect(read).not.toHaveBeenCalled();
            expect(write).not.toHaveBeenCalled();
        });

        it("survives a storage that throws, and reports it in development", () => {
            const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
            const storage: ThemeStorage = {
                read: () => {
                    throw new Error("nope");
                },
                write: () => {
                    throw new Error("nope");
                }
            };
            const { service } = configure(options, false, provideThemeStorage(storage));
            expect(service.selection().name).toBe("mona");
            expect(error).toHaveBeenCalledTimes(1);

            service.setTheme({ name: "luna", variant: "dark" });

            expect(service.selection().name).toBe("luna");
            expect(error).toHaveBeenCalledTimes(2);
        });

        it("takes a factory for the storage", () => {
            const storage = createStorage({ name: "luna", variant: "dark" });
            const { service } = configure(
                options,
                false,
                provideThemeStorage(() => storage)
            );

            expect(service.selection().name).toBe("luna");
        });

        it("defaults to localStorage", () => {
            const { service } = configure(options);
            expect(localStorage.getItem("app-theme")).toBeNull();

            service.setTheme({ name: "luna", variant: "dark" });

            expect(JSON.parse(localStorage.getItem("app-theme") as string)).toEqual({ name: "luna", variant: "dark" });
        });
    });

    describe("LocalStorageThemeStorage", () => {
        it("reads what it wrote", () => {
            const storage = new LocalStorageThemeStorage("browser");
            storage.write("theme-key", { name: "luna", variant: "system" });

            expect(storage.read("theme-key")).toEqual({ name: "luna", variant: "system" });
        });

        it("reports null for nothing stored and for what isn't JSON", () => {
            const storage = new LocalStorageThemeStorage("browser");
            expect(storage.read("theme-key")).toBeNull();

            localStorage.setItem("theme-key", "{not json");

            expect(storage.read("theme-key")).toBeNull();
        });

        it("does nothing on the server", () => {
            const storage = new LocalStorageThemeStorage("server");
            storage.write("theme-key", { name: "luna", variant: "dark" });

            expect(localStorage.getItem("theme-key")).toBeNull();
            localStorage.setItem("theme-key", JSON.stringify({ name: "luna", variant: "dark" }));
            expect(storage.read("theme-key")).toBeNull();
        });

        it("doesn't throw when the browser refuses", () => {
            const storage = new LocalStorageThemeStorage("browser");
            vi.stubGlobal("localStorage", {
                getItem: () => {
                    throw new Error("private mode");
                },
                setItem: () => {
                    throw new Error("quota");
                }
            });

            expect(() => storage.write("theme-key", { name: "luna", variant: "dark" })).not.toThrow();
            expect(storage.read("theme-key")).toBeNull();
        });
    });

    describe("cleaning up", () => {
        it("removes what it wrote when destroyed", () => {
            configure({ initialTheme: { name: "luna", variant: "dark" } });
            expect(root.style.getPropertyValue("--color-primary")).not.toBe("");

            TestBed.resetTestingModule();

            expect(root.style.getPropertyValue("--color-primary")).toBe("");
            expect(root.style.getPropertyValue("--mona-motion-fast")).toBe("");
            expect(root.style.getPropertyValue("color-scheme")).toBe("");
            expect(root.hasAttribute("data-mona-theme")).toBe(false);
            expect(root.hasAttribute("data-mona-variant")).toBe(false);
            expect(root.hasAttribute("data-mona-transparency")).toBe(false);
        });

        it("leaves what isn't its own", () => {
            root.style.setProperty("--app-color", "red");
            root.setAttribute("data-app", "yes");
            configure({ initialTheme: { name: "luna", variant: "dark" } });

            TestBed.resetTestingModule();

            expect(root.style.getPropertyValue("--app-color")).toBe("red");
            expect(root.getAttribute("data-app")).toBe("yes");
        });
    });

    describe("two services on one root", () => {
        it("warns in development, and neither clears the other", () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
            configure({ initialTheme: { name: "mona", variant: "light" } });
            expect(warn).not.toHaveBeenCalled();

            const second = createEnvironmentInjector(
                [{ provide: ThemeService, useClass: ThemeService }],
                TestBed.inject(EnvironmentInjector)
            );
            second.get(ThemeService);

            expect(warn).toHaveBeenCalledTimes(1);
            expect(warn.mock.calls[0][0]).toContain("provideThemeRoot");

            // The later one owns the root now, so destroying the earlier one leaves its theme alone.
            TestBed.resetTestingModule();
            expect(root.hasAttribute("data-mona-theme")).toBe(true);
            second.destroy();
            expect(root.hasAttribute("data-mona-theme")).toBe(false);
        });
    });

    describe("a root inside the page", () => {
        let element: HTMLElement;

        beforeEach(() => {
            element = document.createElement("div");
            document.body.appendChild(element);
        });

        afterEach(() => element.remove());

        function configureScoped(root: HTMLElement | (() => HTMLElement | null)): ThemeService {
            TestBed.configureTestingModule({
                providers: [
                    provideThemeOptions({ initialTheme: { name: "luna", variant: "dark" } }),
                    provideThemeRoot(root)
                ]
            });
            return TestBed.inject(ThemeService);
        }

        it("writes there and leaves <html> alone", () => {
            configureScoped(element);

            expect(element.getAttribute("data-mona-theme")).toBe("luna");
            expect(element.style.getPropertyValue("color-scheme")).toBe("dark");
            expect(document.documentElement.hasAttribute("data-mona-theme")).toBe(false);
        });

        it("takes a factory", () => {
            configureScoped(() => element);

            expect(element.getAttribute("data-mona-theme")).toBe("luna");
        });

        it("writes nowhere for a factory that finds nothing", () => {
            const service = configureScoped(() => null);

            expect(service.selection().name).toBe("luna");
            expect(document.documentElement.hasAttribute("data-mona-theme")).toBe(false);
        });

        it("reaches the overlay container, which renders outside it, and follows a switch", async () => {
            const service = configureScoped(element);
            const container = TestBed.inject(OverlayContainer).getContainerElement();

            await vi.waitFor(() => expect(container.getAttribute("data-mona-theme")).toBe("luna"));
            expect(container.style.getPropertyValue("--color-surface")).not.toBe("");

            service.setTheme({ name: "mona", variant: "light" });

            expect(container.getAttribute("data-mona-theme")).toBe("mona");
            expect(container.style.getPropertyValue("color-scheme")).toBe("light");
        });

        it("clears the overlay container too", async () => {
            configureScoped(element);
            const container = TestBed.inject(OverlayContainer).getContainerElement();
            await vi.waitFor(() => expect(container.hasAttribute("data-mona-theme")).toBe(true));

            TestBed.resetTestingModule();

            expect(container.hasAttribute("data-mona-theme")).toBe(false);
            expect(container.style.getPropertyValue("--color-surface")).toBe("");
            expect(element.hasAttribute("data-mona-theme")).toBe(false);
        });

        it("doesn't take on an overlay container at <html>", async () => {
            TestBed.configureTestingModule({
                providers: [provideThemeOptions({ initialTheme: { name: "luna", variant: "dark" } })]
            });
            TestBed.inject(ThemeService);
            await overlayModuleSettled();
            const container = TestBed.inject(OverlayContainer).getContainerElement();

            expect(document.documentElement.getAttribute("data-mona-theme")).toBe("luna");
            expect(container.hasAttribute("data-mona-theme")).toBe(false);
        });

        it("doesn't ask for the overlay container once destroyed before it arrives", async () => {
            configureScoped(element);
            const get = vi.spyOn(TestBed.inject(EnvironmentInjector), "get");

            TestBed.resetTestingModule();
            await overlayModuleSettled();

            expect(get).not.toHaveBeenCalledWith(OverlayContainer);
        });
    });
});
