import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AvatarComponent } from "../avatar/avatar.component";
import { AvatarGroupComponent } from "./avatar-group.component";

@Component({
    imports: [AvatarComponent, AvatarGroupComponent],
    template: `
        <mona-avatar-group aria-label="Project members" [max]="max()" [class]="userClass()">
            @for (person of people(); track person) {
                <mona-avatar [aria-label]="person" [label]="person[0]" width="40px" height="40px" borderRadius="50%" />
            }
        </mona-avatar-group>
    `
})
class HostComponent {
    public readonly max = signal<number | null>(null);
    public readonly people = signal([
        "Ada Lovelace",
        "Grace Hopper",
        "Alan Turing",
        "Edsger Dijkstra",
        "Barbara Liskov"
    ]);
    public readonly userClass = signal("");
}

describe("AvatarGroupComponent", () => {
    let fixture: ComponentFixture<HostComponent>;
    let group: HTMLElement;

    const avatars = (): HTMLElement[] => Array.from(group.querySelectorAll<HTMLElement>("mona-avatar"));
    const shownNames = (): string[] =>
        avatars()
            .filter(avatar => avatar.style.display !== "none")
            .map(avatar => avatar.getAttribute("aria-label") ?? "");
    const more = (): HTMLElement | null => group.querySelector(":scope > span[role='img']");
    const set = (change: (host: HostComponent) => void): void => {
        change(fixture.componentInstance);
        fixture.detectChanges();
    };

    beforeEach(() => {
        fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        group = fixture.nativeElement.querySelector("mona-avatar-group");
    });

    afterEach(() => fixture.destroy());

    it("is a named group that shows every avatar without a max", () => {
        expect(group.getAttribute("role")).toBe("group");
        expect(group.getAttribute("aria-label")).toBe("Project members");
        expect(shownNames()).toHaveLength(5);
        expect(more()).toBeNull();
    });

    it("overlaps the avatars by a quarter of their width", () => {
        expect(group.style.getPropertyValue("--mona-avatar-group-overlap")).toBe("calc(40px * -0.25)");
        expect(group.classList).toContain("[&>*:not(:first-child)]:ms-(--mona-avatar-group-overlap)");
    });

    it("collapses the avatars past max into a count named for them", () => {
        set(host => host.max.set(3));
        expect(shownNames()).toEqual(["Ada Lovelace", "Grace Hopper", "Alan Turing"]);
        expect(more()?.textContent?.trim()).toBe("+2");
        expect(more()?.getAttribute("aria-label")).toBe("2 more");
    });

    it("draws the count the size and shape of the avatars", () => {
        set(host => host.max.set(1));
        const style = (more() as HTMLElement).style;
        expect(style.width).toBe("40px");
        expect(style.height).toBe("40px");
        expect(style.borderRadius).toBe("50%");
    });

    it("follows changes to max and to the avatars", () => {
        set(host => host.max.set(2));
        expect(more()?.textContent?.trim()).toBe("+3");
        set(host => host.people.update(people => people.slice(0, 2)));
        expect(more()).toBeNull();
        expect(shownNames()).toHaveLength(2);
        set(host => host.max.set(null));
        expect(shownNames()).toHaveLength(2);
    });

    it("names the count in the locale", () => {
        TestBed.inject(MonaI18nService).setMessages({ avatar: { moreLabel: count => `and ${count} others` } });
        set(host => host.max.set(4));
        expect(more()?.getAttribute("aria-label")).toBe("and 1 others");
    });

    it("merges its class input", () => {
        set(host => host.userClass.set("gap-1"));
        expect(group.classList).toContain("gap-1");
        expect(group.classList).toContain("inline-flex");
    });

    it("passes axe, collapsed or not", async () => {
        let result = await axe.run(fixture.nativeElement, { rules: { "color-contrast": { enabled: false } } });
        expect(result.violations).toEqual([]);
        set(host => host.max.set(2));
        result = await axe.run(fixture.nativeElement, { rules: { "color-contrast": { enabled: false } } });
        expect(result.violations).toEqual([]);
    });
});
