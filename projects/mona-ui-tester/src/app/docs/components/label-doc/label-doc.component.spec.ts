import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { DemoService } from "../../../demo/services/demo.service";

import { LabelDocComponent } from "./label-doc.component";

describe("LabelDocComponent", () => {
    let component: LabelDocComponent;
    let fixture: ComponentFixture<LabelDocComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LabelDocComponent],
            providers: [{ provide: DemoService, useValue: { metadata$: of({}) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(LabelDocComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
