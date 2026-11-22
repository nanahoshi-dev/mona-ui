import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Title } from "@angular/platform-browser";
import { Router, provideRouter } from "@angular/router";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import axe from "axe-core";
import { vi } from "vitest";
import { THEME_OPTIONS } from "../../../theme-options";
import { GITHUB_STARS_FIELD, GITHUB_STARS_STORAGE_KEY } from "../../services/github-repository.service";

import { PageComponent } from "./page.component";

@Component({ template: "" })
class EmptyComponent {}

describe("PageComponent", () => {
    let component: PageComponent;
    let fixture: ComponentFixture<PageComponent>;

    /** Answers the header's request for the repository's star count. */
    function answerStars(count: number): void {
        TestBed.inject(HttpTestingController)
            .expectOne("https://api.github.com/repos/nanahoshi-dev/mona-ui")
            .flush({ [GITHUB_STARS_FIELD]: count });
        fixture.detectChanges();
    }

    beforeEach(async () => {
        localStorage.removeItem(GITHUB_STARS_STORAGE_KEY);
        await TestBed.configureTestingModule({
            imports: [PageComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([{ path: "components/:page", component: EmptyComponent }])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => localStorage.removeItem(GITHUB_STARS_STORAGE_KEY));

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("names the page from the manifest, in the breadcrumb and the document title", async () => {
        await TestBed.inject(Router).navigateByUrl("/components/contextmenu");
        await fixture.whenStable();
        fixture.detectChanges();

        expect(component["activeBreadcrumbs"]()).toEqual(["Documentation", "Navigation", "Context Menu"]);
        expect(TestBed.inject(Title).getTitle()).toBe("Context Menu · Mona UI");
    });

    it("returns to the top on a new page, but not when following a link to a section", async () => {
        const router = TestBed.inject(Router);
        const container = fixture.nativeElement.querySelector("[data-page-scroll-container]") as HTMLElement;
        const scrollTop = vi.spyOn(container, "scrollTop", "set");
        await router.navigateByUrl("/components/grid");
        await fixture.whenStable();
        fixture.detectChanges();
        expect(scrollTop).toHaveBeenCalledWith(0);

        scrollTop.mockClear();
        await router.navigateByUrl("/components/pager#api");
        await fixture.whenStable();
        fixture.detectChanges();
        expect(scrollTop).not.toHaveBeenCalled();
    });

    it("names an API reference page by its entry point and export", async () => {
        const router = TestBed.inject(Router);
        router.resetConfig([{ path: "**", component: EmptyComponent }]);

        await router.navigateByUrl("/api/chart/ChartComponent");
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component["activeBreadcrumbs"]()).toEqual(["Documentation", "API Reference", "chart", "ChartComponent"]);
        expect(TestBed.inject(Title).getTitle()).toBe("ChartComponent · API Reference · Mona UI");

        await router.navigateByUrl("/api/chart");
        await fixture.whenStable();
        fixture.detectChanges();
        expect(TestBed.inject(Title).getTitle()).toBe("@nanahoshi/mona-ui/chart · API Reference · Mona UI");
    });

    it("returns to the top between API reference pages, but not for a link to a member", async () => {
        const router = TestBed.inject(Router);
        router.resetConfig([{ path: "**", component: EmptyComponent }]);
        const container = fixture.nativeElement.querySelector("[data-page-scroll-container]") as HTMLElement;
        const scrollTop = vi.spyOn(container, "scrollTop", "set");
        await router.navigateByUrl("/api/chart/ChartComponent");
        await fixture.whenStable();
        fixture.detectChanges();
        scrollTop.mockClear();

        await router.navigateByUrl("/api/chart/ChartPoint");
        await fixture.whenStable();
        fixture.detectChanges();
        expect(scrollTop).toHaveBeenCalledWith(0);

        scrollTop.mockClear();
        await router.navigateByUrl("/api/chart/ChartPoint#x");
        await fixture.whenStable();
        fixture.detectChanges();
        expect(scrollTop).not.toHaveBeenCalled();
    });

    it("keeps the drawer open for a section's button, and closes it for a link", () => {
        const sidebar = component["sidebarService"];
        sidebar.open();
        const button = document.createElement("button");
        const link = document.createElement("a");

        component["onDrawerClick"]({ target: button } as unknown as Event);
        expect(sidebar.isOpen()).toBe(true);

        component["onDrawerClick"]({ target: link } as unknown as Event);
        expect(sidebar.isOpen()).toBe(false);
    });

    it("offers built-in and custom themes and switches to Anna Dark", () => {
        const themeService = TestBed.inject(ThemeService);
        expect(component["themeOptions"].map(theme => `${theme.name}-${theme.variant}`)).toEqual([
            "mona-light",
            "mona-dark",
            "anna-light",
            "anna-dark",
            "luna-light",
            "luna-dark",
            "rena-light",
            "rena-dark",
            "aurora-dark"
        ]);

        component["onThemeChange"](THEME_OPTIONS.find(theme => theme.name === "anna" && theme.variant === "dark")!);
        fixture.detectChanges();

        expect(themeService.selection()).toEqual({ name: "anna", variant: "dark" });
        expect(themeService.themeName()).toBe("anna");
        expect(themeService.themeVariant()).toBe("dark");
    });

    it("links to the public repository, and shows its star count once GitHub gives one", () => {
        const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
            "a[href='https://github.com/nanahoshi-dev/mona-ui']"
        );
        expect(link?.target).toBe("_blank");
        expect(link?.rel).toBe("noopener noreferrer");
        expect(link?.textContent?.trim()).toBe("GitHub repository (opens in a new tab)");

        answerStars(1234);

        // The name contains what the link shows, as WCAG 2.5.3 asks.
        expect(link?.querySelector(".tabular-nums")?.textContent?.trim()).toBe("1.2K");
        expect(link?.textContent?.replace(/\s+/g, " ").trim()).toBe(
            "GitHub repository, 1.2K stars (opens in a new tab)"
        );
    });

    it("has no AXE violations with Anna Dark active", async () => {
        const themeService = TestBed.inject(ThemeService);
        themeService.setTheme({ name: "anna", variant: "dark" });
        answerStars(1);

        // jsdom has no canvas implementation; theme specs verify Anna contrast pairs numerically.
        const results = await axe.run(fixture.nativeElement as HTMLElement, {
            rules: { "color-contrast": { enabled: false } }
        });

        expect(results.violations).toEqual([]);
    });
});
