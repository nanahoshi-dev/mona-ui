import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DOCS_MANIFEST, flattenDocsPages } from "../../docs-manifest";
import { SidebarComponent } from "./sidebar.component";

@Component({ template: "" })
class EmptyComponent {}

describe("SidebarComponent", () => {
    let fixture: ComponentFixture<SidebarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SidebarComponent],
            providers: [provideRouter([{ path: "components/:page", component: EmptyComponent }])]
        }).compileComponents();

        fixture = TestBed.createComponent(SidebarComponent);
        await fixture.whenStable();
        fixture.detectChanges();
    });

    it("has a section for every category, in a named navigation landmark", () => {
        const nav = fixture.nativeElement.querySelector("nav") as HTMLElement;

        expect(nav.getAttribute("aria-label")).toBe("Documentation");
        expect(Array.from(nav.querySelectorAll("h2")).map(heading => heading.textContent?.trim())).toEqual(
            DOCS_MANIFEST.map(category => category.title)
        );
    });

    it("can reach every page in the manifest", () => {
        const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll("nav button"));
        buttons.filter(button => button.getAttribute("aria-expanded") === "false").forEach(button => button.click());
        fixture.detectChanges();

        const hrefs = Array.from(fixture.nativeElement.querySelectorAll("nav a")).map(link =>
            (link as HTMLAnchorElement).getAttribute("href")
        );
        expect(hrefs).toEqual(["/api", ...flattenDocsPages().map(page => `/components/${page.path}`)]);
    });

    it("marks the API reference link as current anywhere under /api", async () => {
        const router = TestBed.inject(Router);
        router.resetConfig([{ path: "**", component: EmptyComponent }]);
        const link = (): HTMLAnchorElement => fixture.nativeElement.querySelector("nav a[href='/api']");

        await router.navigateByUrl("/api");
        await fixture.whenStable();
        fixture.detectChanges();
        expect(link().getAttribute("aria-current")).toBe("page");

        await router.navigateByUrl("/api/chart/ChartComponent");
        await fixture.whenStable();
        fixture.detectChanges();
        expect(link().getAttribute("aria-current")).toBe("true");

        await router.navigateByUrl("/components/button");
        await fixture.whenStable();
        fixture.detectChanges();
        expect(link().getAttribute("aria-current")).toBeNull();
    });

    it("brings the current page's link into view", async () => {
        const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => undefined);
        fixture.autoDetectChanges();
        try {
            await TestBed.inject(Router).navigateByUrl("/components/window");
            await fixture.whenStable();

            expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
            expect((scrollIntoView.mock.contexts.at(-1) as Element).textContent?.trim()).toBe("Window");
        } finally {
            scrollIntoView.mockRestore();
        }
    });
});
