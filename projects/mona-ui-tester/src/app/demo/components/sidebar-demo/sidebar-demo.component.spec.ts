import { ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";

import { SidebarDemoComponent } from "./sidebar-demo.component";

describe("SidebarDemoComponent", () => {
    let component: SidebarDemoComponent;
    let fixture: ComponentFixture<SidebarDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SidebarDemoComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SidebarDemoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("has no AXE accessibility violations", async () => {
        const sidebarLayout = (fixture.nativeElement as HTMLElement).querySelector("mona-sidebar-layout");
        if (!sidebarLayout) {
            throw new Error("Expected the sidebar demo layout to be rendered.");
        }
        const results = await axe.run(sidebarLayout, {
            rules: { "color-contrast": { enabled: false } }
        });

        expect(results.violations).toEqual([]);
    });
});
