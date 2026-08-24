import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";

import { TabListComponent } from "./tab-list.component";

describe("TabListComponent", () => {
    let component: TabListComponent;
    let fixture: ComponentFixture<TabListComponent>;

    const makeTabs = () => [
        { id: "tab1", index: 0, selected: true, title: "Tab 1", closable: true, disabled: false },
        { id: "tab2", index: 1, selected: false, title: "Tab 2", closable: true, disabled: false },
        { id: "tab3", index: 2, selected: false, title: "Tab 3", closable: true, disabled: false }
    ];

    const flushAsync = () => new Promise(resolve => setTimeout(resolve, 0));

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TabListComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TabListComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput("position", "top");
        fixture.componentRef.setInput("size", "medium");
        fixture.componentRef.setInput("tabList", makeTabs());
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should navigate with ArrowRight in horizontal orientation", () => {
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        const preventDefaultSpy = vi.fn();
        fixture.debugElement.triggerEventHandler("keydown", { key: "ArrowRight", preventDefault: preventDefaultSpy });
        fixture.detectChanges();
        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));
    });

    it("should navigate with ArrowLeft in horizontal orientation", () => {
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        const preventDefaultSpy = vi.fn();
        fixture.debugElement.triggerEventHandler("keydown", { key: "ArrowLeft", preventDefault: preventDefaultSpy });
        fixture.detectChanges();
        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 2 }));
    });

    it("should navigate with Home", () => {
        fixture.componentRef.setInput("selectedTabId", "tab2");
        fixture.detectChanges();

        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        const debugElement = fixture.debugElement;
        debugElement.triggerEventHandler("keydown", { key: "Home" });
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
    });

    it("should navigate with End", () => {
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        const debugElement = fixture.debugElement;
        debugElement.triggerEventHandler("keydown", { key: "End" });
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 2 }));
    });

    it("should emit close event with Delete", () => {
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabClose, "emit");
        const debugElement = fixture.debugElement;
        debugElement.triggerEventHandler("keydown", { key: "Delete" });
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
    });

    it("should focus panel on Tab", () => {
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();

        const debugElement = fixture.debugElement;
        const preventDefaultSpy = vi.fn();

        // Mock document.getElementById
        const focusSpy = vi.fn();
        const getElementByIdSpy = vi.spyOn(document, "getElementById").mockReturnValue({ focus: focusSpy } as any);

        try {
            debugElement.triggerEventHandler("keydown", {
                key: "Tab",
                preventDefault: preventDefaultSpy,
                shiftKey: false
            });

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(getElementByIdSpy).toHaveBeenCalledWith("tab1-panel");
            expect(focusSpy).toHaveBeenCalled();
        } finally {
            getElementByIdSpy.mockRestore();
        }
    });

    it("should allow default behavior on Shift+Tab", () => {
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();

        const debugElement = fixture.debugElement;
        const preventDefaultSpy = vi.fn();

        debugElement.triggerEventHandler("keydown", {
            key: "Tab",
            preventDefault: preventDefaultSpy,
            shiftKey: true
        });

        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it("should render tab id and aria-controls with -tab/-panel suffixes", () => {
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();

        const tabElement: HTMLElement = fixture.debugElement.query(By.css("li[data-tab-id='tab1']")).nativeElement;
        expect(tabElement.id).toBe("tab1-tab");
        expect(tabElement.getAttribute("aria-controls")).toBe("tab1-panel");
    });

    it("should skip disabled tabs with ArrowRight", () => {
        fixture.componentRef.setInput("tabList", [
            { id: "tab1", index: 0, selected: true, title: "Tab 1", closable: true, disabled: false },
            { id: "tab2", index: 1, selected: false, title: "Tab 2", closable: true, disabled: true },
            { id: "tab3", index: 2, selected: false, title: "Tab 3", closable: true, disabled: false }
        ]);
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        const preventDefaultSpy = vi.fn();
        fixture.debugElement.triggerEventHandler("keydown", { key: "ArrowRight", preventDefault: preventDefaultSpy });
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 2 }));
    });

    it("should skip disabled tabs with ArrowLeft", () => {
        fixture.componentRef.setInput("tabList", [
            { id: "tab1", index: 0, selected: false, title: "Tab 1", closable: true, disabled: false },
            { id: "tab2", index: 1, selected: false, title: "Tab 2", closable: true, disabled: true },
            { id: "tab3", index: 2, selected: true, title: "Tab 3", closable: true, disabled: false }
        ]);
        fixture.componentRef.setInput("selectedTabId", "tab3");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        const preventDefaultSpy = vi.fn();
        fixture.debugElement.triggerEventHandler("keydown", { key: "ArrowLeft", preventDefault: preventDefaultSpy });
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
    });

    it("should skip a disabled tab at Home", () => {
        fixture.componentRef.setInput("tabList", [
            { id: "tab1", index: 0, selected: false, title: "Tab 1", closable: true, disabled: true },
            { id: "tab2", index: 1, selected: false, title: "Tab 2", closable: true, disabled: false },
            { id: "tab3", index: 2, selected: true, title: "Tab 3", closable: true, disabled: false }
        ]);
        fixture.componentRef.setInput("selectedTabId", "tab3");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        fixture.debugElement.triggerEventHandler("keydown", { key: "Home" });
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));
    });

    it("should skip a disabled tab at End", () => {
        fixture.componentRef.setInput("tabList", [
            { id: "tab1", index: 0, selected: true, title: "Tab 1", closable: true, disabled: false },
            { id: "tab2", index: 1, selected: false, title: "Tab 2", closable: true, disabled: false },
            { id: "tab3", index: 2, selected: false, title: "Tab 3", closable: true, disabled: true }
        ]);
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        fixture.debugElement.triggerEventHandler("keydown", { key: "End" });
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));
    });

    it("should not close a disabled tab with Delete", () => {
        fixture.componentRef.setInput("tabList", [
            { id: "tab1", index: 0, selected: true, title: "Tab 1", closable: true, disabled: true },
            { id: "tab2", index: 1, selected: false, title: "Tab 2", closable: true, disabled: false }
        ]);
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabClose, "emit");
        fixture.debugElement.triggerEventHandler("keydown", { key: "Delete" });
        fixture.detectChanges();
        expect(emitSpy).not.toHaveBeenCalled();
    });

    it("should not emit any selection when every tab is disabled", () => {
        fixture.componentRef.setInput("tabList", [
            { id: "tab1", index: 0, selected: true, title: "Tab 1", closable: true, disabled: true },
            { id: "tab2", index: 1, selected: false, title: "Tab 2", closable: true, disabled: true }
        ]);
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        fixture.debugElement.triggerEventHandler("keydown", { key: "ArrowRight" });
        fixture.debugElement.triggerEventHandler("keydown", { key: "Home" });
        fixture.debugElement.triggerEventHandler("keydown", { key: "End" });
        fixture.detectChanges();
        expect(emitSpy).not.toHaveBeenCalled();
    });

    it("should no-op keyboard navigation when the list-wide disabled input is set", () => {
        fixture.componentRef.setInput("disabled", true);
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();

        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        fixture.debugElement.triggerEventHandler("keydown", { key: "ArrowRight", preventDefault: vi.fn() });
        fixture.detectChanges();
        expect(emitSpy).not.toHaveBeenCalled();

        const tabElement: HTMLElement = fixture.debugElement.query(By.css("li[data-tab-id='tab1']")).nativeElement;
        expect(tabElement.getAttribute("aria-disabled")).toBe("true");
    });

    it("should show the close button when closable is true regardless of per-tab closable value", () => {
        fixture.componentRef.setInput("closable", true);
        fixture.componentRef.setInput("tabList", [
            { id: "tab1", index: 0, selected: true, title: "Tab 1", closable: false, disabled: false }
        ]);
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();

        const closeButton = fixture.debugElement.query(By.css("li[data-tab-id='tab1'] button"));
        expect(closeButton).toBeTruthy();
    });

    describe("orientation", () => {
        it("should expose a horizontal orientation for top position", () => {
            const ul = fixture.debugElement.query(By.css("ul[role='tablist']")).nativeElement;
            expect(ul.getAttribute("aria-orientation")).toBe("horizontal");
        });

        it("should expose a vertical orientation for left position", () => {
            fixture.componentRef.setInput("position", "left");
            fixture.detectChanges();
            const ul = fixture.debugElement.query(By.css("ul[role='tablist']")).nativeElement;
            expect(ul.getAttribute("aria-orientation")).toBe("vertical");
        });

        it("should expose a vertical orientation for right position", () => {
            fixture.componentRef.setInput("position", "right");
            fixture.detectChanges();
            const ul = fixture.debugElement.query(By.css("ul[role='tablist']")).nativeElement;
            expect(ul.getAttribute("aria-orientation")).toBe("vertical");
        });

        it("should navigate with ArrowDown and prevent default in vertical orientation", () => {
            fixture.componentRef.setInput("position", "left");
            fixture.componentRef.setInput("selectedTabId", "tab1");
            fixture.detectChanges();
            const emitSpy = vi.spyOn(component.tabSelect, "emit");
            const preventDefaultSpy = vi.fn();
            fixture.debugElement.triggerEventHandler("keydown", { key: "ArrowDown", preventDefault: preventDefaultSpy });
            fixture.detectChanges();
            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));
        });

        it("should navigate with ArrowUp and prevent default in vertical orientation", () => {
            fixture.componentRef.setInput("position", "left");
            fixture.componentRef.setInput("selectedTabId", "tab1");
            fixture.detectChanges();
            const emitSpy = vi.spyOn(component.tabSelect, "emit");
            const preventDefaultSpy = vi.fn();
            fixture.debugElement.triggerEventHandler("keydown", { key: "ArrowUp", preventDefault: preventDefaultSpy });
            fixture.detectChanges();
            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 2 }));
        });

        it("should not prevent default for perpendicular arrow keys in horizontal orientation", () => {
            fixture.componentRef.setInput("selectedTabId", "tab1");
            fixture.detectChanges();
            const emitSpy = vi.spyOn(component.tabSelect, "emit");
            const preventDefaultSpy = vi.fn();
            fixture.debugElement.triggerEventHandler("keydown", { key: "ArrowUp", preventDefault: preventDefaultSpy });
            fixture.detectChanges();
            expect(preventDefaultSpy).not.toHaveBeenCalled();
            expect(emitSpy).not.toHaveBeenCalled();
        });

        it("should not prevent default for perpendicular arrow keys in vertical orientation", () => {
            fixture.componentRef.setInput("position", "left");
            fixture.componentRef.setInput("selectedTabId", "tab1");
            fixture.detectChanges();
            const emitSpy = vi.spyOn(component.tabSelect, "emit");
            const preventDefaultSpy = vi.fn();
            fixture.debugElement.triggerEventHandler("keydown", { key: "ArrowRight", preventDefault: preventDefaultSpy });
            fixture.detectChanges();
            expect(preventDefaultSpy).not.toHaveBeenCalled();
            expect(emitSpy).not.toHaveBeenCalled();
        });
    });

    describe("overflow controls", () => {
        const mockOverflow = (axis: "x" | "y") => {
            const ul = fixture.debugElement.query(By.css("ul[role='tablist']")).nativeElement;
            if (axis === "x") {
                Object.defineProperty(ul, "scrollWidth", { value: 200, configurable: true });
                Object.defineProperty(ul, "clientWidth", { value: 100, configurable: true });
            } else {
                Object.defineProperty(ul, "scrollHeight", { value: 200, configurable: true });
                Object.defineProperty(ul, "clientHeight", { value: 100, configurable: true });
            }
        };

        const overflowButtons = () => fixture.debugElement.queryAll(By.css("button[aria-hidden='true']"));

        it("should not render overflow controls when content fits", async () => {
            fixture.detectChanges();
            await flushAsync();
            expect(overflowButtons().length).toBe(0);
        });

        it("should render overflow controls when content overflows horizontally", async () => {
            mockOverflow("x");
            fixture.componentRef.setInput("tabList", makeTabs());
            fixture.detectChanges();
            await flushAsync();
            fixture.detectChanges();
            const buttons = overflowButtons();
            expect(buttons.length).toBe(2);
            expect(buttons[0].nativeElement.querySelector("svg[lucideChevronLeft]")).toBeTruthy();
            expect(buttons[1].nativeElement.querySelector("svg[lucideChevronRight]")).toBeTruthy();
        });

        it("should render vertical overflow controls when content overflows vertically", async () => {
            fixture.componentRef.setInput("position", "left");
            fixture.detectChanges();
            mockOverflow("y");
            fixture.componentRef.setInput("tabList", makeTabs());
            fixture.detectChanges();
            await flushAsync();
            fixture.detectChanges();
            const buttons = overflowButtons();
            expect(buttons.length).toBe(2);
            expect(buttons[0].nativeElement.querySelector("svg[lucideChevronUp]")).toBeTruthy();
            expect(buttons[1].nativeElement.querySelector("svg[lucideChevronDown]")).toBeTruthy();
        });

        it("should scroll horizontally when clicking the next control", async () => {
            const scrollBy = vi.fn();
            mockOverflow("x");
            fixture.componentRef.setInput("tabList", makeTabs());
            fixture.detectChanges();
            await flushAsync();
            fixture.detectChanges();
            const tabListElement = fixture.debugElement.query(By.css("ul[role='tablist']"))
                .nativeElement as HTMLUListElement;
            Object.defineProperty(tabListElement, "scrollBy", { configurable: true, value: scrollBy });
            const nextButton = overflowButtons()[1];
            nextButton.triggerEventHandler("click", {});
            await vi.waitFor(() => expect(scrollBy).toHaveBeenCalledWith({ left: 100, behavior: "smooth" }));
        });

        it("should scroll vertically when clicking the next control", async () => {
            const scrollBy = vi.fn();
            fixture.componentRef.setInput("position", "left");
            fixture.detectChanges();
            mockOverflow("y");
            fixture.componentRef.setInput("tabList", makeTabs());
            fixture.detectChanges();
            await flushAsync();
            fixture.detectChanges();
            const tabListElement = fixture.debugElement.query(By.css("ul[role='tablist']"))
                .nativeElement as HTMLUListElement;
            Object.defineProperty(tabListElement, "scrollBy", { configurable: true, value: scrollBy });
            const nextButton = overflowButtons()[1];
            nextButton.triggerEventHandler("click", {});
            await vi.waitFor(() => expect(scrollBy).toHaveBeenCalledWith({ top: 100, behavior: "smooth" }));
        });

        it("should stop continuous scrolling on pointercancel", async () => {
            mockOverflow("x");
            fixture.componentRef.setInput("tabList", makeTabs());
            fixture.detectChanges();
            await flushAsync();
            fixture.detectChanges();
            const stopScrollingSpy = vi.spyOn(component as unknown as { stopScrolling(): void }, "stopScrolling");
            const nextButton = overflowButtons()[1];
            nextButton.triggerEventHandler("pointercancel", {});
            expect(stopScrollingSpy).toHaveBeenCalled();
        });
    });

    it("should scroll the selected tab into view when clicking a tab", async () => {
        const scrollIntoView = vi.fn();
        (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = scrollIntoView;
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();
        const tab2 = fixture.debugElement.query(By.css("li[data-tab-id='tab2']"));
        tab2.triggerEventHandler("click", {});
        fixture.detectChanges();
        await flushAsync();
        expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "nearest", inline: "nearest" });
    });
});
