import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import axe from "axe-core";
import { beforeEach, describe, expect, it } from "vitest";
import { DOCS_MANIFEST } from "../../docs-manifest";
import type { DocsCategory } from "../../docs-manifest";
import { SidebarGroupComponent } from "./sidebar-group.component";

@Component({ template: "" })
class EmptyComponent {}

describe("SidebarGroupComponent", () => {
    let fixture: ComponentFixture<SidebarGroupComponent>;
    const data = DOCS_MANIFEST.find(category => category.id === "data") as DocsCategory;

    const button = (): HTMLButtonElement => fixture.nativeElement.querySelector("button");
    const links = (): HTMLAnchorElement[] => Array.from(fixture.nativeElement.querySelectorAll("a"));

    async function go(url: string): Promise<void> {
        await TestBed.inject(Router).navigateByUrl(url);
        await fixture.whenStable();
        fixture.detectChanges();
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SidebarGroupComponent],
            providers: [
                provideRouter([
                    { path: "components/:page", component: EmptyComponent },
                    { path: "components/:page/:child", component: EmptyComponent }
                ])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SidebarGroupComponent);
        fixture.componentRef.setInput("category", data);
        await fixture.whenStable();
        fixture.detectChanges();
    });

    it("lists its pages, marking the current one, while its section holds the current page", async () => {
        await go("/components/list-view");

        expect(links().map(link => link.getAttribute("href"))).toEqual(
            data.pages.map(page => `/components/${page.path}`)
        );
        const current = links().filter(link => link.getAttribute("aria-current") === "page");
        expect(current.map(link => link.textContent?.trim())).toEqual(["List View"]);
    });

    it("lists a page's sub-pages under it by their short names, at their nested URLs", async () => {
        const navigation = DOCS_MANIFEST.find(category => category.id === "navigation") as DocsCategory;
        fixture.componentRef.setInput("category", navigation);
        await go("/components/sidebar/state");

        const sidebar = links().find(link => link.getAttribute("href") === "/components/sidebar") as HTMLAnchorElement;
        const nested = Array.from(sidebar.closest("li")?.querySelectorAll(":scope > ul a") ?? []);
        expect(nested.map(link => [link.getAttribute("href"), link.textContent?.trim()])).toEqual([
            ["/components/sidebar/menus", "Menus"],
            ["/components/sidebar/state", "State & Behavior"]
        ]);
        expect(links().filter(link => link.getAttribute("aria-current") === "page")).toEqual([nested[1]]);
        expect(sidebar.hasAttribute("aria-current")).toBe(false);
    });

    it("hides its pages behind a button that says so", async () => {
        await go("/components/introduction");

        expect(button().getAttribute("aria-expanded")).toBe("false");
        expect(button().hasAttribute("aria-controls")).toBe(false);
        expect(links()).toEqual([]);

        button().click();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(button().getAttribute("aria-expanded")).toBe("true");
        const list = fixture.nativeElement.querySelector("ul") as HTMLElement;
        expect(button().getAttribute("aria-controls")).toBe(list.id);
        expect(links().length).toBe(data.pages.length);
    });

    it("gives each instance its own list id, because the sidebar is on the page twice", async () => {
        await go("/components/list-view");
        const other = TestBed.createComponent(SidebarGroupComponent);
        other.componentRef.setInput("category", data);
        await other.whenStable();
        other.detectChanges();

        const ids = [fixture, other].map(item => (item.nativeElement.querySelector("ul") as HTMLElement).id);
        expect(ids[0]).not.toBe(ids[1]);
    });

    it("passes axe, sub-pages included", async () => {
        fixture.componentRef.setInput(
            "category",
            DOCS_MANIFEST.find(category => category.id === "navigation")
        );
        await go("/components/sidebar/menus");

        const results = await axe.run(fixture.nativeElement, { rules: { "color-contrast": { enabled: false } } });

        expect(results.violations).toEqual([]);
    });
});
