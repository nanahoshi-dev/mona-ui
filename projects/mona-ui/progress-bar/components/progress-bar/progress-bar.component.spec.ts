import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ProgressBarComponent } from "./progress-bar.component";

describe("ProgressBarComponent", () => {
    let component: ProgressBarComponent;
    let fixture: ComponentFixture<ProgressBarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ProgressBarComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ProgressBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("uses a borderless muted track with explicit primary progress", () => {
        const host = fixture.nativeElement as HTMLElement;
        const filledTrack = host.querySelector("[data-prev='true']") as HTMLElement;
        const remainingTrack = host.querySelector("[data-next='true']") as HTMLElement;

        expect(host.classList.contains("bg-surface-muted")).toBe(true);
        expect(host.classList.contains("border-input-border")).toBe(false);
        expect(filledTrack.classList.contains("bg-primary")).toBe(true);
        expect(remainingTrack.classList.contains("data-[next='true']:bg-surface-muted")).toBe(true);
    });

    it("uses semantic disabled colors without fading the whole control", () => {
        fixture.componentRef.setInput("disabled", true);
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        expect(host.classList.contains("data-[disabled='true']:bg-disabled-background")).toBe(true);
        expect(host.classList.contains("data-[disabled='true']:text-disabled-foreground")).toBe(true);
        expect(host.classList.contains("data-[disabled='true']:opacity-50")).toBe(false);
    });
});
