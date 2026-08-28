import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import { DemoService } from "../../services/demo.service";
import { OtpInputDemoComponent } from "./otp-input-demo.component";

describe("OtpInputDemoComponent", () => {
    let component: OtpInputDemoComponent;
    let fixture: ComponentFixture<OtpInputDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OtpInputDemoComponent],
            providers: [{ provide: DemoService, useValue: { metadata$: of({}) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(OtpInputDemoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
