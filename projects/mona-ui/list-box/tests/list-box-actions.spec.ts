import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { ListBoxComponent } from "../components/list-box/list-box.component";
import type { ListBoxActionEvent } from "../models/ListBoxActionClickEvent";
import type { ListBoxSelectionEvent } from "../models/ListBoxSelectionEvent";

interface Food {
    readonly id: number;
    readonly name: string;
}

const FOODS: Food[] = [
    { id: 1, name: "Apple" },
    { id: 2, name: "Bread" },
    { id: 3, name: "Cheese" },
    { id: 4, name: "Dates" }
];

type Side = "first" | "second";

@Component({
    imports: [ListBoxComponent],
    template: `
        <mona-list-box
            aria-label="Available"
            [items]="first()"
            textField="name"
            selectBy="id"
            [selectionMode]="mode()"
            [selectedKeys]="firstKeys()"
            [connectedList]="second"
            (actionClick)="onAction($event, 'first')"
            (selectedKeysChange)="keyEvents.push(['first', $event])"
            (selectionChange)="selectionEvents.push(['first', $event])"></mona-list-box>
        <mona-list-box
            #second
            aria-label="Chosen"
            [items]="secondItems()"
            textField="name"
            selectBy="id"
            [toolbar]="false"
            (actionClick)="onAction($event, 'second')"
            (selectedKeysChange)="keyEvents.push(['second', $event])"
            (selectionChange)="selectionEvents.push(['second', $event])"></mona-list-box>
    `
})
class HostComponent {
    public readonly actions: Array<[Side, string, string[]]> = [];
    public readonly first = signal<Food[]>(FOODS);
    public readonly firstKeys = signal<number[]>([]);
    public readonly keyEvents: Array<[Side, unknown[]]> = [];
    public readonly mode = signal<"multiple" | "single">("single");
    public readonly secondItems = signal<Food[]>([{ id: 9, name: "Xigua" }]);
    public readonly selectionEvents: Array<[Side, ListBoxSelectionEvent<Food>]> = [];

    public onAction(event: ListBoxActionEvent<Food>, side: Side): void {
        const names = event.selectedItems.map(item => item.name);
        this.actions.push([side, event.action, names]);
        const ids = new Set(event.selectedItems.map(item => item.id));
        if (event.action === "transferTo" || event.action === "transferAllTo") {
            this.secondItems.update(items => [...items, ...event.selectedItems]);
            this.first.update(items => items.filter(item => !ids.has(item.id)));
        } else if (event.action === "transferFrom" || event.action === "transferAllFrom") {
            this.first.update(items => [...items, ...event.selectedItems]);
            this.secondItems.update(items => items.filter(item => !ids.has(item.id)));
        }
    }
}

