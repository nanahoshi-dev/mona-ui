import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { groupBy } from "@mirei/ts-collections";
import { Subject } from "rxjs";
import { PopupDataInjectionToken } from "@mirei/mona-ui/popup";
import { PopupMenuItem } from "../../models/PopupMenuItem";
import { PopupMenuItemClickEvent } from "../../models/PopupMenuItemClickEvent";
import { PopupMenuListConfig } from "../../models/PopupMenuListConfig";
import { PopupMenuListComponent } from "./popup-menu-list.component";

const createItem = (overrides: Partial<PopupMenuItem> & { label: string; uid: string }): PopupMenuItem => ({
    disabled: false,
    group: Symbol(),
    groupTemplate: null,
    iconTemplate: null,
    items: [],
    shortcutTemplate: null,
    textTemplate: null,
    ...overrides
});

const createConfig = (menuItems: PopupMenuItem[]): PopupMenuListConfig => ({
    isRoot: true,
    items: groupBy(menuItems, i => i.group).toArray(),
    level: 0,
    menuId: "menu-1",
    menuItemClick$: new Subject(),
    minWidth: signal(null),
    navigate$: new Subject(),
    parentClose$: new Subject(),
    popupGroupTemplate: signal(null),
    popupIconTemplate: signal(null),
    popupShortcutTemplate: signal(null),
    popupTextTemplate: signal(null),
    rounded: signal("medium"),
    size: signal("medium"),
    width: signal(null)
});

async function setup(menuItems: PopupMenuItem[]): Promise<ComponentFixture<PopupMenuListComponent>> {
    await TestBed.configureTestingModule({
        imports: [PopupMenuListComponent],
        providers: [{ provide: PopupDataInjectionToken, useValue: createConfig(menuItems) }, provideNoopAnimations()]
    }).compileComponents();

    const fixture = TestBed.createComponent(PopupMenuListComponent);
    fixture.detectChanges();
    return fixture;
}

const menuElement = (fixture: ComponentFixture<PopupMenuListComponent>): HTMLElement =>
    fixture.nativeElement.querySelector('[role="menu"]');

const dispatchKey = (fixture: ComponentFixture<PopupMenuListComponent>, key: string): KeyboardEvent => {
    const event = new KeyboardEvent("keydown", { key, cancelable: true, bubbles: true });
    menuElement(fixture).dispatchEvent(event);
    fixture.detectChanges();
    return event;
};

describe("PopupMenuListComponent", () => {
    let items: PopupMenuItem[];

    beforeEach(() => {
        TestBed.resetTestingModule();
        items = [
            createItem({ label: "First", uid: "item-1" }),
            createItem({ label: "Second", uid: "item-2" }),
            createItem({ label: "Third", uid: "item-3" })
        ];
    });

    it("should create", async () => {
        const fixture = await setup(items);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it("ArrowDown selects the first item, then advances and wraps", async () => {
        const fixture = await setup(items);
        const component = fixture.componentInstance as any;

        dispatchKey(fixture, "ArrowDown");
        expect(component.activeMenuItem()).toBe(items[0]);

        dispatchKey(fixture, "ArrowDown");
        expect(component.activeMenuItem()).toBe(items[1]);

        dispatchKey(fixture, "ArrowDown");
        expect(component.activeMenuItem()).toBe(items[2]);

        dispatchKey(fixture, "ArrowDown");
        expect(component.activeMenuItem()).toBe(items[0]);
    });

    it("ArrowUp selects the last item when nothing is active, then moves backward", async () => {
        const fixture = await setup(items);
        const component = fixture.componentInstance as any;

        dispatchKey(fixture, "ArrowUp");
        expect(component.activeMenuItem()).toBe(items[2]);

        dispatchKey(fixture, "ArrowUp");
        expect(component.activeMenuItem()).toBe(items[1]);
    });

    it("Home selects the first item and End selects the last item", async () => {
        const fixture = await setup(items);
        const component = fixture.componentInstance as any;

        dispatchKey(fixture, "ArrowDown");
        dispatchKey(fixture, "End");
        expect(component.activeMenuItem()).toBe(items[2]);

        dispatchKey(fixture, "Home");
        expect(component.activeMenuItem()).toBe(items[0]);
    });

    it("Enter activates the active leaf item via its click$ subject", async () => {
        const click$ = new Subject<PopupMenuItemClickEvent>();
        items[0].click$ = click$;
        const fixture = await setup(items);
        const clickEvents: PopupMenuItemClickEvent[] = [];
        click$.subscribe(e => clickEvents.push(e));

        dispatchKey(fixture, "ArrowDown");
        dispatchKey(fixture, "Enter");

        expect(clickEvents.length).toBe(1);
        expect(clickEvents[0].item).toBe(items[0]);
    });

    it("typeahead cycles through items that start with the typed letter", async () => {
        const typeaheadItems = [
            createItem({ label: "Apple", uid: "a-1" }),
            createItem({ label: "Apricot", uid: "a-2" }),
            createItem({ label: "Banana", uid: "b-1" })
        ];
        const fixture = await setup(typeaheadItems);
        const component = fixture.componentInstance as any;

        dispatchKey(fixture, "a");

        expect(component.activeMenuItem()).toBe(typeaheadItems[0]);
    });

    it("Escape closes an open submenu popup reference", async () => {
        const fixture = await setup(items);
        const component = fixture.componentInstance as any;
        const closeSpy = vi.fn();
        component.popupRef = { close: closeSpy };

        dispatchKey(fixture, "Escape");

        expect(closeSpy).toHaveBeenCalled();
        expect(component.popupRef).toBeNull();
    });

    it("renders aria-activedescendant pointing at a real element id in the DOM (regression for C-1)", async () => {
        const fixture = await setup(items);

        dispatchKey(fixture, "ArrowDown");

        const activeId = menuElement(fixture).getAttribute("aria-activedescendant");
        expect(activeId).toBeTruthy();
        expect(fixture.nativeElement.querySelector(`[id="${activeId}"]`)).not.toBeNull();
    });

    it("does not prevent default behavior for keys it does not handle, e.g. Tab (regression for C-2)", async () => {
        const fixture = await setup(items);
        const event = dispatchKey(fixture, "Tab");
        expect(event.defaultPrevented).toBe(false);
    });

    it("prevents default behavior for handled navigation keys", async () => {
        const fixture = await setup(items);
        const event = dispatchKey(fixture, "ArrowDown");
        expect(event.defaultPrevented).toBe(true);
    });
});
