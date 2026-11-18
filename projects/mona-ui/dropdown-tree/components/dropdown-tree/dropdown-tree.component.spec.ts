import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { form, FormField, required } from "@angular/forms/signals";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import axe from "axe-core";
import { delay, type Observable, of } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DropdownTreeValueTemplateDirective } from "../../directives/dropdown-tree-value-template.directive";
import { DropdownTreeComponent } from "./dropdown-tree.component";

interface Place {
    readonly disabled?: boolean;
    readonly id: string;
    readonly name: string;
    readonly places?: readonly Place[];
}

const PLACES: readonly Place[] = [
    {
        id: "europe",
        name: "Europe",
        places: [
            {
                id: "germany",
                name: "Germany",
                places: [
                    { id: "berlin", name: "Berlin" },
                    { id: "munich", name: "Munich" }
                ]
            },
            { id: "italy", name: "Italy", disabled: true, places: [{ id: "rome", name: "Rome" }] }
        ]
    },
    { id: "asia", name: "Asia", places: [{ id: "japan", name: "Japan" }] }
];

@Component({
    template: `
        <span id="place-label">Place</span>
        <mona-dropdown-tree
            aria-labelledby="place-label"
            children="places"
            itemDisabled="disabled"
            placeholder="Choose a place"
            textField="name"
            valueField="id"
            [adaptiveMode]="adaptiveMode()"
            [data]="places"
            [showClearButton]="true"
            [valuePrimitive]="true"
            [(value)]="value">
        </mona-dropdown-tree>
    `,
    imports: [DropdownTreeComponent]
})
class PrimitiveHostComponent {
    protected readonly places = PLACES;
    public readonly adaptiveMode = signal<"auto" | "none">("none");
    public readonly value = signal<string | null>(null);
}

@Component({
    template: `
        <mona-dropdown-tree
            aria-label="Place"
            children="places"
            monaDropDownFilterable
            textField="name"
            valueField="id"
            [data]="places"
            [(value)]="value">
            <ng-template monaDropDownTreeValueTemplate let-place>
                <span class="value-template">{{ place ? "Picked " + place.name : "Nothing" }}</span>
            </ng-template>
        </mona-dropdown-tree>
    `,
    imports: [DropdownFilterableDirective, DropdownTreeComponent, DropdownTreeValueTemplateDirective]
})
class ObjectHostComponent {
    protected readonly places = PLACES;
    public readonly value = signal<Place | null>(null);
}

interface Team {
    readonly id: number;
    readonly name: string;
    readonly parentId: number | null;
}

@Component({
    template: `
        <mona-dropdown-tree
            aria-label="Team"
            idField="id"
            mode="flat"
            parentIdField="parentId"
            textField="name"
            valueField="id"
            [data]="teams"
            [valuePrimitive]="true"
            [formField]="model.team">
        </mona-dropdown-tree>
    `,
    imports: [DropdownTreeComponent, FormField]
})
class FlatFormHostComponent {
    readonly #model = signal<{ team: number | null }>({ team: null });
    protected readonly teams: readonly Team[] = [
        { id: 1, name: "Engineering", parentId: null },
        { id: 2, name: "Platform", parentId: 1 },
        { id: 3, name: "Design", parentId: null }
    ];
    public readonly model = form(this.#model, path => {
        required(path.team);
    });
}

interface Folder {
    readonly name: string;
    readonly path: string;
}

@Component({
    template: `
        <mona-dropdown-tree
            aria-label="Folder"
            textField="name"
            [children]="loadFolders"
            [data]="roots"
            [hasChildren]="hasFolders"
            [(value)]="value">
        </mona-dropdown-tree>
    `,
    imports: [DropdownTreeComponent]
})
class LazyHostComponent {
    protected readonly roots: readonly Folder[] = [{ name: "Documents", path: "/Documents" }];
    public readonly value = signal<Folder | null>(null);
    protected readonly hasFolders = (folder: Folder): boolean => folder.path === "/Documents";
    protected readonly loadFolders = (folder: Folder): Observable<Folder[]> =>
        of([{ name: "Invoices", path: `${folder.path}/Invoices` }]).pipe(delay(10));
}

