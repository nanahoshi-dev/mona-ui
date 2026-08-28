import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { OtpInputVariantProps } from "../styles/otp-input.styles";
import { OtpSlotDirective } from "./otp-slot.directive";

@Component({
    template: `
        <span
            monaOtpSlot
            [firstSlot]="firstSlot()"
            [groupSize]="groupSize()"
            [lastSlot]="lastSlot()"
            [rounded]="rounded()"
            [size]="size()"
            [slotClass]="slotClass()"
            [spacing]="spacing()"
        ></span>
    `,
    imports: [OtpSlotDirective]
})
class TestHostComponent {
    public readonly firstSlot = signal(false);
    public readonly groupSize = signal(1);
    public readonly lastSlot = signal(false);
    public readonly rounded = signal<OtpInputVariantProps["rounded"]>("medium");
    public readonly size = signal<OtpInputVariantProps["size"]>("medium");
    public readonly slotClass = signal<string | string[]>("");
    public readonly spacing = signal(true);
}

describe("OtpSlotDirective", () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let hostComponent: TestHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent]
        }).compileComponents();

        hostFixture = TestBed.createComponent(TestHostComponent);
        hostComponent = hostFixture.componentInstance;
        hostFixture.detectChanges();
    });

    function getSlotElement(): HTMLElement {
        return hostFixture.nativeElement.querySelector("span");
    }

    it("should create an instance", () => {
        expect(hostComponent).toBeTruthy();
    });

    it("applies the rounded variant directly when spacing is enabled", () => {
        hostComponent.spacing.set(true);
        hostComponent.rounded.set("large");
        hostFixture.detectChanges();

        const classList = getSlotElement().classList;

        expect(classList).toContain("rounded-lg");
    });

    it("does not apply group edge rounding when spacing is enabled", () => {
        hostComponent.spacing.set(true);
        hostComponent.firstSlot.set(true);
        hostComponent.groupSize.set(3);
        hostComponent.rounded.set("large");
        hostFixture.detectChanges();

        const classList = getSlotElement().classList;

        expect(classList).not.toContain("rounded-s-lg");
    });

    it("removes the base rounded variant and applies start-edge rounding for the first slot in a group without spacing", () => {
        hostComponent.spacing.set(false);
        hostComponent.firstSlot.set(true);
        hostComponent.lastSlot.set(false);
        hostComponent.groupSize.set(3);
        hostComponent.rounded.set("large");
        hostFixture.detectChanges();

        const classList = getSlotElement().classList;

        expect(classList).toContain("rounded-s-lg");
        expect(classList).toContain("rounded-e-none");
        expect(classList).not.toContain("rounded-lg");
    });

    it("applies end-edge rounding for the last slot in a group without spacing", () => {
        hostComponent.spacing.set(false);
        hostComponent.firstSlot.set(false);
        hostComponent.lastSlot.set(true);
        hostComponent.groupSize.set(3);
        hostComponent.rounded.set("large");
        hostFixture.detectChanges();

        const classList = getSlotElement().classList;

        expect(classList).toContain("rounded-e-lg");
        expect(classList).toContain("rounded-s-none");
    });

    it("removes rounding entirely for a middle slot in a group without spacing", () => {
        hostComponent.spacing.set(false);
        hostComponent.firstSlot.set(false);
        hostComponent.lastSlot.set(false);
        hostComponent.groupSize.set(3);
        hostComponent.rounded.set("large");
        hostFixture.detectChanges();

        const classList = getSlotElement().classList;

        expect(classList).toContain("rounded-none");
        expect(classList).not.toContain("rounded-lg");
    });

    it("falls back to the base none-rounded variant when the group has a single slot", () => {
        hostComponent.spacing.set(false);
        hostComponent.firstSlot.set(true);
        hostComponent.lastSlot.set(true);
        hostComponent.groupSize.set(1);
        hostComponent.rounded.set("large");
        hostFixture.detectChanges();

        const classList = getSlotElement().classList;

        expect(classList).not.toContain("rounded-s-lg");
        expect(classList).not.toContain("rounded-e-lg");
        expect(classList).toContain("rounded-none");
    });

    it("applies the size variant classes", () => {
        hostComponent.size.set("small");
        hostFixture.detectChanges();

        const classList = getSlotElement().classList;

        expect(classList).toContain("h-8");
        expect(classList).toContain("w-8");
    });

    it("merges a custom slotClass string onto the computed base classes", () => {
        hostComponent.slotClass.set("text-red-500");
        hostFixture.detectChanges();

        expect(getSlotElement().classList).toContain("text-red-500");
    });

    it("merges a custom slotClass array onto the computed base classes", () => {
        hostComponent.slotClass.set(["text-red-500", "italic"]);
        hostFixture.detectChanges();

        const classList = getSlotElement().classList;

        expect(classList).toContain("text-red-500");
        expect(classList).toContain("italic");
    });

    it("lets a conflicting slotClass override the computed size classes via tailwind-merge", () => {
        hostComponent.size.set("small");
        hostComponent.slotClass.set("h-20 w-20");
        hostFixture.detectChanges();

        const classList = getSlotElement().classList;

        expect(classList).toContain("h-20");
        expect(classList).toContain("w-20");
        expect(classList).not.toContain("h-8");
        expect(classList).not.toContain("w-8");
    });
});
