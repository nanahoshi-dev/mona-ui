import { provideHttpClient, withXhr } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { builtInThemes, ThemeService } from "@nanahoshi/mona-ui/theme";
import axe from "axe-core";
import { provideMarkdown } from "ngx-markdown";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PageService } from "../../layout/services/page.service";
import { ThemingBuiltInThemesDocComponent } from "./theming-built-in-themes-doc.component";

describe("ThemingBuiltInThemesDocComponent", () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [PageService, provideHttpClient(withXhr()), provideMarkdown(), provideRouter([])]
        });
    });

    afterEach(() => TestBed.resetTestingModule());

    function renderPreviews(): HTMLElement[] {
        const fixture = TestBed.createComponent(ThemingBuiltInThemesDocComponent);
        fixture.detectChanges();
        return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>("[role='group']"));
    }

    it("previews every variant of every built-in theme", () => {
        expect(renderPreviews().map(preview => preview.getAttribute("aria-label"))).toEqual([
            "Mona Light preview",
            "Mona Dark preview",
            "Luna Light preview",
            "Luna Dark preview",
            "Anna Light preview",
            "Anna Dark preview",
            "Rena Light preview",
            "Rena Dark preview"
        ]);
    });

    it("gives each preview its own theme's tokens, whatever the site's theme is", () => {
        TestBed.inject(ThemeService).setTheme({ name: "mona", variant: "light" });
        const [, monaDark, , lunaDark, annaLight, annaDark, , renaDark] = renderPreviews();

        expect(monaDark.style.getPropertyValue("--color-primary").trim()).toBe(
            builtInThemes.mona.variants.dark.colors["--color-primary"]
        );
        expect(lunaDark.style.getPropertyValue("--color-canvas").trim()).toBe(
            builtInThemes.luna.variants.dark.colors["--color-canvas"]
        );
        expect(lunaDark.style.getPropertyValue("--mona-indicator-color").trim()).toBe("var(--color-primary)");
        expect(annaLight.style.getPropertyValue("--color-surface").trim()).toBe(
            builtInThemes.anna.variants.light.colors["--color-surface"]
        );
        expect(annaDark.style.getPropertyValue("--mona-indicator-color").trim()).toBe(
            builtInThemes.anna.variants.dark.custom["--mona-indicator-color"]
        );
        expect(annaDark.style.getPropertyValue("--mona-focus-ring-width").trim()).toBe("2px");
        expect(renaDark.style.getPropertyValue("--color-canvas").trim()).toBe(
            builtInThemes.rena.variants.dark.colors["--color-canvas"]
        );
        expect(renaDark.style.getPropertyValue("--mona-focus-ring-width").trim()).toBe(
            builtInThemes.rena.variants.dark.custom["--mona-focus-ring-width"]
        );
    });

    it("has no AXE accessibility violations", async () => {
        const fixture = TestBed.createComponent(ThemingBuiltInThemesDocComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        // jsdom has no canvas implementation; theme specs verify all contrast pairs numerically.
        const results = await axe.run(fixture.nativeElement as HTMLElement, {
            rules: { "color-contrast": { enabled: false } }
        });
        expect(results.violations).toEqual([]);
    });
});
