import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { beforeEach, describe, expect, it } from "vitest";
import { SidebarGroupComponent } from "./sidebar-group.component";

describe("SidebarGroupComponent", () => {
    let component: SidebarGroupComponent;
    let fixture: ComponentFixture<SidebarGroupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SidebarGroupComponent],
            providers: [provideRouter([])]
        }).compileComponents();

        fixture = TestBed.createComponent(SidebarGroupComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput("group", { groupName: "Components", items: [] });
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
