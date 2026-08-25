import { provideHttpClient, withXhr } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideMarkdown } from "ngx-markdown";
import { beforeEach, describe, expect, it } from "vitest";
import { EditorDocComponent } from "./editor-doc.component";
import { PageService } from "../../../layout/services/page.service";

describe("EditorDocComponent", () => {
    let component: EditorDocComponent;
    let fixture: ComponentFixture<EditorDocComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorDocComponent],
            providers: [PageService, provideHttpClient(withXhr()), provideMarkdown(), provideRouter([])]
        }).compileComponents();

        fixture = TestBed.createComponent(EditorDocComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
