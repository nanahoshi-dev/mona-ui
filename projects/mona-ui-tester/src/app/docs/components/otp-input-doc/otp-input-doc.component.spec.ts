import { provideHttpClient, withXhr } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideMarkdown } from "ngx-markdown";
import { of } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import { DemoService } from "../../../demo/services/demo.service";
import { PageService } from "../../../layout/services/page.service";
import { OtpInputDocComponent } from "./otp-input-doc.component";

describe("OtpInputDocComponent", () => {
    let component: OtpInputDocComponent;
    let fixture: ComponentFixture<OtpInputDocComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OtpInputDocComponent],
            providers: [
                PageService,
                provideHttpClient(withXhr()),
                provideMarkdown(),
                provideRouter([]),
                { provide: DemoService, useValue: { metadata$: of({}) } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(OtpInputDocComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
