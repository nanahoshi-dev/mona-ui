import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { TabListComponent } from "../tab-list/tab-list.component";
import { TabComponent } from "../tab/tab.component";
import { TabsComponent } from "./tabs.component";

@Component({
    template: `
        <mona-tabs>
            <mona-tab title="Tab 1">Content 1</mona-tab>
            <mona-tab title="Tab 2">Content 2</mona-tab>
        </mona-tabs>
    `,
    imports: [TabsComponent, TabComponent]
})
class TestHostComponent {}

@Component({
    template: `
        <mona-tabs [disabled]="disabled()">
            <mona-tab title="Tab 1">Content 1</mona-tab>
            <mona-tab title="Tab 2">Content 2</mona-tab>
            @if (showThirdTab()) {
                <mona-tab title="Tab 3">Content 3</mona-tab>
            }
        </mona-tabs>
    `,
    imports: [TabsComponent, TabComponent]
})
class DynamicTabHostComponent {
    public readonly disabled = signal(false);
    public readonly showThirdTab = signal(false);
}

describe("TabsComponent", () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent, TabsComponent, TabComponent, TabListComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should handle Shift+Tab on panel", () => {
        const debugElement = fixture.debugElement.query(By.directive(TabsComponent));
        fixture.detectChanges();

        const tabListDe = debugElement.query(By.directive(TabListComponent));
        const tabListComponent = tabListDe.componentInstance as TabListComponent;
        const focusSpy = vi.spyOn(tabListComponent, "focusSelectedTab");

        // Simulate KeyDown on panel
        const panel = debugElement.query(By.css("div[role='tabpanel']"));
        expect(panel).toBeTruthy();

        // target === currentTarget
        panel.triggerEventHandler("keydown", {
            key: "Tab",
            shiftKey: true,
            target: panel.nativeElement,
            currentTarget: panel.nativeElement,
            preventDefault: vi.fn()
        });

        expect(focusSpy).toHaveBeenCalled();
    });

    it("should NOT handle Shift+Tab from inner content", () => {
        const debugElement = fixture.debugElement.query(By.directive(TabsComponent));
        fixture.detectChanges();

        const tabListDe = debugElement.query(By.directive(TabListComponent));
        const tabListComponent = tabListDe.componentInstance as TabListComponent;
        const focusSpy = vi.spyOn(tabListComponent, "focusSelectedTab");

        const panel = debugElement.query(By.css("div[role='tabpanel']"));

        // Mock event where target != currentTarget
        const fakeTarget = document.createElement("input");
        const preventDefaultSpy = vi.fn();

        panel.triggerEventHandler("keydown", {
            key: "Tab",
            shiftKey: true,
            target: fakeTarget,
            currentTarget: panel.nativeElement,
            preventDefault: preventDefaultSpy
        });

        expect(focusSpy).not.toHaveBeenCalled();
        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it("should label the panel with the tab's id, not its own id", () => {
        const debugElement = fixture.debugElement.query(By.directive(TabsComponent));
        const tabElement: HTMLElement = debugElement.query(By.css("li[data-tab-id]")).nativeElement;
        const panelElement: HTMLElement = debugElement.query(By.css("div[role='tabpanel']")).nativeElement;

        expect(tabElement.id).toBe(panelElement.getAttribute("aria-labelledby"));
        expect(panelElement.getAttribute("aria-labelledby")).not.toBe(panelElement.id);
    });
});

describe("TabsComponent with dynamic tab list", () => {
    let component: DynamicTabHostComponent;
    let fixture: ComponentFixture<DynamicTabHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DynamicTabHostComponent, TabsComponent, TabComponent, TabListComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DynamicTabHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    function getSelectedTabTitle(): string | undefined {
        const debugElement = fixture.debugElement.query(By.directive(TabsComponent));
        const tabListDe = debugElement.query(By.directive(TabListComponent));
        const tabListComponent = tabListDe.componentInstance as TabListComponent;
        const tabs = Array.from(tabListComponent.tabList());
        return tabs.find(t => t.id === tabListComponent.selectedTabId())?.title;
    }

    it("should keep the current selection when a new tab is added", async () => {
        const debugElement = fixture.debugElement.query(By.directive(TabsComponent));
        const tabListDe = debugElement.query(By.directive(TabListComponent));
        const tabListComponent = tabListDe.componentInstance as TabListComponent;
        const secondTab = Array.from(tabListComponent.tabList())[1];
        tabListComponent.selectedTabId.set(secondTab.id);
        fixture.detectChanges();

        component.showThirdTab.set(true);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(getSelectedTabTitle()).toBe("Tab 2");
    });

    it("should fall back to the first remaining tab when the selected tab is removed", async () => {
        component.showThirdTab.set(true);
        fixture.detectChanges();
        await fixture.whenStable();

        const debugElement = fixture.debugElement.query(By.directive(TabsComponent));
        const tabListDe = debugElement.query(By.directive(TabListComponent));
        const tabListComponent = tabListDe.componentInstance as TabListComponent;
        const thirdTab = Array.from(tabListComponent.tabList())[2];
        tabListComponent.selectedTabId.set(thirdTab.id);
        fixture.detectChanges();

        component.showThirdTab.set(false);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(getSelectedTabTitle()).toBe("Tab 1");
    });

    it("should propagate the disabled input to TabListComponent", () => {
        component.disabled.set(true);
        fixture.detectChanges();

        const debugElement = fixture.debugElement.query(By.directive(TabsComponent));
        const tabListDe = debugElement.query(By.directive(TabListComponent));
        const tabListComponent = tabListDe.componentInstance as TabListComponent;

        expect(tabListComponent.disabled()).toBe(true);
    });
});
