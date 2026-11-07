import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RatingComponent } from "../components/rating/rating.component";

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

@Component({
    template: `
        <mona-rating
            aria-label="Quality"
            [clearable]="clearable()"
            [precision]="precision()"
            [readonly]="isReadonly()"
            [(value)]="value" />
    `,
    imports: [RatingComponent]
})
class HostComponent {
    public readonly clearable = signal(true);
    public readonly isReadonly = signal(false);
    public readonly precision = signal<"half" | "item">("item");
    public readonly value = signal(3);
}

describe("rating behavior", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let control: HTMLElement;
    let items: HTMLElement[];

    function press(key: string): void {
        control.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        await settle(fixture);
        control = fixture.nativeElement.querySelector("[role='slider']");
        items = [...fixture.nativeElement.querySelectorAll("[data-rating-index]")];
    });

    describe("clearable", () => {
        it("clears on a click on the current value", async () => {
            items[2].click();
            await settle(fixture);

            expect(host.value()).toBe(0);
        });

        it("drops the preview, so the rating shows as cleared", async () => {
            items[2].dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
            await settle(fixture);
            expect(items[0].querySelector("[data-state='hovered']")).not.toBeNull();

            items[2].click();
            await settle(fixture);

            expect(control.querySelector("[data-state]")).toBeNull();
        });

        it("still changes the value on a click on another item", async () => {
            items[4].click();
            await settle(fixture);

            expect(host.value()).toBe(5);
        });

        it("keeps the value when it isn't set", async () => {
            host.clearable.set(false);
            await settle(fixture);

            items[2].click();
            await settle(fixture);

            expect(host.value()).toBe(3);
        });

        it("keeps the value when read-only", async () => {
            host.isReadonly.set(true);
            await settle(fixture);

            items[2].click();
            await settle(fixture);

            expect(host.value()).toBe(3);
        });
    });

    describe("page keys", () => {
        it("move by a whole item", async () => {
            press("PageUp");
            await settle(fixture);
            expect(host.value()).toBe(4);

            press("PageDown");
            press("PageDown");
            await settle(fixture);
            expect(host.value()).toBe(2);
        });

        it("are larger than the arrow keys at half precision", async () => {
            host.precision.set("half");
            await settle(fixture);

            press("PageUp");
            await settle(fixture);

            expect(host.value()).toBe(4);
        });

        it("stop at the ends", async () => {
            host.value.set(5);
            await settle(fixture);

            press("PageUp");
            await settle(fixture);

            expect(host.value()).toBe(5);
        });
    });

    describe("pointer preview", () => {
        it("reads no layout at whole-item precision", () => {
            const rect = vi.spyOn(items[1], "getBoundingClientRect");
            const style = vi.spyOn(window, "getComputedStyle");

            items[1].dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));

            expect(rect).not.toHaveBeenCalled();
            expect(style).not.toHaveBeenCalled();
            style.mockRestore();
        });

        it("still reads where the pointer is at half precision", async () => {
            host.precision.set("half");
            await settle(fixture);
            const rect = vi.spyOn(items[1], "getBoundingClientRect");

            items[1].dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));

            expect(rect).toHaveBeenCalled();
        });

        it("stops listening when destroyed", () => {
            const remove = vi.spyOn(control, "removeEventListener");

            fixture.destroy();

            expect(remove).toHaveBeenCalledWith("pointermove", expect.any(Function));
        });
    });
});
