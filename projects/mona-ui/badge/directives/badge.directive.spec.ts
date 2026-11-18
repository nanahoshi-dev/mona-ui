import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { BadgeVariantProps } from "../styles/badge.styles";
import { BadgeDirective } from "./badge.directive";

@Component({
    imports: [BadgeDirective],
    template: `
        <p>
            Inbox
            <span monaBadge [fill]="fill()" [look]="look()" [rounded]="rounded()" [size]="size()" [class]="userClass()"
                >12</span
            >
        </p>
    `
})
class HostComponent {
    public readonly fill = signal<BadgeVariantProps["fill"]>("solid");
    public readonly look = signal<BadgeVariantProps["look"]>("secondary");
    public readonly rounded = signal<BadgeVariantProps["rounded"]>("medium");
    public readonly size = signal<BadgeVariantProps["size"]>("medium");
    public readonly userClass = signal("");
}

describe("BadgeDirective", () => {
    let fixture: ComponentFixture<HostComponent>;
    let badge: HTMLElement;

    const classes = (): string[] => Array.from(badge.classList);
    const set = (change: (host: HostComponent) => void): void => {
        change(fixture.componentInstance);
        fixture.detectChanges();
    };

    beforeEach(() => {
        fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        badge = fixture.nativeElement.querySelector("[monaBadge]");
    });

    afterEach(() => fixture.destroy());

    it("draws a medium, solid secondary badge by default", () => {
        expect(classes()).toEqual(
            expect.arrayContaining(["bg-secondary", "text-secondary-foreground", "h-5", "text-xs", "rounded-md"])
        );
    });

    it("adds no role or name, so its text reads with what's around it", () => {
        expect(badge.getAttribute("role")).toBeNull();
        expect(badge.getAttribute("aria-label")).toBeNull();
        expect(fixture.nativeElement.querySelector("p").textContent.replace(/\s+/g, " ").trim()).toBe("Inbox 12");
    });

    it("fills with the look's color, a tint of it, or only its border", () => {
        set(host => host.look.set("error"));
        expect(classes()).toEqual(expect.arrayContaining(["bg-error", "text-error-foreground"]));
        set(host => host.fill.set("subtle"));
        expect(classes()).toEqual(expect.arrayContaining(["bg-error-subtle", "text-error-subtle-foreground"]));
        expect(classes()).not.toContain("bg-error");
        set(host => host.fill.set("outline"));
        expect(classes()).toEqual(expect.arrayContaining(["bg-transparent", "border-error-border", "text-foreground"]));
    });

    it("keeps an edge in forced colors, where its fill doesn't paint", () => {
        expect(classes()).toEqual(
            expect.arrayContaining(["border", "border-transparent", "forced-colors:border-[CanvasText]"])
        );
    });

    it("sizes and rounds from its presets", () => {
        set(host => {
            host.size.set("large");
            host.rounded.set("full");
        });
        expect(classes()).toEqual(expect.arrayContaining(["h-6", "text-sm", "rounded-full"]));
        expect(classes()).not.toContain("h-5");
    });

    it("merges its class input over the presets", () => {
        set(host => host.userClass.set("rounded-none ms-2"));
        expect(classes()).toEqual(expect.arrayContaining(["rounded-none", "ms-2"]));
        expect(classes()).not.toContain("rounded-md");
    });

    it("passes axe", async () => {
        const result = await axe.run(fixture.nativeElement, { rules: { "color-contrast": { enabled: false } } });
        expect(result.violations).toEqual([]);
    });
});
