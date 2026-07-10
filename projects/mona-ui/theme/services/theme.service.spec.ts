import { TestBed } from "@angular/core/testing";
import { provideMonaUiTheme } from "../providers/theme.providers";

import { ThemeService } from "./theme.service";

describe("ThemeService", () => {
    let service: ThemeService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ThemeService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should initialize Mona light runtime variables", () => {
        expect(document.documentElement.style.getPropertyValue("--mona-color-background")).toBe("oklch(1 0 0)");
        expect(service.themeId()).toBe("mona-light");
    });

    it("should switch themes and replace the previous runtime variables", () => {
        service.setThemeId("reina-dark");

        expect(service.theme()).toBe("reina");
        expect(service.themeVariant()).toBe("dark");
        expect(document.documentElement.style.getPropertyValue("--mona-page-background")).toBe("oklch(0.06 0 0)");

        service.setThemeId("mona-light");

        expect(document.documentElement.style.getPropertyValue("--mona-page-background")).toBe("#fff");
    });

    it("should apply configured default themes and variable overrides", () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                provideMonaUiTheme({
                    defaultThemeId: "reina-light",
                    variableOverrides: {
                        "reina-light": {
                            "--color-primary": "oklch(0.5 0.2 120)"
                        }
                    }
                })
            ]
        });

        const configuredService = TestBed.inject(ThemeService);

        expect(configuredService.themeId()).toBe("reina-light");
        expect(document.documentElement.style.getPropertyValue("--mona-color-primary")).toBe("oklch(0.5 0.2 120)");
    });
});
