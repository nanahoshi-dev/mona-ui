import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter, RouterLink } from "@angular/router";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChipComponent } from "../component/chip.component";
import { chipThemeVariants } from "../styles/chip.styles";

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function press(target: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    target.dispatchEvent(event);
    return event;
}

async function expectNoAxeViolations(element: HTMLElement): Promise<void> {
    const result = await axe.run(element, {
        rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
    });
    expect(result.violations.map(violation => violation.id)).toEqual([]);
}

@Component({
    template: `
        <mona-chip
            [aria-label]="ariaLabel()"
            [disabled]="disabled()"
            [label]="label()"
            [removable]="removable()"
            [removeLabel]="removeLabel()"
            [tabindex]="tabindex()"
            [toggleable]="toggleable()"
            [(selected)]="selected"
            (contentClick)="activations = activations + 1"
            (remove)="removed.push($event)">
            @if (projectedButton()) {
                <button type="button" id="inner">Inner</button>
            }
        </mona-chip>
    `,
    imports: [ChipComponent]
})
class HostComponent {
    public readonly ariaLabel = signal("");
    public readonly disabled = signal(false);
    public readonly label = signal("Red");
    public readonly projectedButton = signal(false);
    public readonly removable = signal(false);
    public readonly removeLabel = signal<string | undefined>(undefined);
    public readonly removed: Event[] = [];
    public readonly selected = signal(false);
    public readonly tabindex = signal<number | undefined>(undefined);
    public readonly toggleable = signal(false);
    public activations = 0;
}

@Component({
    template: `
        <mona-chip routerLink="/overview" label="Overview" [removable]="removable()" (remove)="removed = removed + 1" />
    `,
    imports: [ChipComponent, RouterLink]
})
class LinkHostComponent {
    public readonly removable = signal(false);
    public removed = 0;
}

