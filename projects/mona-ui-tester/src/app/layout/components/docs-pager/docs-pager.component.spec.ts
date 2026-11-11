import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import axe from "axe-core";
import { beforeEach, describe, expect, it } from "vitest";
import { flattenDocsPages } from "../../docs-manifest";
import { DocsPagerComponent } from "./docs-pager.component";

@Component({ template: "" })
class EmptyComponent {}

describe("DocsPagerComponent", () => {
    let fixture: ComponentFixture<DocsPagerComponent>;
    const pages = flattenDocsPages();

    const hrefs = (): (string | null)[] =>
        Array.from(fixture.nativeElement.querySelectorAll("a")).map(link =>
            (link as HTMLAnchorElement).getAttribute("href")
        );

    async function go(url: string): Promise<void> {
        await TestBed.inject(Router).navigateByUrl(url);
        await fixture.whenStable();
        fixture.detectChanges();
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DocsPagerComponent],
            providers: [
                provideRouter([
                    { path: "components/:page", component: EmptyComponent },
                    { path: "components/:page/:child", component: EmptyComponent }
                ])
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(DocsPagerComponent);
    });

    it("links to the neighbors of a page", async () => {
        await go(`/components/${pages[1].path}`);

        expect(hrefs()).toEqual([`/components/${pages[0].path}`, `/components/${pages[2].path}`]);
    });

    it("has only a next link on the first page and only a previous link on the last", async () => {
        await go(`/components/${pages[0].path}`);
        expect(hrefs()).toEqual([`/components/${pages[1].path}`]);

        await go(`/components/${pages.at(-1)?.path}`);
        expect(hrefs()).toEqual([`/components/${pages.at(-2)?.path}`]);
    });

    it("goes into a page's sub-pages after it, and links to them by their nested URLs", async () => {
        await go("/components/sidebar");
        expect(hrefs()).toEqual(["/components/popup-menu", "/components/sidebar/menus"]);

        await go("/components/sidebar/state");
        expect(hrefs()).toEqual(["/components/sidebar/menus", "/components/stepper"]);
    });

    it("renders nothing off the manifest", async () => {
        await go("/components/not-a-page");

        expect(fixture.nativeElement.querySelector("nav")).toBeNull();
    });

    it("passes axe", async () => {
        await go(`/components/${pages[1].path}`);

        const results = await axe.run(fixture.nativeElement, { rules: { "color-contrast": { enabled: false } } });

        expect(results.violations).toEqual([]);
    });
});
