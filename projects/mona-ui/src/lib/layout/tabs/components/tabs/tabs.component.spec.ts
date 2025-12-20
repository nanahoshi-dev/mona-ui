import { Component } from "@angular/core";
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
class TestHostComponent { }

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
});
