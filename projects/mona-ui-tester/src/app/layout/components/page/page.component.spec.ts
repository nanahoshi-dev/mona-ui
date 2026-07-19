import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import axe from "axe-core";
import { THEME_OPTIONS } from "../../../theme-options";

import { PageComponent } from "./page.component";

describe("PageComponent", () => {
    let component: PageComponent;
    let fixture: ComponentFixture<PageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PageComponent],
            providers: [provideRouter([])]
        }).compileComponents();

        fixture = TestBed.createComponent(PageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("offers all built-in themes and switches to Anna Dark", () => {
        const themeService = TestBed.inject(ThemeService);
        expect(component["themeOptions"].map(theme => theme.id)).toEqual(["mona-light", "mona-dark", "anna-dark"]);

        component["onThemeChange"](THEME_OPTIONS.find(theme => theme.id === "anna-dark")!);
        fixture.detectChanges();

        expect(themeService.themeId()).toBe("anna-dark");
        expect(themeService.theme()).toBe("anna");
        expect(themeService.themeVariant()).toBe("dark");
    });

    it("has no AXE violations with Anna Dark active", async () => {
        const themeService = TestBed.inject(ThemeService);
        themeService.setThemeId("anna-dark");
        fixture.detectChanges();

        // jsdom has no canvas implementation; theme specs verify Anna contrast pairs numerically.
        const results = await axe.run(fixture.nativeElement as HTMLElement, {
            rules: { "color-contrast": { enabled: false } }
        });

        expect(results.violations).toEqual([]);
    });
});
