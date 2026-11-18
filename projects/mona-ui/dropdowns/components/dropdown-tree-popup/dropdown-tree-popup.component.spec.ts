import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, inject, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import type { FilterChangeEvent } from "@nanahoshi/mona-ui/common";
import { TreeService } from "@nanahoshi/mona-ui/internal/tree";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DropdownTreePopupComponent } from "./dropdown-tree-popup.component";

interface Place {
    readonly name: string;
    readonly places?: readonly Place[];
}

const PLACES: readonly Place[] = [
    {
        name: "Europe",
        places: [{ name: "Lisbon" }, { name: "Oslo" }]
    },
    {
        name: "Asia",
        places: [{ name: "Seoul" }]
    }
];

@Component({
    template: `
        <span id="place-label">Place</span>
        <mona-dropdown-tree-popup
            treeId="places-tree"
            [ariaLabel]="ariaLabel()"
            [ariaLabelledBy]="ariaLabelledBy()"
            [footerTemplate]="templates() ? footer : null"
            [headerTemplate]="templates() ? header : null"
            [itemTemplate]="templates() ? item : null"
            [noDataTemplate]="templates() ? noData : null">
        </mona-dropdown-tree-popup>
        <ng-template #header><p class="popup-header">Recent places</p></ng-template>
        <ng-template #footer><p class="popup-footer">Can't find it? Add a place.</p></ng-template>
        <ng-template #item let-place
            ><span class="popup-item">★ {{ place.name }}</span></ng-template
        >
        <ng-template #noData><p class="popup-no-data">Nothing here yet</p></ng-template>
    `,
    imports: [DropdownTreePopupComponent],
    providers: [TreeService]
})
class PopupHostComponent {
    public readonly ariaLabel = signal("Place");
    public readonly ariaLabelledBy = signal("");
    public readonly templates = signal(false);
    public readonly treeService = inject<TreeService<Place>>(TreeService);

    public constructor() {
        this.treeService.setExpandableOptions({ enabled: true });
        this.treeService.setTextField("name");
        this.treeService.setChildrenSelector("places");
        this.treeService.setData(PLACES);
    }
}

