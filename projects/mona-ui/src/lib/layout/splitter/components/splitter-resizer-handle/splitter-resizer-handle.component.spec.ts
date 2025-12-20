import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SplitterResizerHandleComponent } from "./splitter-resizer-handle.component";

describe("SplitterResizerHandleComponent", () => {
    let component: SplitterResizerHandleComponent;
    let fixture: ComponentFixture<SplitterResizerHandleComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SplitterResizerHandleComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SplitterResizerHandleComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput("nextControlsVisible", false);
        fixture.componentRef.setInput("orientation", "horizontal");
        fixture.componentRef.setInput("previousControlsVisible", false);
        fixture.componentRef.setInput("resizable", true);
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
