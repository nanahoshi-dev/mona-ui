import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AvatarComponent } from "../components/avatar/avatar.component";

@Component({
    imports: [AvatarComponent],
    template: `
        <mona-avatar [alt]="alt()" [aria-label]="ariaLabel()" [image]="image()" [label]="label()">
            <span class="projected">Fallback</span>
        </mona-avatar>
    `
})
class HostComponent {
    public readonly alt = signal("");
    public readonly ariaLabel = signal("");
    public readonly image = signal("data:image/png;base64,AAAA");
    public readonly label = signal("");
}

describe("AvatarComponent behavior", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HTMLElement;

    const image = (): HTMLImageElement | null => host.querySelector("img");
    const fail = (): void => {
        image()?.dispatchEvent(new Event("error"));
        fixture.detectChanges();
    };

    beforeEach(() => {
        fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        host = fixture.nativeElement.querySelector("mona-avatar");
    });

    afterEach(() => fixture.destroy());

    describe("a label's contrast", () => {
        it("defaults to the foreground meant for its background", () => {
            fixture.componentInstance.image.set("");
            fixture.componentInstance.label.set("JD");
            fixture.detectChanges();
            const label = host.querySelector("div") as HTMLElement;
            expect(label.style.color).toBe("var(--color-primary-foreground)");
            expect(host.style.backgroundColor).toBe("var(--color-primary)");
        });
    });

    describe("an image that fails", () => {
        beforeEach(() => {
            fixture.componentInstance.label.set("JD");
            fixture.detectChanges();
        });

        it("shows only the image until then", () => {
            expect(image()).not.toBeNull();
            expect(host.textContent).not.toContain("JD");
            expect(host.style.backgroundColor).toBe("transparent");
        });

        it("falls back to the label and its background", () => {
            fail();
            expect(image()).toBeNull();
            expect(host.textContent).toContain("JD");
            expect(host.style.backgroundColor).toBe("var(--color-primary)");
        });

        it("falls back to projected content when there's no label", () => {
            fixture.componentInstance.label.set("");
            fail();
            expect(host.querySelector(".projected")?.textContent).toBe("Fallback");
        });

        it("tries a new URL again", () => {
            fail();
            fixture.componentInstance.image.set("data:image/png;base64,BBBB");
            fixture.detectChanges();
            expect(image()?.getAttribute("src")).toBe("data:image/png;base64,BBBB");
            expect(host.textContent).not.toContain("JD");
        });

        it("keeps the name it had as the fallback's, from alt first", () => {
            fixture.componentInstance.alt.set("Alt name");
            fixture.componentInstance.ariaLabel.set("Jane Smith");
            fail();
            expect(host.getAttribute("role")).toBe("img");
            expect(host.getAttribute("aria-label")).toBe("Alt name");
        });

        it("keeps the name it had as the fallback's, from alt otherwise", () => {
            fixture.componentInstance.alt.set("Jane Smith");
            fail();
            expect(host.getAttribute("role")).toBe("img");
            expect(host.getAttribute("aria-label")).toBe("Jane Smith");
        });

        it("has no role or name if it never had a name", () => {
            fail();
            expect(host.getAttribute("role")).toBeNull();
            expect(host.getAttribute("aria-label")).toBeNull();
        });
    });

    describe("an image's name", () => {
        it("takes aria-label as its alt, with nothing on the host", () => {
            fixture.componentInstance.ariaLabel.set("Jane Smith");
            fixture.detectChanges();
            expect(image()?.getAttribute("alt")).toBe("Jane Smith");
            expect(host.getAttribute("aria-label")).toBeNull();
            expect(host.getAttribute("role")).toBeNull();
        });

        it("prefers alt", () => {
            fixture.componentInstance.alt.set("Alt name");
            fixture.componentInstance.ariaLabel.set("Jane Smith");
            fixture.detectChanges();
            expect(image()?.getAttribute("alt")).toBe("Alt name");
        });

        it("is decorative with neither", () => {
            expect(image()?.getAttribute("alt")).toBe("");
        });

        it("passes axe when named by aria-label", async () => {
            fixture.componentInstance.ariaLabel.set("Jane Smith");
            fixture.detectChanges();
            const result = await axe.run(fixture.nativeElement, { rules: { "color-contrast": { enabled: false } } });
            expect(result.violations).toEqual([]);
        });

        it("passes axe after failing", async () => {
            fixture.componentInstance.ariaLabel.set("Jane Smith");
            fixture.componentInstance.label.set("JS");
            fail();
            const result = await axe.run(fixture.nativeElement, { rules: { "color-contrast": { enabled: false } } });
            expect(result.violations).toEqual([]);
        });
    });

    describe("an image's box", () => {
        it("fills and crops to the avatar", () => {
            const style = image()?.style;
            expect(style?.width).toBe("100%");
            expect(style?.height).toBe("100%");
            expect(style?.objectFit).toBe("cover");
            expect(style?.display).toBe("block");
        });

        it("loads lazily, for long lists", () => {
            expect(image()?.getAttribute("loading")).toBe("lazy");
            expect(image()?.getAttribute("decoding")).toBe("async");
        });
    });
});