describe("DropdownTreePopupComponent", () => {
    let announce: ReturnType<typeof vi.fn>;
    let fixture: ComponentFixture<PopupHostComponent>;
    let host: HTMLElement;
    let treeService: TreeService<Place>;

    beforeEach(async () => {
        announce = vi.fn(() => Promise.resolve());
        TestBed.configureTestingModule({
            imports: [PopupHostComponent],
            providers: [{ provide: LiveAnnouncer, useValue: { announce } }]
        });
        fixture = TestBed.createComponent(PopupHostComponent);
        host = fixture.nativeElement as HTMLElement;
        document.body.append(host);
        treeService = fixture.componentInstance.treeService;
        await stable();
    });

    afterEach(() => {
        host.remove();
    });

    async function stable(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    async function enableFilter(): Promise<void> {
        treeService.setFilterableOptions({ debounce: 0, enabled: true });
        await stable();
    }

    async function typeFilter(text: string): Promise<void> {
        const input = getFilterInput();
        input.value = text;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 10));
        await stable();
    }

    function getTree(): HTMLElement {
        return host.querySelector("[role='tree']") as HTMLElement;
    }

    function getFilterInput(): HTMLInputElement {
        return host.querySelector("mona-filter-input input") as HTMLInputElement;
    }

    function nodeTexts(): string[] {
        return Array.from(host.querySelectorAll("[role='treeitem'] mona-tree-node"), node =>
            (node.textContent ?? "").replace(/\s+/g, " ").trim()
        );
    }

    function getNode(name: string) {
        const node = TreeService.flatten(treeService.nodeSet()).firstOrDefault(
            candidate => candidate.data.name === name
        );
        if (!node) {
            throw new Error(`Node not found: ${name}`);
        }
        return node;
    }

    it("renders the tree, named by the field, without taking focus", () => {
        const tree = getTree();
        expect(tree.id).toBe("places-tree");
        expect(tree.getAttribute("aria-label")).toBe("Place");
        // The field keeps focus and points aria-activedescendant at the active node.
        expect(tree.hasAttribute("tabindex")).toBe(false);
        expect(tree.hasAttribute("aria-activedescendant")).toBe(false);
        expect(nodeTexts()).toEqual(["Europe", "Asia"]);
    });

    it("names the tree with the field's aria-labelledby", async () => {
        fixture.componentInstance.ariaLabel.set("");
        fixture.componentInstance.ariaLabelledBy.set("place-label");
        await stable();
        expect(getTree().getAttribute("aria-labelledby")).toBe("place-label");
    });

    it("renders the header above the tree, the footer below it, and the item template in each node", async () => {
        fixture.componentInstance.templates.set(true);
        await stable();
        const header = host.querySelector(".popup-header") as HTMLElement;
        const footer = host.querySelector(".popup-footer") as HTMLElement;
        expect(header.compareDocumentPosition(getTree()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(footer.compareDocumentPosition(getTree()) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
        expect(nodeTexts()).toEqual(["★ Europe", "★ Asia"]);
    });

    it("shows a filter box only while filtering is on", async () => {
        expect(host.querySelector("mona-filter-input")).toBeNull();
        await enableFilter();
        const input = getFilterInput();
        expect(input.getAttribute("role")).toBe("combobox");
        expect(input.getAttribute("aria-controls")).toBe("places-tree");
        expect(input.getAttribute("aria-label")).toBe("Filter Place");

        fixture.componentInstance.ariaLabel.set("");
        await stable();
        expect(input.getAttribute("aria-label")).toBe("Filter tree");
    });

    it("points the filter box at the active node", async () => {
        await enableFilter();
        expect(getFilterInput().hasAttribute("aria-activedescendant")).toBe(false);
        const asia = getNode("Asia");
        treeService.navigatedNode.set(asia);
        await stable();
        expect(getFilterInput().getAttribute("aria-activedescendant")).toBe(treeService.getNodeElementId(asia.uid));
    });

    it("filters the tree from the filter box, and announces how many nodes match", async () => {
        await enableFilter();
        const filterChanges: string[] = [];
        treeService.filterChange$.subscribe(event => filterChanges.push(event.filter));
        expect(announce).not.toHaveBeenCalled();

        await typeFilter("lis");
        expect(filterChanges).toEqual(["lis"]);
        expect(treeService.filterText()).toBe("lis");
        expect(nodeTexts()).toEqual(["Europe", "Lisbon"]);
        expect(announce).toHaveBeenLastCalledWith("1 result", "polite");

        await typeFilter("zzz");
        expect(announce).toHaveBeenLastCalledWith("No matching items", "polite");
        const placeholder = host.querySelector("mona-placeholder") as HTMLElement;
        expect(placeholder.textContent?.trim()).toBe("No matching items");
        expect(getTree().getAttribute("aria-describedby")).toBe(placeholder.id);

        const calls = announce.mock.calls.length;
        await typeFilter("");
        expect(announce).toHaveBeenCalledTimes(calls);
        expect(nodeTexts()).toEqual(["Europe", "Asia"]);
    });

    it("leaves the tree unfiltered when filterChange is prevented", async () => {
        await enableFilter();
        treeService.filterChange$.subscribe((event: FilterChangeEvent) => event.preventDefault());
        await typeFilter("lis");
        expect(treeService.filterText()).toBe("");
        expect(nodeTexts()).toEqual(["Europe", "Asia"]);
    });

    it("says an empty tree has no data, in text that describes the tree, or in the no-data template", async () => {
        expect(getTree().hasAttribute("aria-describedby")).toBe(false);
        treeService.setData([]);
        await stable();
        const placeholder = host.querySelector("mona-placeholder") as HTMLElement;
        expect(placeholder.textContent?.trim()).toBe("No data");
        expect(placeholder.id).toBe("places-tree-no-data");
        expect(getTree().getAttribute("aria-describedby")).toBe("places-tree-no-data");

        fixture.componentInstance.templates.set(true);
        await stable();
        expect(host.querySelector("mona-placeholder")).toBeNull();
        const noData = host.querySelector(".popup-no-data") as HTMLElement;
        expect(noData.textContent).toBe("Nothing here yet");
        expect(noData.parentElement?.id).toBe("places-tree-no-data");
    });

    it("keeps focus where it is when pressed, except in the filter box", async () => {
        await enableFilter();
        const press = (target: Element): boolean => {
            const event = new PointerEvent("pointerdown", { bubbles: true, cancelable: true });
            target.dispatchEvent(event);
            return event.defaultPrevented;
        };
        expect(press(host.querySelector("[role='treeitem'] mona-tree-node") as Element)).toBe(true);
        expect(press(getFilterInput())).toBe(false);
    });

    it("has no axe violations, with a filter box and when empty", async () => {
        await enableFilter();
        const run = async (): Promise<string[]> => {
            const results = await axe.run(host, { rules: { region: { enabled: false } } });
            return results.violations.map(violation => violation.id);
        };
        expect(await run()).toEqual([]);
        await typeFilter("zzz");
        expect(await run()).toEqual([]);
    });
});
