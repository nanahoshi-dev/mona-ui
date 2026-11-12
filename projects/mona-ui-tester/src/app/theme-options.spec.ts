import { TestBed } from "@angular/core/testing";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { vi } from "vitest";
import { appConfig } from "./app.config";
import { THEME_OPTIONS } from "./theme-options";

/** The pickers offer these, so the app has to register every one, or choosing it throws. */
describe("THEME_OPTIONS", () => {
    beforeEach(() => {
        TestBed.configureTestingModule({ providers: appConfig.providers });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("only lists themes the app provides", () => {
        const available = TestBed.inject(ThemeService)
            .availableThemes()
            .flatMap(theme => theme.variants.map(variant => `${theme.name}-${variant}`));
        const offered = THEME_OPTIONS.map(option => `${option.name}-${option.variant}`);

        expect(offered.filter(option => !available.includes(option))).toEqual([]);
    });

    it.each(THEME_OPTIONS)("switches to $text", option => {
        const themeService = TestBed.inject(ThemeService);

        themeService.setTheme(option);

        expect(themeService.selection()).toEqual({ name: option.name, variant: option.variant });
    });

    it("has nothing for the development check to report about the app's themes", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

        TestBed.inject(ThemeService);

        expect(warn.mock.calls.filter(([message]) => String(message).startsWith("Mona UI:"))).toEqual([]);
    });
});
