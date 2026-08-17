import { provideHttpClient, withXhr } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideMarkdown } from "ngx-markdown";
import { beforeEach, describe, expect, it } from "vitest";
import { LabelDocComponent } from "./label-doc.component";
import { PageService } from "../../../layout/services/page.service";

describe("LabelDocComponent", () => {
    let component: LabelDocComponent;
    let fixture: ComponentFixture<LabelDocComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LabelDocComponent],
            providers: [PageService, provideHttpClient(withXhr()), provideMarkdown(), provideRouter([])]
        }).compileComponents();

        fixture = TestBed.createComponent(LabelDocComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
