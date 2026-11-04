import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { ListViewComponent } from "../components/list-view/list-view.component";
import { ListViewFooterTemplateDirective } from "../directives/list-view-footer-template.directive";
import { ListViewGroupableDirective } from "../directives/list-view-groupable.directive";
import { ListViewHeaderTemplateDirective } from "../directives/list-view-header-template.directive";
import { ListViewItemTemplateDirective } from "../directives/list-view-item-template.directive";
import { ListViewPageableDirective } from "../directives/list-view-pageable.directive";
import { ListViewSelectableDirective } from "../directives/list-view-selectable.directive";
import { ListViewVirtualScrollDirective } from "../directives/list-view-virtual-scroll.directive";

interface Fruit {
    readonly id: number;
    readonly kind: string;
    readonly name: string;
}

const FRUITS: Fruit[] = [
    { id: 1, kind: "Berry", name: "Apple" },
    { id: 2, kind: "Berry", name: "Banana" },
    { id: 3, kind: "Citrus", name: "Cherry" },
    { id: 4, kind: "Citrus", name: "Date" },
    { id: 5, kind: "Citrus", name: "Elderberry" }
];

@Component({
    imports: [ListViewComponent, ListViewHeaderTemplateDirective, ListViewItemTemplateDirective],
    template: `
        <mona-list-view aria-label="Fruits" [items]="items()" [textField]="'name'" [height]="''">
            <ng-template monaListViewHeaderTemplate>
                <input aria-label="Search" class="search" />
            </ng-template>
            <ng-template monaListViewItemTemplate let-fruit>
                <span>{{ fruit.name }}</span>
                <button type="button" (click)="pressed.push(fruit.name)">Open {{ fruit.name }}</button>
            </ng-template>
        </mona-list-view>
    `
})
class TemplatesHostComponent {
    public readonly items = signal(FRUITS);
    public readonly pressed: string[] = [];
}

@Component({
    imports: [ListViewComponent, ListViewSelectableDirective, ListViewGroupableDirective],
    template: `
        <span id="fruit-label">Fruit</span>
        <mona-list-view
            aria-labelledby="fruit-label"
            [items]="items()"
            [textField]="'name'"
            [height]="''"
            [loading]="loading()"
            [monaListViewSelectable]="selectable()"
            [monaListViewGroupable]="grouped() ? '' : { enabled: false }"
            [groupBy]="'kind'"></mona-list-view>
    `
})
class PlainHostComponent {
    public readonly grouped = signal(false);
    public readonly items = signal(FRUITS);
    public readonly loading = signal(false);
    public readonly selectable = signal<{ enabled: boolean }>({ enabled: false });
}

@Component({
    imports: [ListViewComponent, ListViewSelectableDirective, ListViewPageableDirective],
    template: `
        <mona-list-view
            aria-label="Fruits"
            [items]="items"
            [textField]="'name'"
            [height]="''"
            monaListViewSelectable
            [selectBy]="'id'"
            [selectedKeys]="[2]"
            [monaListViewPageable]="{ pageSize: 2 }"
            [(page)]="page"></mona-list-view>
        <mona-list-view
            aria-label="Vegetables"
            [items]="items"
            [textField]="'name'"
            [height]="''"
            [pagerAriaLabel]="pagerName()"
            [monaListViewPageable]="{ pageSize: 2 }"></mona-list-view>
    `
})
class PagedHostComponent {
    public readonly items = FRUITS;
    public readonly page = signal(1);
    public readonly pagerName = signal("");
}

@Component({
    imports: [ListViewComponent, ListViewSelectableDirective, ListViewVirtualScrollDirective],
    template: `
        <mona-list-view
            aria-label="Numbers"
            [items]="items"
            [height]="140"
            monaListViewSelectable
            [monaListViewVirtualScroll]="{ enabled: true, height: 28 }"></mona-list-view>
    `
})
class VirtualHostComponent {
    public readonly items = Array.from({ length: 200 }, (_, index) => `Item ${index + 1}`);
}

@Component({
    imports: [ListViewComponent, ListViewFooterTemplateDirective],
    template: `
        <mona-list-view aria-label="Nothing" [items]="[]" [height]="''">
            <ng-template monaListViewFooterTemplate><button type="button">More</button></ng-template>
        </mona-list-view>
    `
})
class EmptyHostComponent {}

const AXE_OPTIONS: axe.RunOptions = {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
};

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

