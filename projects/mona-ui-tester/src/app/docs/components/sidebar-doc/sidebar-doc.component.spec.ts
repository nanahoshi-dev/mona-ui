import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SidebarDocComponent } from "./sidebar-doc.component";

describe("SidebarDocComponent", () => {
    let component: SidebarDocComponent;
    let fixture: ComponentFixture<SidebarDocComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SidebarDocComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SidebarDocComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
