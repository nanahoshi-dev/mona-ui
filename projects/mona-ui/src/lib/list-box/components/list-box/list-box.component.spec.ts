import { Component, computed, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ButtonDirective } from "../../../buttons/button/directives/button.directive";
import { SelectionMode } from "../../../models/SelectionMode";
import { ListBoxActionEvent } from "../../models/ListBoxActionClickEvent";
import { ListBoxMoveEvent } from "../../models/ListBoxMoveEvent";
import { ListBoxSelectionEvent } from "../../models/ListBoxSelectionEvent";
import { ListBoxTransferEvent } from "../../models/ListBoxTransferEvent";
import { ToolbarOptions } from "../../models/ToolbarOptions";

import { ListBoxComponent } from "./list-box.component";

interface Item {
    id: number;
    text: string;
}

describe("ListBoxComponent", () => {
    let component: ListBoxComponent;
    let fixture: ComponentFixture<ListBoxComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ListBoxComponent, ButtonDirective]
        });
        fixture = TestBed.createComponent(ListBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});

/**
 * The selection-change notifier pipeline (`createSelectedChangeNotifier`) uses an rxjs `delay(0)`
 * macrotask, which `fixture.whenStable()` alone does not wait for. Flushing a real macrotask after
 * `whenStable()` lets that pipeline settle before assertions run.
 */
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();
}

function clickItemByText(host: HTMLElement, text: string): void {
    const items = Array.from(host.querySelectorAll("li[monaListItem]"));
    const item = items.find(li => li.textContent?.trim() === text);
    if (!item) {
        throw new Error(`Could not find list item with text "${text}"`);
    }
    (item as HTMLElement).click();
}

function clickToolbarButton(host: HTMLElement, ariaLabel: string): void {
    const button = host.querySelector(`button[aria-label="${ariaLabel}"]`) as HTMLButtonElement | null;
    if (!button) {
        throw new Error(`Could not find toolbar button with aria-label "${ariaLabel}"`);
    }
    button.click();
}

@Component({
    selector: "app-list-box-harness",
    imports: [ListBoxComponent],
    template: `
        <mona-list-box
            #first
            [items]="firstItems()"
            [selectBy]="'id'"
            [textField]="'text'"
            [selectionMode]="selectionMode()"
            [selectedKeys]="firstSelectedKeys()"
            [toolbar]="toolbar()"
            [connectedList]="connectedList()"
            (actionClick)="onActionClick($event)"
            (selectionChange)="onSelectionChange($event)"
            (selectedKeysChange)="onSelectedKeysChange($event)"></mona-list-box>
        <mona-list-box #second [items]="secondItems()" [selectBy]="'id'" [textField]="'text'"></mona-list-box>
        <mona-list-box #third [items]="thirdItems()" [selectBy]="'id'" [textField]="'text'"></mona-list-box>
    `
})
class ListBoxHarnessComponent {
    protected readonly first = viewChild.required<ListBoxComponent<Item, number>>("first");
    protected readonly firstItems = signal<Item[]>([
        { id: 1, text: "A" },
        { id: 2, text: "B" },
        { id: 3, text: "C" }
    ]);
    protected readonly firstSelectedKeys = signal<number[]>([]);
    protected readonly second = viewChild<ListBoxComponent<Item, number>>("second");
    protected readonly secondItems = signal<Item[]>([{ id: 10, text: "X" }]);
    protected readonly selectionMode = signal<SelectionMode>("single");
    protected readonly third = viewChild<ListBoxComponent<Item, number>>("third");
    protected readonly thirdItems = signal<Item[]>([{ id: 20, text: "Y" }]);
    protected readonly toolbar = signal<boolean | Partial<ToolbarOptions>>(true);
    protected readonly useThirdAsConnectedList = signal(false);
    protected readonly connectedList = computed(() =>
        this.useThirdAsConnectedList() ? (this.third() ?? null) : (this.second() ?? null)
    );

    public readonly actionEvents: ListBoxActionEvent<Item>[] = [];
    public readonly selectedKeysChangeEvents: number[][] = [];
    public readonly selectionChangeEvents: ListBoxSelectionEvent<Item>[] = [];

    protected onActionClick(event: ListBoxActionEvent<Item>): void {
        this.actionEvents.push(event);
    }

    protected onSelectedKeysChange(keys: number[]): void {
        this.selectedKeysChangeEvents.push(keys);
    }

    protected onSelectionChange(event: ListBoxSelectionEvent<Item>): void {
        this.selectionChangeEvents.push(event);
    }
}

