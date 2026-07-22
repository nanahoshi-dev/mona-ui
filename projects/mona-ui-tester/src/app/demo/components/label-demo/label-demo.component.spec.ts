import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { DemoService } from "../../services/demo.service";

import { LabelDemoComponent } from "./label-demo.component";

describe("LabelDemoComponent", () => {
    let component: LabelDemoComponent;
    let fixture: ComponentFixture<LabelDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LabelDemoComponent],
            providers: [{ provide: DemoService, useValue: { metadata$: of({}) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(LabelDemoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