describe("list box actions", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let root: HTMLElement;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function box(label: "Available" | "Chosen"): HTMLElement {
        // By position: an empty list box renders no list element to find by name.
        return root.querySelectorAll<HTMLElement>("mona-list-box")[label === "Available" ? 0 : 1];
    }

    function names(label: "Available" | "Chosen"): string[] {
        return Array.from(box(label).querySelectorAll("li[role='option']")).map(item => item.textContent?.trim() ?? "");
    }

    async function select(label: "Available" | "Chosen", name: string): Promise<void> {
        const item = Array.from(box(label).querySelectorAll<HTMLElement>("li[role='option']")).find(
            option => option.textContent?.trim() === name
        );
        item?.click();
        await settle();
    }

    function button(name: string): HTMLButtonElement {
        return root.querySelector(`button[aria-label='${name}']`) as HTMLButtonElement;
    }

    async function press(name: string): Promise<void> {
        button(name).click();
        await settle();
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        await settle();
    });

    describe("transfers", () => {
        it("moves the selection to the connected list box, where it stays selected", async () => {
            await select("Available", "Bread");
            host.keyEvents.length = 0;
            host.selectionEvents.length = 0;

            await press("Transfer to Chosen");

            expect(host.actions).toEqual([["first", "transferTo", ["Bread"]]]);
            expect(names("Chosen")).toEqual(["Xigua", "Bread"]);
            expect(host.keyEvents).toEqual([
                ["first", []],
                ["second", [2]]
            ]);
            expect(host.selectionEvents).toEqual([
                ["first", { deselectedItems: [FOODS[1]], selectedItems: [] }],
                ["second", { deselectedItems: [], selectedItems: [FOODS[1]] }]
            ]);
        });

        it("transfers every item of this list box for Transfer All To, wherever the selection is", async () => {
            await select("Chosen", "Xigua");
            await press("Transfer all to Chosen");

            expect(host.actions).toEqual([["first", "transferAllTo", ["Apple", "Bread", "Cheese", "Dates"]]]);
            expect(names("Available")).toEqual([]);
            expect(names("Chosen")).toEqual(["Xigua", "Apple", "Bread", "Cheese", "Dates"]);
        });

        it("transfers every item of the connected list box for Transfer All From, on that list box", async () => {
            await select("Available", "Apple");
            await press("Transfer all from Chosen");

            expect(host.actions).toEqual([["second", "transferAllFrom", ["Xigua"]]]);
            expect(names("Chosen")).toEqual([]);
        });

        it("transfers the connected list box's selection for Transfer From", async () => {
            await select("Chosen", "Xigua");
            await press("Transfer from Chosen");

            expect(host.actions).toEqual([["second", "transferFrom", ["Xigua"]]]);
            expect(names("Available")).toContain("Xigua");
        });
    });

    describe("moves", () => {
        it("uses list order for a selection made out of order, and stops at the edges", async () => {
            host.mode.set("multiple");
            host.firstKeys.set([3, 1]);
            await settle();

            expect(button("Move Up").disabled).toBe(true);
            expect(button("Move Down").disabled).toBe(false);

            await press("Move Down");
            const [event] = host.actions;
            expect(event).toEqual(["first", "moveDown", ["Apple", "Cheese"]]);
        });

        it("reports the indices of a multi-selection in list order", async () => {
            host.mode.set("multiple");
            host.firstKeys.set([3, 1]);
            await settle();
            const component = fixture.debugElement.children[0].componentInstance as ListBoxComponent<Food, number>;
            const events: ListBoxActionEvent<Food>[] = [];
            component.actionClick.subscribe(event => events.push(event));

            await press("Move Down");

            const move = events[0];
            expect(move.action).toBe("moveDown");
            if (move.action === "moveDown") {
                expect(move.selectedIndices).toEqual([0, 2]);
                expect(move.oldIndex).toBe(0);
                expect(move.newIndex).toBe(3);
            }
        });

        it("disables Move Down when the selection is at the end", async () => {
            await select("Available", "Dates");
            expect(button("Move Down").disabled).toBe(true);
            expect(button("Move Up").disabled).toBe(false);
        });
    });

    describe("selection events", () => {
        it("doesn't report keys set from code", async () => {
            host.firstKeys.set([2]);
            await settle();

            expect(host.keyEvents).toEqual([]);
            expect(host.selectionEvents).toEqual([]);
        });

        it("reports Clear Selection through both outputs", async () => {
            await select("Available", "Cheese");
            host.keyEvents.length = 0;

            await press("Clear Selection");

            expect(host.keyEvents).toEqual([["first", []]]);
        });

        it("reports the selection a choice in the connected list box clears", async () => {
            await select("Available", "Cheese");
            host.keyEvents.length = 0;
            host.selectionEvents.length = 0;

            await select("Chosen", "Xigua");

            expect(host.keyEvents).toEqual(
                expect.arrayContaining([
                    ["second", [9]],
                    ["first", []]
                ])
            );
            expect(host.selectionEvents).toContainEqual(["first", { deselectedItems: [FOODS[2]], selectedItems: [] }]);
        });

        it("reports the selected item once when the user picks it", async () => {
            await select("Available", "Apple");

            expect(host.keyEvents).toEqual([["first", [1]]]);
            expect(host.selectionEvents).toEqual([["first", { deselectedItems: [], selectedItems: [FOODS[0]] }]]);
        });
    });
});
