import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
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

    it("uses logical data-start and data-end attributes based on labelPosition", () => {
        fixture.componentRef.setInput("labelPosition", "start");
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        const filledTrack = host.querySelector("[data-prev='true']") as HTMLElement;
        expect(filledTrack.getAttribute("data-start")).toBe("true");
        expect(filledTrack.getAttribute("data-end")).toBe("false");

        fixture.componentRef.setInput("labelPosition", "end");
        fixture.detectChanges();
        expect(filledTrack.getAttribute("data-start")).toBe("false");
        expect(filledTrack.getAttribute("data-end")).toBe("true");
    });

    it("computes clip-paths appropriately for LTR and RTL directions", () => {
        const i18n = TestBed.inject(MonaI18nService);
        fixture.componentRef.setInput("value", 40);
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        let filledTrack = host.querySelector("[data-prev='true']") as HTMLElement;
        let remainingTrack = host.querySelector("[data-next='true']") as HTMLElement;

        // LTR defaults
        expect(remainingTrack.style.clipPath).toBe("inset(-1px -1px -1px 40%)");
        expect(filledTrack.style.clipPath).toBe("inset(-1px 8px -1px 0px)");

        // Switch to RTL
        i18n.use({
            id: "ar-EG",
            direction: "rtl",
            messages: {}
        });
        fixture.detectChanges();

        filledTrack = host.querySelector("[data-prev='true']") as HTMLElement;
        remainingTrack = host.querySelector("[data-next='true']") as HTMLElement;

        expect(remainingTrack.style.clipPath).toBe("inset(-1px 40% -1px -1px)");
        expect(filledTrack.style.clipPath).toBe("inset(-1px 0px -1px 8px)");
    });
});

