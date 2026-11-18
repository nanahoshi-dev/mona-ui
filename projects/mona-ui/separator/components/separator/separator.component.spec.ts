import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SeparatorComponent } from "./separator.component";

@Component({
    imports: [SeparatorComponent],
    template: `
        <div class="flex">
            <p>Above</p>
            <mona-separator
                [decorative]="decorative()"
                [label]="label()"
                [orientation]="orientation()"
                [class]="userClass()" />
            <p>Below</p>
        </div>
    `
})
class HostComponent {
    public readonly decorative = signal(false);
    public readonly label = signal("");
    public readonly orientation = signal<"horizontal" | "vertical">("horizontal");
    public readonly userClass = signal("");
}

describe("SeparatorComponent", () => {
    let fixture: ComponentFixture<HostComponent>;
    let separator: HTMLElement;

    const set = (change: (host: HostComponent) => void): void => {
        change(fixture.componentInstance);
        fixture.detectChanges();
    };

    beforeEach(() => {
        fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        separator = fixture.nativeElement.querySelector("mona-separator");
    });

    afterEach(() => fixture.destroy());

    it("is a horizontal separator by default, with no orientation to repeat", () => {
        expect(separator.getAttribute("role")).toBe("separator");
        expect(separator.getAttribute("aria-orientation")).toBeNull();
        expect(separator.classList).toContain("h-px");
        expect(separator.classList).toContain("w-full");
        expect(separator.childElementCount).toBe(0);
    });

    it("says it's vertical and stretches to its row", () => {
        set(host => host.orientation.set("vertical"));
        expect(separator.getAttribute("aria-orientation")).toBe("vertical");
        expect(separator.classList).toContain("w-px");
        expect(separator.classList).toContain("self-stretch");
    });

    it("takes the text color in forced colors, where its background doesn't paint", () => {
        expect(separator.classList).toContain("forced-colors:bg-[CanvasText]");
    });

    it("drops its role when it's decorative", () => {
        set(host => {
            host.decorative.set(true);
            host.orientation.set("vertical");
        });
        expect(separator.getAttribute("role")).toBeNull();
        expect(separator.getAttribute("aria-orientation")).toBeNull();
    });

    it("reads a label as text between two hidden lines", () => {
        set(host => {
            host.label.set("or");
            host.orientation.set("vertical");
        });
        expect(separator.getAttribute("role")).toBeNull();
        expect(separator.classList).toContain("flex");
        expect(separator.classList).not.toContain("w-px");
        const parts = Array.from(separator.children);
        expect(parts.map(part => part.getAttribute("aria-hidden"))).toEqual(["true", null, "true"]);
        expect(separator.textContent?.trim()).toBe("or");
        expect(parts[0].classList).toContain("forced-colors:bg-[CanvasText]");
    });

    it("merges its class input", () => {
        set(host => host.userClass.set("my-4 bg-primary"));
        expect(separator.classList).toContain("my-4");
        expect(separator.classList).toContain("bg-primary");
        expect(separator.classList).not.toContain("bg-border");
    });

    it("passes axe in each form", async () => {
        const run = async (): Promise<void> => {
            const result = await axe.run(fixture.nativeElement, { rules: { "color-contrast": { enabled: false } } });
            expect(result.violations).toEqual([]);
        };
        await run();
        set(host => host.orientation.set("vertical"));
        await run();
        set(host => host.label.set("or"));
        await run();
    });
});
