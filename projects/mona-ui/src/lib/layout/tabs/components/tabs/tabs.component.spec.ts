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

        panel.triggerEventHandler("keydown", {
            key: "Tab",
            shiftKey: true,
            preventDefault: vi.fn()
        });

        expect(focusSpy).toHaveBeenCalled();
    });
});
