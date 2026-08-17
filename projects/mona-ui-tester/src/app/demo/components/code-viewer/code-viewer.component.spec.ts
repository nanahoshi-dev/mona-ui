import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { CodeViewerComponent } from "./code-viewer.component";

describe("CodeViewerComponent", () => {
    let component: CodeViewerComponent;
    let fixture: ComponentFixture<CodeViewerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CodeViewerComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(CodeViewerComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput("code", "const x = 1;");
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
