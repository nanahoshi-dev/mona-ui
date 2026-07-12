import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LucideSearch } from "@lucide/angular";
import { describe, expect, it, vi } from "vitest";

import { IndicatorIconComponent, type IndicatorIconPreset } from "./indicator-icon.component";

@Component({
    template: `
        <mona-indicator-icon
            [preset]="preset()"
            [icon]="icon"
            [size]="size()"
            [interactive]="interactive()"
            [label]="label()"
            (activate)="onActivate($event)">
            @if (projected()) {
                <span class="projected-icon">Projected</span>
            }
        </mona-indicator-icon>
    `,
    imports: [IndicatorIconComponent]
})
class IndicatorIconHostComponent {
    protected readonly icon = LucideSearch;
    public readonly onActivate = vi.fn();
    public readonly interactive = signal(false);
    public readonly label = signal("");
    public readonly preset = signal<IndicatorIconPreset | null>(null);
    public readonly projected = signal(false);
    public readonly size = signal(16);
}

describe("IndicatorIconComponent", () => {
    it("renders the clear preset", async () => {
        const fixture = await createFixture("clear");

        expect(getIndicator(fixture).querySelector("svg")).toBeTruthy();
    });

    it("renders the dropdown preset", async () => {
        const fixture = await createFixture("dropdown");

        expect(getIndicator(fixture).querySelector("svg")).toBeTruthy();
    });

    it("renders the loading preset with spinner class", async () => {
        const fixture = await createFixture("loading");

        const loader = getIndicator(fixture).querySelector("svg");
        expect(loader?.classList.contains("animate-[spin_2s_linear_infinite]")).toBe(true);
    });

    it("renders a dynamic lucide icon input", async () => {
        const fixture = await createFixture(null);

        expect(getIndicator(fixture).querySelector("svg")).toBeTruthy();
    });

    it("prioritizes projected content over preset and icon input", async () => {
        const fixture = await createFixture("clear", true);

        expect(getIndicator(fixture).querySelector(".projected-icon")).toBeTruthy();
        expect(getIndicator(fixture).querySelector("svg")).toBeNull();
    });

    it("adds button semantics only when interactive", async () => {
        const fixture = await createFixture("clear");

        expect(getIndicator(fixture).getAttribute("role")).toBeNull();
        expect(getIndicator(fixture).getAttribute("tabindex")).toBeNull();

        fixture.componentInstance.interactive.set(true);
        fixture.componentInstance.label.set("Clear");
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(getIndicator(fixture).getAttribute("role")).toBe("button");
        expect(getIndicator(fixture).getAttribute("tabindex")).toBe("0");
        expect(getIndicator(fixture).getAttribute("aria-label")).toBe("Clear");
    });

    it("emits activate on click, Enter, and Space when interactive", async () => {
        const fixture = await createFixture("clear", false, true, "Clear");
        const indicator = getIndicator(fixture);

        indicator.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        indicator.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }));
        indicator.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: " " }));
        fixture.detectChanges();

        expect(fixture.componentInstance.onActivate).toHaveBeenCalledTimes(3);
    });
});

async function createFixture(
    preset: IndicatorIconPreset | null,
    projected: boolean = false,
    interactive: boolean = false,
    label: string = ""
): Promise<ComponentFixture<IndicatorIconHostComponent>> {
    await TestBed.configureTestingModule({
        imports: [IndicatorIconHostComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(IndicatorIconHostComponent);
    fixture.componentInstance.interactive.set(interactive);
    fixture.componentInstance.label.set(label);
    fixture.componentInstance.preset.set(preset);
    fixture.componentInstance.projected.set(projected);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
}

function getIndicator(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement.querySelector("mona-indicator-icon") as HTMLElement;
}