describe("DropdownTreeComponent", () => {
    beforeEach(() => clearOverlays());
    afterEach(() => {
        clearOverlays();
        vi.unstubAllGlobals();
    });

    it("is a combobox that opens a tree", async () => {
        const fixture = await render(PrimitiveHostComponent);
        const host = getHost(fixture);
        expect(host.getAttribute("role")).toBe("combobox");
        expect(host.getAttribute("aria-haspopup")).toBe("tree");
        expect(host.getAttribute("aria-expanded")).toBe("false");
        expect(host.getAttribute("aria-labelledby")).toBe("place-label");
        expect(host.textContent).toContain("Choose a place");

        await openPopup(fixture);
        const tree = document.querySelector("[role='tree']") as HTMLElement;
        expect(host.getAttribute("aria-expanded")).toBe("true");
        expect(host.getAttribute("aria-controls")).toBe(tree.id);
        // The field keeps focus; the tree isn't a Tab stop of its own.
        expect(tree.hasAttribute("tabindex")).toBe(false);
        expect(tree.hasAttribute("aria-activedescendant")).toBe(false);
        expect(tree.getAttribute("aria-labelledby")).toBe("place-label");
    });

    it("shows the selected node's text and opens on it, with its parents opened", async () => {
        const fixture = await render(PrimitiveHostComponent);
        fixture.componentInstance.value.set("munich");
        await stable(fixture);
        const host = getHost(fixture);
        expect(host.textContent).toContain("Munich");

        await openPopup(fixture);
        const munich = getNode("Munich");
        expect(munich.getAttribute("aria-selected")).toBe("true");
        expect(host.getAttribute("aria-activedescendant")).toBe(munich.id);
        expect(getNode("Germany").getAttribute("aria-expanded")).toBe("true");
    });

    it("makes the first node active when nothing is selected", async () => {
        const fixture = await render(PrimitiveHostComponent);
        await openPopup(fixture);
        expect(getHost(fixture).getAttribute("aria-activedescendant")).toBe(getNode("Europe").id);
    });

    it("moves through the tree with the arrow keys and selects with Enter", async () => {
        const fixture = await render(PrimitiveHostComponent);
        const host = getHost(fixture);
        await press(fixture, "ArrowDown");
        expect(host.getAttribute("aria-expanded")).toBe("true");
        expect(host.getAttribute("aria-activedescendant")).toBe(getNode("Europe").id);

        await press(fixture, "ArrowRight");
        expect(getNode("Europe").getAttribute("aria-expanded")).toBe("true");
        await press(fixture, "ArrowRight");
        expect(host.getAttribute("aria-activedescendant")).toBe(getNode("Germany").id);
        await press(fixture, "ArrowRight");
        await press(fixture, "ArrowDown");
        expect(host.getAttribute("aria-activedescendant")).toBe(getNode("Berlin").id);

        await press(fixture, "Enter");
        await settle(fixture);
        expect(fixture.componentInstance.value()).toBe("berlin");
        expect(host.getAttribute("aria-expanded")).toBe("false");
        expect(host.textContent).toContain("Berlin");
    });

    it("selects a parent node too, and Space selects as Enter does", async () => {
        const fixture = await render(PrimitiveHostComponent);
        await press(fixture, "Enter");
        await press(fixture, " ");
        await settle(fixture);
        expect(fixture.componentInstance.value()).toBe("europe");
        expect(getHost(fixture).getAttribute("aria-expanded")).toBe("false");
    });

    it("selects a clicked node and closes, even the node that is already selected", async () => {
        const fixture = await render(PrimitiveHostComponent);
        fixture.componentInstance.value.set("asia");
        await stable(fixture);
        await openPopup(fixture);
        clickNode("Asia");
        await settle(fixture);
        expect(fixture.componentInstance.value()).toBe("asia");
        expect(getHost(fixture).getAttribute("aria-expanded")).toBe("false");

        await openPopup(fixture);
        clickNode("Europe");
        await settle(fixture);
        expect(fixture.componentInstance.value()).toBe("europe");
    });

    it("doesn't select a disabled node", async () => {
        const fixture = await render(PrimitiveHostComponent);
        fixture.componentInstance.value.set("berlin");
        await stable(fixture);
        await openPopup(fixture);
        const italy = getNode("Italy");
        expect(italy.getAttribute("aria-disabled")).toBe("true");
        clickNode("Italy");
        await stable(fixture);
        expect(fixture.componentInstance.value()).toBe("berlin");
        expect(getHost(fixture).getAttribute("aria-expanded")).toBe("true");
    });

    it("closes with Escape and Tab without changing the value", async () => {
        const fixture = await render(PrimitiveHostComponent);
        await openPopup(fixture);
        await press(fixture, "ArrowDown");
        await press(fixture, "Escape");
        await settle(fixture);
        expect(getHost(fixture).getAttribute("aria-expanded")).toBe("false");
        expect(fixture.componentInstance.value()).toBeNull();

        await openPopup(fixture);
        await press(fixture, "ArrowDown");
        await press(fixture, "Tab");
        await settle(fixture);
        expect(getHost(fixture).getAttribute("aria-expanded")).toBe("false");
        expect(fixture.componentInstance.value()).toBeNull();
    });

    it("moves to a node by typing its first letters", async () => {
        const fixture = await render(PrimitiveHostComponent);
        await openPopup(fixture);
        await press(fixture, "a");
        await new Promise(resolve => setTimeout(resolve, 0));
        await stable(fixture);
        expect(getHost(fixture).getAttribute("aria-activedescendant")).toBe(getNode("Asia").id);
    });

    it("clears the value with the clear button", async () => {
        const fixture = await render(PrimitiveHostComponent);
        fixture.componentInstance.value.set("japan");
        await stable(fixture);
        (fixture.nativeElement.querySelector("mona-indicator-icon[preset='clear']") as HTMLElement).click();
        await stable(fixture);
        expect(fixture.componentInstance.value()).toBeNull();
        expect(getHost(fixture).textContent).toContain("Choose a place");
    });

    it("writes the whole item without valuePrimitive and passes it to the value template", async () => {
        const fixture = await render(ObjectHostComponent);
        const host = getHost(fixture);
        expect(host.querySelector(".value-template")?.textContent).toBe("Nothing");
        fixture.componentInstance.value.set(PLACES[1]);
        await stable(fixture);
        expect(host.querySelector(".value-template")?.textContent).toBe("Picked Asia");
    });

    it("filters the tree from its filter box, which drives the tree", async () => {
        const fixture = await render(ObjectHostComponent);
        await openPopup(fixture);
        const input = document.querySelector(".cdk-overlay-container input") as HTMLInputElement;
        expect(input.getAttribute("role")).toBe("combobox");
        expect(input.getAttribute("aria-label")).toBe("Filter Place");
        input.value = "mun";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await settle(fixture);
        expect(getNodes().map(node => nodeText(node))).toEqual(["Europe", "Germany", "Munich"]);
        // While the filter box has focus, it points at the active node, and the field doesn't.
        expect(getHost(fixture).hasAttribute("aria-activedescendant")).toBe(false);

        // The first match becomes the active node.
        expect(input.getAttribute("aria-activedescendant")).toBe(getNode("Munich").id);
        pressIn(input, "ArrowUp");
        await stable(fixture);
        expect(input.getAttribute("aria-activedescendant")).toBe(getNode("Germany").id);
        pressIn(input, "ArrowDown");
        await stable(fixture);
        expect(input.getAttribute("aria-activedescendant")).toBe(getNode("Munich").id);
        pressIn(input, "Enter");
        await settle(fixture);
        expect(fixture.componentInstance.value()?.id).toBe("munich");
    });

    it("clears the filter when the popup closes", async () => {
        const fixture = await render(ObjectHostComponent);
        await openPopup(fixture);
        const input = document.querySelector(".cdk-overlay-container input") as HTMLInputElement;
        input.value = "asia";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await settle(fixture);
        expect(getNodes()).toHaveLength(1);
        await press(fixture, "Escape");
        await settle(fixture);
        await openPopup(fixture);
        expect(getNodes().length).toBeGreaterThan(1);
    });

    it("builds the tree from flat data and works with signal forms", async () => {
        const fixture = await render(FlatFormHostComponent);
        const host = getHost(fixture);
        await openPopup(fixture);
        await press(fixture, "ArrowRight");
        await press(fixture, "ArrowDown");
        expect(host.getAttribute("aria-activedescendant")).toBe(getNode("Platform").id);
        await press(fixture, "Escape");
        await settle(fixture);
        host.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
        await stable(fixture);
        expect(fixture.componentInstance.model.team().touched()).toBe(true);
        expect(host.getAttribute("aria-invalid")).toBe("true");

        await openPopup(fixture);
        clickNode("Design");
        await settle(fixture);
        expect(fixture.componentInstance.model.team().value()).toBe(3);
        expect(host.hasAttribute("aria-invalid")).toBe(false);
    });

    it("loads children from an observable the first time a node opens", async () => {
        const fixture = await render(LazyHostComponent);
        await openPopup(fixture);
        const documents = getNode("Documents");
        expect(documents.getAttribute("aria-expanded")).toBe("false");
        await press(fixture, "ArrowRight");
        expect(documents.getAttribute("aria-busy")).toBe("true");
        await new Promise(resolve => setTimeout(resolve, 20));
        await stable(fixture);
        await press(fixture, "ArrowDown");
        await press(fixture, "Enter");
        await settle(fixture);
        expect(fixture.componentInstance.value()?.path).toBe("/Documents/Invoices");
        expect(getHost(fixture).textContent).toContain("Invoices");
    });

    it("has no axe violations with the popup open", async () => {
        const fixture = await render(PrimitiveHostComponent);
        fixture.componentInstance.value.set("berlin");
        await stable(fixture);
        await openPopup(fixture);
        const results = await axe.run(document.body, { rules: { region: { enabled: false } } });
        expect(results.violations.map(violation => violation.id)).toEqual([]);
    });

    describe("adaptiveMode", () => {
        it("opens a bottom sheet on a small screen", async () => {
            stubSmallScreen(true);
            const fixture = await render(PrimitiveHostComponent);
            fixture.componentInstance.adaptiveMode.set("auto");
            await stable(fixture);
            await openPopup(fixture);
            const sheet = document.querySelector("mona-dropdown-sheet") as HTMLElement;
            expect(sheet).not.toBeNull();
            expect(sheet.textContent).toContain("Place");
            expect(document.querySelector(".cdk-overlay-backdrop")).not.toBeNull();
            // The field keeps the tree's active node while the sheet is open.
            expect(getHost(fixture).getAttribute("aria-activedescendant")).toBe(getNode("Europe").id);

            (sheet.querySelector("button[aria-label='Close']") as HTMLButtonElement).click();
            await settle(fixture);
            expect(getHost(fixture).getAttribute("aria-expanded")).toBe("false");
        });

        it("opens under the field on a wide screen, or without adaptiveMode", async () => {
            stubSmallScreen(false);
            const fixture = await render(PrimitiveHostComponent);
            fixture.componentInstance.adaptiveMode.set("auto");
            await stable(fixture);
            await openPopup(fixture);
            expect(document.querySelector("mona-dropdown-sheet")).toBeNull();
            await press(fixture, "Escape");
            await settle(fixture);

            stubSmallScreen(true);
            fixture.componentInstance.adaptiveMode.set("none");
            await stable(fixture);
            await openPopup(fixture);
            expect(document.querySelector("mona-dropdown-sheet")).toBeNull();
        });
    });
});

