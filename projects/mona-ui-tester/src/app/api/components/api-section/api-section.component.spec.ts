import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import axe from "axe-core";
import { type Observable, of, throwError } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageService } from "../../../layout/services/page.service";
import type { ApiPageReference } from "../../api-model";
import { ApiReferenceService } from "../../api-reference.service";
import { ApiSectionComponent } from "./api-section.component";

const PAGE: ApiPageReference = {
    entryPoints: ["auto-complete", "dropdowns"],
    exports: [
        {
            entryPoint: "auto-complete",
            kind: "component",
            name: "AutoCompleteComponent",
            selector: "mona-auto-complete",
            summary: ""
        },
        { entryPoint: "auto-complete", kind: "pipe", name: "DemoPipe", pipeName: "monaDemo", summary: "Formats it." },
        {
            entryPoint: "dropdowns",
            kind: "directive",
            name: "DropdownFilterableDirective",
            selector: "mona-auto-complete[monaDropDownFilterable], mona-combo-box[monaDropDownFilterable]",
            summary: "Filters the list."
        },
        {
            entryPoint: "auto-complete",
            kind: "interface",
            name: "AutoCompleteOptions",
            summary: "Options for `AutoCompleteComponent`."
        }
    ],
    links: { AutoCompleteComponent: "auto-complete" },
    related: [{ entryPoint: "common", name: "Shared" }]
};

describe("ApiSectionComponent", () => {
    const requested: string[] = [];
    let fixture: ComponentFixture<ApiSectionComponent>;
    let section: HTMLElement;

    async function render(page: Observable<ApiPageReference> = of(PAGE)): Promise<void> {
        TestBed.configureTestingModule({
            providers: [
                PageService,
                provideRouter([]),
                {
                    provide: ApiReferenceService,
                    useValue: {
                        page: (slug: string): Observable<ApiPageReference> => {
                            requested.push(slug);
                            return page;
                        }
                    }
                }
            ]
        });
        fixture = TestBed.createComponent(ApiSectionComponent);
        fixture.componentRef.setInput("src", "docs/auto-complete/api.md");
        fixture.componentRef.setInput("parentSectionId", "auto-complete");
        fixture.detectChanges();
        await fixture.whenStable();
        section = fixture.nativeElement as HTMLElement;
        document.body.append(section);
    }

    function cardOf(name: string): HTMLElement | null {
        return section.querySelector(`a[href$='/${name}']`)?.closest("li") ?? null;
    }

    afterEach(() => {
        requested.length = 0;
        section?.remove();
        document.getElementById("types")?.remove();
        Reflect.deleteProperty(navigator, "clipboard");
    });

    it("loads the section of the page its api.md names", async () => {
        await render();

        expect(requested).toEqual(["auto-complete"]);
        expect(section.querySelector("h2")?.id).toBe("api");
    });

    it("shows each export as a card with its kind, a link to its page, and what a template uses it by", async () => {
        await render();
        const component = cardOf("AutoCompleteComponent");
        const directive = cardOf("DropdownFilterableDirective");

        expect(component?.querySelector("a")?.getAttribute("href")).toBe("/api/auto-complete/AutoCompleteComponent");
        expect(component?.textContent).toContain("Component");
        expect(
            Array.from(directive?.querySelectorAll("button") ?? []).map(button => button.textContent?.trim())
        ).toEqual(["Copy mona-auto-complete[monaDropDownFilterable]", "Copy mona-combo-box[monaDropDownFilterable]"]);
        expect(cardOf("DemoPipe")?.querySelector("button")?.textContent?.trim()).toBe("Copy monaDemo");
        expect(directive?.textContent).toContain("Filters the list.");
    });

    it("names another entry point above its exports", async () => {
        await render();
        const lists = Array.from(section.querySelectorAll("app-api-export-list"));

        expect(lists[1]?.previousElementSibling?.textContent?.replace(/\s+/g, " ").trim()).toBe(
            "From @nanahoshi/mona-ui/dropdowns:"
        );
        expect(lists[1]?.textContent).toContain("DropdownFilterableDirective");
        expect(lists[0]?.textContent).not.toContain("DropdownFilterableDirective");
    });

    it("lists types under their own heading, then the related types, with names in summaries linked", async () => {
        await render();
        const types = cardOf("AutoCompleteOptions");

        expect(section.querySelector("h3")?.textContent?.trim()).toBe("Types");
        expect(types?.querySelector("button")).toBeNull();
        expect(types?.querySelector("a[href='/api/auto-complete/AutoCompleteComponent']")).not.toBeNull();
        expect(section.querySelector("a[href='/api/common/Shared']")?.textContent?.trim()).toBe("Shared");
    });

    it("adds its headings to the page's outline under the page's own section", async () => {
        await render();
        const outline = Array.from(TestBed.inject(PageService).sections()).map(item => ({
            depth: item.depth(),
            id: item.id(),
            parentId: item.parentId()
        }));

        expect(outline).toEqual([
            { depth: 1, id: "api", parentId: "auto-complete" },
            { depth: 2, id: "types", parentId: "auto-complete" }
        ]);
    });

    it("gives a heading an id no other heading on the page has", async () => {
        const guideHeading = document.createElement("h3");
        guideHeading.id = "types";
        document.body.append(guideHeading);
        await render();

        expect(section.querySelector("h3")?.id).toBe("types-2");
    });

    it("copies a selector, and says so", async () => {
        const writeText = vi.fn((): Promise<void> => Promise.resolve());
        Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
        await render();

        const card = cardOf("DropdownFilterableDirective");
        (card?.querySelectorAll("button")[1] as HTMLButtonElement).click();

        expect(writeText).toHaveBeenCalledWith("mona-combo-box[monaDropDownFilterable]");
        // The status clears after two seconds, so it's read before then rather than when the fixture is stable.
        await vi.waitFor(() => {
            fixture.detectChanges();
            expect(card?.closest("app-api-export-list")?.querySelector("[aria-live]")?.textContent?.trim()).toBe(
                "Copied mona-combo-box[monaDropDownFilterable]"
            );
        });
    });

    it("points to the API reference when the section can't load", async () => {
        await render(throwError(() => new Error("Not found")));

        expect(section.textContent).toContain("couldn't be loaded");
        expect(section.querySelector("a[href='/api']")).not.toBeNull();
    });

    it("passes axe", async () => {
        await render();

        const results = await axe.run(section, { rules: { "color-contrast": { enabled: false } } });

        expect(results.violations).toEqual([]);
    });
});