describe("chip behavior", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    const chip = (): HTMLElement => fixture.nativeElement.querySelector("mona-chip");
    const control = (): HTMLElement => chip().querySelector("[role='checkbox']") as HTMLElement;
    const removeButton = (): HTMLButtonElement => chip().querySelector("button[data-chip-remove]") as HTMLButtonElement;

    beforeEach(async () => {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        await settle(fixture);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("a toggleable, removable chip", () => {
        beforeEach(async () => {
            host.toggleable.set(true);
            host.removable.set(true);
            await settle(fixture);
        });

        it("keeps the checkbox beside the remove button, not around it", () => {
            expect(chip().getAttribute("role")).toBe("group");
            expect(chip().hasAttribute("tabindex")).toBe(false);
            expect(chip().hasAttribute("aria-checked")).toBe(false);
            expect(control().getAttribute("tabindex")).toBe("0");
            expect(control().getAttribute("aria-checked")).toBe("false");
            expect(control().textContent?.trim()).toBe("Red");
            expect(control().contains(removeButton())).toBe(false);
        });

        it("has no axe violations", async () => {
            await expectNoAxeViolations(fixture.nativeElement);
        });

        it("toggles from the checkbox by key", async () => {
            press(control(), " ");
            await settle(fixture);

            expect(host.selected()).toBe(true);
            expect(control().getAttribute("aria-checked")).toBe("true");
        });

        it("toggles when a click lands on the chip", async () => {
            chip().click();
            await settle(fixture);

            expect(host.selected()).toBe(true);
        });

        it("doesn't toggle from the remove button", async () => {
            removeButton().click();
            press(removeButton(), "Enter");
            await settle(fixture);

            expect(host.selected()).toBe(false);
            expect(host.removed.length).toBe(1);
        });

        it("puts the name on the checkbox", async () => {
            host.ariaLabel.set("Filter by red");
            await settle(fixture);

            expect(control().getAttribute("aria-label")).toBe("Filter by red");
            expect(chip().hasAttribute("aria-label")).toBe(false);
        });

        it("disables the checkbox and takes it out of the tab order", async () => {
            host.disabled.set(true);
            await settle(fixture);

            expect(control().getAttribute("aria-disabled")).toBe("true");
            expect(control().getAttribute("tabindex")).toBe("-1");
        });

        it("takes tabindex on the checkbox", async () => {
            host.tabindex.set(-1);
            await settle(fixture);

            expect(control().getAttribute("tabindex")).toBe("-1");
            expect(chip().hasAttribute("tabindex")).toBe(false);
        });
    });

    describe("Delete and Backspace", () => {
        beforeEach(async () => {
            host.removable.set(true);
            await settle(fixture);
        });

        it.each(["Delete", "Backspace"])("%s on the chip removes it", key => {
            const event = press(chip(), key);

            expect(host.removed).toEqual([event]);
            expect(event.defaultPrevented).toBe(true);
        });

        it("works from the remove button too", () => {
            press(removeButton(), "Delete");

            expect(host.removed.length).toBe(1);
        });

        it("works from the checkbox of a toggleable chip", async () => {
            host.toggleable.set(true);
            await settle(fixture);

            press(control(), "Delete");

            expect(host.removed.length).toBe(1);
        });

        it("leaves a key alone on a chip that can't be removed", async () => {
            host.removable.set(false);
            await settle(fixture);

            const event = press(chip(), "Delete");

            expect(host.removed).toEqual([]);
            expect(event.defaultPrevented).toBe(false);
        });

        it("does nothing while disabled", async () => {
            host.disabled.set(true);
            await settle(fixture);

            press(chip(), "Delete");

            expect(host.removed).toEqual([]);
        });

        it("leaves a key in projected content alone", async () => {
            host.label.set("");
            host.projectedButton.set(true);
            await settle(fixture);

            const event = press(chip().querySelector("#inner") as HTMLElement, "Backspace");

            expect(host.removed).toEqual([]);
            expect(event.defaultPrevented).toBe(false);
        });
    });

    describe("activation", () => {
        beforeEach(async () => {
            host.toggleable.set(true);
            await settle(fixture);
        });

        it.each(["Enter", " "])("%j toggles once while held", key => {
            press(chip(), key);
            const repeat = press(chip(), key, { repeat: true });

            expect(host.activations).toBe(1);
            expect(repeat.defaultPrevented).toBe(true);
        });

        it("a click on a projected control doesn't toggle", async () => {
            host.label.set("");
            host.projectedButton.set(true);
            await settle(fixture);

            (chip().querySelector("#inner") as HTMLElement).click();

            expect(host.activations).toBe(0);
        });

        it("a key on a projected control doesn't toggle", async () => {
            host.label.set("");
            host.projectedButton.set(true);
            await settle(fixture);

            const event = press(chip().querySelector("#inner") as HTMLElement, "Enter");

            expect(host.activations).toBe(0);
            expect(event.defaultPrevented).toBe(false);
        });

        it("a key on a chip that doesn't toggle is left alone", async () => {
            host.toggleable.set(false);
            await settle(fixture);

            const event = press(chip(), " ");

            expect(event.defaultPrevented).toBe(false);
        });

        it("a click on a chip that doesn't toggle does nothing", async () => {
            host.toggleable.set(false);
            await settle(fixture);

            chip().click();

            expect(host.selected()).toBe(false);
            expect(host.activations).toBe(0);
        });
    });

    describe("names", () => {
        it("a passive chip has no role and no name, so its text reads itself", () => {
            expect(chip().hasAttribute("role")).toBe(false);
            expect(chip().hasAttribute("aria-label")).toBe(false);
            expect(chip().hasAttribute("tabindex")).toBe(false);
        });

        it("a passive chip with a name is a named group", async () => {
            host.ariaLabel.set("Status: active");
            await settle(fixture);

            expect(chip().getAttribute("role")).toBe("group");
            expect(chip().getAttribute("aria-label")).toBe("Status: active");
            await expectNoAxeViolations(fixture.nativeElement);
        });

        it("disabling a passive chip adds no state with no role to hold it", async () => {
            host.disabled.set(true);
            await settle(fixture);

            expect(chip().hasAttribute("aria-disabled")).toBe(false);
            expect(chip().hasAttribute("tabindex")).toBe(false);
            await expectNoAxeViolations(fixture.nativeElement);
        });

        it("a toggleable chip reads its text, and an aria-label replaces it", async () => {
            host.toggleable.set(true);
            await settle(fixture);
            expect(chip().hasAttribute("aria-label")).toBe(false);

            host.ariaLabel.set("Filter by red");
            await settle(fixture);
            expect(chip().getAttribute("aria-label")).toBe("Filter by red");
        });

        it("names the remove button after the label", async () => {
            host.removable.set(true);
            await settle(fixture);

            expect(removeButton().getAttribute("aria-label")).toBe("Remove, Red");
        });

        it("names the remove button after aria-label when there's no label", async () => {
            host.label.set("");
            host.ariaLabel.set("Team");
            host.removable.set(true);
            await settle(fixture);

            expect(removeButton().getAttribute("aria-label")).toBe("Remove, Team");
        });

        it("an empty removeLabel falls back, so the button keeps a name", async () => {
            host.removable.set(true);
            host.removeLabel.set("");
            await settle(fixture);

            expect(removeButton().getAttribute("aria-label")).toBe("Remove, Red");
            await expectNoAxeViolations(fixture.nativeElement);
        });

        it.each([
            ["label", (): void => host.label.set("Red")],
            ["aria-label", (): void => host.ariaLabel.set("Red")],
            ["removeLabel", (): void => host.removeLabel.set("Remove red")]
        ])("doesn't warn with a %s", async (_name, name) => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
            const other = TestBed.createComponent(HostComponent);
            fixture = other;
            host = other.componentInstance;
            host.label.set("");
            host.removable.set(true);
            name();
            await settle(other);

            expect(warn).not.toHaveBeenCalled();
        });

        it("warns about a remove button that reads as a generic item", async () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
            const other = TestBed.createComponent(HostComponent);
            other.componentInstance.label.set("");
            other.componentInstance.removable.set(true);
            await settle(other);

            expect(warn).toHaveBeenCalledTimes(1);
            expect(warn.mock.calls[0][0]).toContain("[Mona Chip]");
        });
    });

    describe("styles", () => {
        const classes = (props: Parameters<typeof chipThemeVariants>[0]): string[] =>
            chipThemeVariants(props).split(/\s+/);

        it("has a solid focus outline on every interactive look", () => {
            for (const look of ["default", "primary", "outline", "ghost"] as const) {
                const list = classes({ interactive: true, look });
                expect(list).toContain("focus-visible:outline-2");
                expect(list).toContain("focus-visible:outline-focus-indicator");
                expect(list).not.toContain("focus-visible:ring-2");
            }
        });

        it("doesn't switch its outline off, since outline-none would also stop the focus style", () => {
            expect(classes({})).not.toContain("outline-none");
        });

        it("adds a border when selected under high contrast and forced colors", () => {
            expect(classes({ selected: true })).toContain("contrast-more:after:border-2");
            expect(classes({ selected: true })).toContain("forced-colors:after:border-2");
            expect(classes({ selected: false })).not.toContain("contrast-more:after:border-2");
        });

        it.each([
            ["small", "before:-inset-1.5"],
            ["medium", "before:-inset-1"],
            ["large", "before:-inset-0.5"]
        ] as const)("gives a %s remove button a 24px target", (size, inset) => {
            expect(classes({ size }).join(" ")).toContain(`[&_button[data-chip-remove='true']]:${inset}`);
        });

        it("the inner checkbox has its own focus outline", async () => {
            host.toggleable.set(true);
            host.removable.set(true);
            await settle(fixture);

            expect(control().classList.contains("focus-visible:outline-2")).toBe(true);
        });

        it("the wrapper stays out of a chip's layout when it isn't a control", () => {
            expect((chip().firstElementChild as HTMLElement).classList.contains("contents")).toBe(true);
        });
    });
});

