import { provideHttpClient, withXhr } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideMarkdown } from "ngx-markdown";
import { beforeEach, describe, expect, it } from "vitest";
import { MultiSelectDocComponent } from "./multi-select-doc.component";
import { PageService } from "../../../layout/services/page.service";

describe("MultiSelectDocComponent", () => {
    let component: MultiSelectDocComponent;
    let fixture: ComponentFixture<MultiSelectDocComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MultiSelectDocComponent],
            providers: [PageService, provideHttpClient(withXhr()), provideMarkdown(), provideRouter([])]
        }).compileComponents();

        fixture = TestBed.createComponent(MultiSelectDocComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
