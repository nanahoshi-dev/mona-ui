import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { of } from "rxjs";
import { describe, expect, it } from "vitest";
import { DemoService } from "../../services/demo.service";

import { SliderDemoComponent } from "./slider-demo.component";

describe("SliderDemoComponent", () => {
    let component: SliderDemoComponent;
    let fixture: ComponentFixture<SliderDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SliderDemoComponent],
            providers: [{ provide: DemoService, useValue: { metadata$: of({}) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(SliderDemoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should display the neutral unfilled track by default", () => {
        const track = fixture.debugElement.query(By.css("mona-slider .bg-surface-muted")).nativeElement as HTMLElement;

        expect(track.style.background).toBe("var(--color-surface-muted)");
        expect(track.classList.contains("rounded-full")).toBe(true);
    });
});