async function render<T>(component: new () => T): Promise<ComponentFixture<T>> {
    await TestBed.configureTestingModule({ imports: [component] }).compileComponents();
    const fixture = TestBed.createComponent(component);
    await stable(fixture);
    return fixture;
}

async function stable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

/** Lets the popup's open or close timers run. */
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    await stable(fixture);
    await new Promise(resolve => setTimeout(resolve, 0));
    await stable(fixture);
}

async function openPopup(fixture: ComponentFixture<unknown>): Promise<void> {
    getHost(fixture).click();
    await settle(fixture);
}

async function press(fixture: ComponentFixture<unknown>, key: string): Promise<void> {
    getHost(fixture).dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
    await stable(fixture);
}

function pressIn(element: HTMLElement, key: string): void {
    element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
}

function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement.querySelector("mona-dropdown-tree") as HTMLElement;
}

function getNodes(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>(".cdk-overlay-container [role='treeitem']"));
}

function nodeText(node: HTMLElement): string {
    return node.querySelector("mona-tree-node")?.textContent?.trim() ?? "";
}

function getNode(text: string): HTMLElement {
    const node = getNodes().find(candidate => nodeText(candidate) === text);
    if (!node) {
        throw new Error(`Node not found: ${text}`);
    }
    return node;
}

function clickNode(text: string): void {
    (getNode(text).querySelector("mona-tree-node > div") as HTMLElement).click();
}

function stubSmallScreen(matches: boolean): void {
    vi.stubGlobal(
        "matchMedia",
        vi.fn((query: string) => ({
            addEventListener: vi.fn(),
            matches,
            media: query,
            removeEventListener: vi.fn()
        }))
    );
}

function clearOverlays(): void {
    document.querySelectorAll(".cdk-overlay-container").forEach(container => container.replaceChildren());
}
