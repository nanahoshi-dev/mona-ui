import { TestBed } from "@angular/core/testing";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import axe from "axe-core";
import { ThemeColorsDocComponent } from "./theme-colors-doc.component";

describe("ThemeColorsDocComponent", () => {
    afterEach(() => TestBed.resetTestingModule());

    it("renders the palette review surface and contrast labels", () => {
        const fixture = TestBed.createComponent(ThemeColorsDocComponent);
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        expect(element.querySelector("h1")?.textContent).toContain("Theme Colors");
        expect(element.querySelectorAll(".role-card").length).toBe(6);
        expect(element.textContent).toMatch(/Text \d+\.\d{2}:1/);
        expect(element.querySelector<HTMLInputElement>("#theme-filter")?.tabIndex).toBe(0);
        expect(element.querySelectorAll<HTMLButtonElement>(".overlay-preview button")[0]?.tabIndex).toBe(0);
    });

    it("updates its visible state and ratios when the theme changes", () => {
        const fixture = TestBed.createComponent(ThemeColorsDocComponent);
        const themeService = TestBed.inject(ThemeService);
        fixture.detectChanges();

        themeService.setThemeId("mona-dark");
        fixture.detectChanges();

        expect((fixture.nativeElement as HTMLElement).textContent).toContain("mona-dark");
        expect((fixture.nativeElement as HTMLElement).textContent).toMatch(/Focus \/ input\d+\.\d{2}:1/);
    });

    it("has no AXE accessibility violations", async () => {
        const fixture = TestBed.createComponent(ThemeColorsDocComponent);
        fixture.detectChanges();

        // jsdom has no canvas implementation; theme specs verify all contrast pairs numerically.
        const results = await axe.run(fixture.nativeElement as HTMLElement, {
            rules: { "color-contrast": { enabled: false } }
        });
        expect(results.violations).toEqual([]);
    });
});
