import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ListService } from "../../services/list.service";

import { ListComponent } from "./list.component";

describe("ListComponent", () => {
    let component: ListComponent<any>;
    let fixture: ComponentFixture<ListComponent<any>>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ListComponent],
            providers: [ListService]
        }).compileComponents();

        fixture = TestBed.createComponent(ListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});

@Component({
    selector: "app-shift-tab-test",
    imports: [ListComponent],
    providers: [ListService],
    template: `<mona-list [data]="data" textField="name"></mona-list>`
})
class ShiftTabTestComponent {
    protected readonly data = [{ name: "one" }, { name: "two" }, { name: "three" }];
}

describe("ListComponent focus handling", () => {
    let fixture: ComponentFixture<ShiftTabTestComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ShiftTabTestComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(ShiftTabTestComponent);
        fixture.detectChanges();
    });

    it("should not steal focus back to an item when focus moves from an item back to the list host (Shift+Tab)", () => {
        const hostElement: HTMLElement = fixture.nativeElement.querySelector("mona-list");
        const firstItem = hostElement.querySelector("li[monaListItem]") as HTMLElement;

        expect(document.activeElement).toBe(firstItem);

        hostElement.focus();
        fixture.detectChanges();

        expect(document.activeElement).toBe(hostElement);
    });

    it("should exclude the list host from the Tab sequence once a focusable item exists, so Shift+Tab exits in one press", () => {
        const hostElement: HTMLElement = fixture.nativeElement.querySelector("mona-list");
        expect(hostElement.getAttribute("tabindex")).toBe("-1");
    });
});

@Component({
    selector: "app-empty-list-test",
    imports: [ListComponent],
    providers: [ListService],
    template: `<mona-list [data]="data" textField="name"></mona-list>`
})
class EmptyListTestComponent {
    protected readonly data: unknown[] = [];
}

describe("ListComponent focus handling with no focusable items", () => {
    it("should fall back to making the list host itself the single Tab stop", async () => {
        await TestBed.configureTestingModule({
            imports: [EmptyListTestComponent]
        }).compileComponents();
        const fixture = TestBed.createComponent(EmptyListTestComponent);
        fixture.detectChanges();

        const hostElement: HTMLElement = fixture.nativeElement.querySelector("mona-list");
        expect(hostElement.getAttribute("tabindex")).toBe("0");
    });
});

@Component({
    selector: "app-navigable-keydown-test",
    imports: [ListComponent],
    providers: [ListService],
    template: `<mona-list [data]="data" textField="name"></mona-list>`
})
class NavigableKeydownTestComponent {
    protected readonly data = [{ name: "one" }, { name: "two" }, { name: "three" }];
}

describe("ListComponent keydown handling with navigation enabled", () => {
    let fixture: ComponentFixture<NavigableKeydownTestComponent>;
    let listService: ListService<unknown>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NavigableKeydownTestComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(NavigableKeydownTestComponent);
        listService = fixture.debugElement.children[0].injector.get(ListService);
        listService.setNavigableOptions({ enabled: true, mode: "highlight", wrap: false });
        fixture.detectChanges();
    });

    it("should not prevent the default Tab action, so focus can still leave the list", () => {
        const hostElement: HTMLElement = fixture.nativeElement.querySelector("mona-list");
        const tabEvent = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
        hostElement.dispatchEvent(tabEvent);

        expect(tabEvent.defaultPrevented).toBe(false);
    });

    it("should not prevent the default Shift+Tab action either", () => {
        const hostElement: HTMLElement = fixture.nativeElement.querySelector("mona-list");
        const shiftTabEvent = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true });
        hostElement.dispatchEvent(shiftTabEvent);

        expect(shiftTabEvent.defaultPrevented).toBe(false);
    });

    it("should still prevent default and handle arrow-key navigation", () => {
        const hostElement: HTMLElement = fixture.nativeElement.querySelector("mona-list");
        const arrowEvent = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
        hostElement.dispatchEvent(arrowEvent);
        fixture.detectChanges();

        expect(arrowEvent.defaultPrevented).toBe(true);
        expect(listService.highlightedItem()?.data).toEqual({ name: "two" });
    });
});
