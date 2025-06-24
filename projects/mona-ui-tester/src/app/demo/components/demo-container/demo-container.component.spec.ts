import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DemoContainerComponent } from "./demo-container.component";

describe("DemoContainerComponent", () => {
    let component: DemoContainerComponent<unknown>;
    let fixture: ComponentFixture<DemoContainerComponent<unknown>>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DemoContainerComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DemoContainerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