async function violations(fixture: ComponentFixture<unknown>): Promise<string[]> {
    const results = await axe.run(fixture.nativeElement as HTMLElement, AXE_OPTIONS);
    // Rules that passed show the run reached the list; an empty run would also have no violations.
    expect(results.passes.some(rule => rule.id.startsWith("aria-") || rule.id.startsWith("list"))).toBe(true);
    return results.violations.map(
        violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(" ")).join(", ")}`
    );
}

function keydown(target: Element, key: string): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key });
    target.dispatchEvent(event);
    return event;
}

function items(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>("mona-list li[data-uid]"));
}

describe("list view accessibility", () => {
    describe("controls in templates", () => {
        let fixture: ComponentFixture<TemplatesHostComponent>;
        let root: HTMLElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(TemplatesHostComponent);
            document.body.appendChild(fixture.nativeElement as HTMLElement);
            root = fixture.nativeElement as HTMLElement;
            await settle(fixture);
        });

        afterEach(() => (fixture.nativeElement as HTMLElement).remove());

        it("leaves keys typed into a header input to the input", () => {
            const search = root.querySelector(".search") as HTMLInputElement;
            for (const key of ["a", " ", "ArrowDown", "Enter", "End"]) {
                expect(keydown(search, key).defaultPrevented).toBe(false);
            }
        });

        it("lets Enter press a button in an item", () => {
            const button = root.querySelector("li[data-uid] button") as HTMLButtonElement;
            expect(keydown(button, "Enter").defaultPrevented).toBe(false);
        });

        it("is a list, so controls in its items aren't nested in options", async () => {
            expect(root.querySelector("mona-list > ul")?.getAttribute("role")).toBe("list");
            expect(items(root)[0].getAttribute("role")).toBe("listitem");
            expect(items(root)[0].hasAttribute("aria-selected")).toBe(false);
            expect(await violations(fixture)).toEqual([]);
        });

        it("moves between items with the arrow keys without the navigable directive", async () => {
            const [first, second] = items(root);
            first.focus();
            expect(keydown(first, "ArrowDown").defaultPrevented).toBe(true);
            await settle(fixture);
            expect(document.activeElement).toBe(second);
        });
    });

    describe("roles, names and states", () => {
        let fixture: ComponentFixture<PlainHostComponent>;
        let host: PlainHostComponent;
        let root: HTMLElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(PlainHostComponent);
            document.body.appendChild(fixture.nativeElement as HTMLElement);
            host = fixture.componentInstance;
            root = fixture.nativeElement as HTMLElement;
            await settle(fixture);
        });

        afterEach(() => (fixture.nativeElement as HTMLElement).remove());

        it("names the list by aria-labelledby and keeps the name off the host", async () => {
            const list = root.querySelector("mona-list > ul");
            expect(list?.getAttribute("aria-labelledby")).toBe("fruit-label");
            expect(root.querySelector("mona-list-view")?.hasAttribute("aria-labelledby")).toBe(false);
            expect(await violations(fixture)).toEqual([]);
        });

        it("is a listbox of options once selectable", async () => {
            host.selectable.set({ enabled: true });
            await settle(fixture);

            expect(root.querySelector("mona-list > ul")?.getAttribute("role")).toBe("listbox");
            expect(items(root)[0].getAttribute("role")).toBe("option");
            expect(items(root)[0].getAttribute("aria-selected")).toBe("false");
            expect(await violations(fixture)).toEqual([]);
        });

        it("puts grouped options in groups named by their headers", async () => {
            host.selectable.set({ enabled: true });
            host.grouped.set(true);
            await settle(fixture);

            const groups = Array.from(root.querySelectorAll("ul[role='group']"));
            expect(
                groups.map(group =>
                    document.getElementById(group.getAttribute("aria-labelledby") ?? "")?.textContent?.trim()
                )
            ).toEqual(["Berry", "Citrus"]);
            expect(groups[1].querySelectorAll("li[role='option']").length).toBe(3);
            expect(items(root)[0].hasAttribute("aria-describedby")).toBe(false);
            expect(await violations(fixture)).toEqual([]);
        });

        it("puts grouped items of a plain list in nested lists", async () => {
            host.grouped.set(true);
            await settle(fixture);

            expect(root.querySelectorAll("li > ul[role='list'][aria-labelledby]").length).toBe(2);
            expect(await violations(fixture)).toEqual([]);
        });

        it("reports loading and an empty list in a polite status", async () => {
            const status = root.querySelector("[role='status']");
            expect(status?.textContent?.trim()).toBe("");

            host.loading.set(true);
            await settle(fixture);
            expect(root.querySelector("mona-list > ul")?.getAttribute("aria-busy")).toBe("true");
            expect(status?.textContent?.trim()).toBe("Loading");

            host.loading.set(false);
            host.items.set([]);
            await settle(fixture);
            expect(status?.textContent?.trim()).toBe("No data");
        });

        it("moves focus to the next item when the focused one is removed", async () => {
            const [, second] = items(root);
            second.focus();
            await settle(fixture);

            host.items.set(FRUITS.filter(fruit => fruit.id !== 2));
            await settle(fixture);

            expect(document.activeElement?.textContent?.trim()).toBe("Cherry");
        });
    });

    describe("paging", () => {
        let fixture: ComponentFixture<PagedHostComponent>;
        let root: HTMLElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(PagedHostComponent);
            root = fixture.nativeElement as HTMLElement;
            await settle(fixture);
        });

        it("names each pager after its list", async () => {
            const pagers = Array.from(
                root.querySelectorAll("mona-pager [role='navigation'], mona-pager[role='navigation']")
            );
            expect(pagers.map(pager => pager.getAttribute("aria-label"))).toEqual([
                "Fruits pagination",
                "Vegetables pagination"
            ]);
            expect(await violations(fixture)).toEqual([]);

            fixture.componentInstance.pagerName.set("Vegetable pages");
            await settle(fixture);
            expect(pagers[1].getAttribute("aria-label")).toBe("Vegetable pages");
        });

        it("keeps a Tab stop when the selected item is on another page", async () => {
            fixture.componentInstance.page.set(2);
            await settle(fixture);

            const fruits = root.querySelectorAll("mona-list-view")[0];
            const tabStops = Array.from(fruits.querySelectorAll("mona-list [tabindex='0'], mona-list[tabindex='0']"));
            expect(tabStops.map(element => element.textContent?.trim())).toEqual(["Cherry"]);
        });
    });

    it("has no axe violations when virtual", async () => {
        const fixture = TestBed.createComponent(VirtualHostComponent);
        await settle(fixture);
        expect(await violations(fixture)).toEqual([]);
    });

    it("has no axe violations when empty", async () => {
        const fixture = TestBed.createComponent(EmptyHostComponent);
        await settle(fixture);
        const results = await axe.run(fixture.nativeElement as HTMLElement, AXE_OPTIONS);
        expect(results.violations.map(violation => violation.id)).toEqual([]);
        expect((fixture.nativeElement as HTMLElement).querySelector("[role='status']")?.textContent?.trim()).toBe(
            "No data"
        );
    });
});