describe("link chip", () => {
    let fixture: ComponentFixture<LinkHostComponent>;

    const chip = (): HTMLElement => fixture.nativeElement.querySelector("mona-chip");

    beforeEach(async () => {
        TestBed.configureTestingModule({ providers: [provideRouter([{ path: "**", children: [] }])] });
        fixture = TestBed.createComponent(LinkHostComponent);
        await settle(fixture);
    });

    it("is a link, in the tab order", () => {
        expect(chip().getAttribute("role")).toBe("link");
        expect(chip().getAttribute("tabindex")).toBe("0");
    });

    it("clicks with Enter, once while held, and not with Space", () => {
        const click = vi.spyOn(chip(), "click");

        press(chip(), "Enter");
        press(chip(), "Enter", { repeat: true });
        const space = press(chip(), " ");

        expect(click).toHaveBeenCalledTimes(1);
        expect(space.defaultPrevented).toBe(false);
    });

    it("keeps the link beside the remove button", async () => {
        fixture.componentInstance.removable.set(true);
        await settle(fixture);
        const link = chip().querySelector("[role='link']") as HTMLElement;

        expect(chip().getAttribute("role")).toBe("group");
        expect(chip().hasAttribute("tabindex")).toBe(false);
        expect(link.getAttribute("tabindex")).toBe("0");
        expect(link.contains(chip().querySelector("button"))).toBe(false);
        await expect(
            axe.run(fixture.nativeElement, {
                rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
            })
        ).resolves.toMatchObject({ violations: [] });
    });

    it("navigates with Enter from the inner link", async () => {
        fixture.componentInstance.removable.set(true);
        await settle(fixture);
        const click = vi.spyOn(chip(), "click");

        press(chip().querySelector("[role='link']") as HTMLElement, "Enter");

        expect(click).toHaveBeenCalledTimes(1);
    });
});