describe("ListBoxComponent behavior", () => {
    let fixture: ComponentFixture<ListBoxHarnessComponent>;
    let harness: ListBoxHarnessComponent;
    let hostElement: HTMLElement;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [ListBoxHarnessComponent]
        });
        fixture = TestBed.createComponent(ListBoxHarnessComponent);
        harness = fixture.componentInstance;
        hostElement = fixture.nativeElement;
        await settle(fixture);
    });

    function firstListBoxHost(): HTMLElement {
        return hostElement.querySelectorAll("mona-list-box")[0] as HTMLElement;
    }

    it("emits selectionChange and selectedKeysChange when an item is clicked", async () => {
        clickItemByText(firstListBoxHost(), "A");
        await settle(fixture);

        expect(harness.selectedKeysChangeEvents.at(-1)).toEqual([1]);
        expect(harness.selectionChangeEvents.at(-1)).toEqual({
            selectedItems: [{ id: 1, text: "A" }],
            deselectedItems: []
        });
    });

    it("does not move the selected item up past the start of the list", async () => {
        harness["firstSelectedKeys"].set([1]);
        await settle(fixture);

        clickToolbarButton(hostElement, "Move Up");
        await settle(fixture);

        expect(harness.actionEvents.length).toBe(0);
    });

    it("emits a ListBoxMoveEvent with the correct indices when moving down", async () => {
        harness["firstSelectedKeys"].set([1]);
        await settle(fixture);

        clickToolbarButton(hostElement, "Move Down");
        await settle(fixture);

        expect(harness.actionEvents.length).toBe(1);
        const event = harness.actionEvents[0] as ListBoxMoveEvent<Item>;
        expect(event.action).toBe("moveDown");
        expect(event.oldIndex).toBe(0);
        expect(event.newIndex).toBe(1);
        expect(event.selectedItems).toEqual([{ id: 1, text: "A" }]);
    });

    it("emits a cancellable ListBoxTransferEvent on transferTo and clears both selections unless prevented", async () => {
        harness["firstSelectedKeys"].set([1]);
        await settle(fixture);

        clickToolbarButton(hostElement, "Transfer To");
        await settle(fixture);

        expect(harness.actionEvents.length).toBe(1);
        const event = harness.actionEvents[0] as ListBoxTransferEvent<Item>;
        expect(event.action).toBe("transferTo");
        expect(event.selectedItems).toEqual([{ id: 1, text: "A" }]);
        expect(harness["first"]().selectedItems().any()).toBe(false);
    });

    it("does not clear selection when the actionClick handler calls preventDefault()", async () => {
        harness["firstSelectedKeys"].set([1]);
        await settle(fixture);

        const first = harness["first"]();
        first.actionClick.subscribe(event => event.preventDefault());

        clickToolbarButton(hostElement, "Transfer To");
        await settle(fixture);

        expect(first.selectedItems().any()).toBe(true);
    });

    it("is a no-op when Clear Selection is clicked with nothing selected", async () => {
        clickToolbarButton(hostElement, "Clear Selection");
        await settle(fixture);

        expect(harness.actionEvents.length).toBe(0);
    });

    it("emits a ListBoxRemoveEvent when Remove is clicked with a selection", async () => {
        harness["firstSelectedKeys"].set([1]);
        await settle(fixture);

        clickToolbarButton(hostElement, "Remove");
        await settle(fixture);

        expect(harness.actionEvents.length).toBe(1);
        expect(harness.actionEvents[0].action).toBe("remove");
    });

    it("does not render the toolbar when toolbar is false", async () => {
        harness["toolbar"].set(false);
        await settle(fixture);

        expect(hostElement.querySelector("button[aria-label='Clear Selection']")).toBeNull();
    });

    it("renders no toolbar buttons when actions is an empty array", async () => {
        harness["toolbar"].set({ actions: [] });
        await settle(fixture);

        const firstHost = firstListBoxHost();
        expect(firstHost.querySelectorAll("button[monaButton]").length).toBe(0);
    });

    it("stops clearing the first list box's selection once its connectedList is swapped away", async () => {
        const first = harness["first"]();
        const listBoxHosts = () => hostElement.querySelectorAll("mona-list-box");

        // Baseline: selecting in "second" (the current connectedList) clears "first"'s selection.
        harness["firstSelectedKeys"].set([1]);
        await settle(fixture);
        expect(first.selectedItems().any()).toBe(true);

        clickItemByText(listBoxHosts()[1] as HTMLElement, "X");
        await settle(fixture);
        expect(first.selectedItems().any()).toBe(false);

        // Swap connectedList from "second" to "third".
        harness["useThirdAsConnectedList"].set(true);
        await settle(fixture);

        // Re-select in "first", then select in "second" again: the old subscription must be gone,
        // so "first"'s selection should survive.
        harness["firstSelectedKeys"].set([1]);
        await settle(fixture);
        clickItemByText(listBoxHosts()[1] as HTMLElement, "X");
        await settle(fixture);
        expect(first.selectedItems().any()).toBe(true);

        // Selecting in "third" (the new connectedList) should clear "first"'s selection.
        clickItemByText(listBoxHosts()[2] as HTMLElement, "Y");
        await settle(fixture);
        expect(first.selectedItems().any()).toBe(false);
    });
});
