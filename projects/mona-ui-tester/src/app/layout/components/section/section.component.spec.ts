import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { SectionComponent } from "./section.component";
import { PageService } from "../../services/page.service";

describe("SectionComponent", () => {
    let component: SectionComponent;
    let fixture: ComponentFixture<SectionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SectionComponent],
            providers: [PageService]
        }).compileComponents();

        fixture = TestBed.createComponent(SectionComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput("id", "test-section");
        fixture.componentRef.setInput("headerType", "h2");
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
