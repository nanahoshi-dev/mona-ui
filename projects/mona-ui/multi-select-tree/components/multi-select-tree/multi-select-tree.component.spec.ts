import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { form, FormField, minLength } from "@angular/forms/signals";
import { MultiSelectSummaryTagDirective } from "@nanahoshi/mona-ui/multi-select";
import axe from "axe-core";
import type { AdaptiveMode } from "@nanahoshi/mona-ui/dropdowns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MultiSelectTreeComponent } from "./multi-select-tree.component";

interface Permission {
    readonly id: string;
    readonly label: string;
    readonly locked?: boolean;
    readonly permissions?: readonly Permission[];
}

const PERMISSIONS: readonly Permission[] = [
    {
        id: "orders",
        label: "Orders",
        permissions: [
            { id: "orders.view", label: "View orders" },
            { id: "orders.edit", label: "Edit orders" },
            { id: "orders.refund", label: "Issue refunds", locked: true }
        ]
    },
    {
        id: "team",
        label: "Team",
        permissions: [
            { id: "team.invite", label: "Invite members" },
            { id: "team.roles", label: "Change roles" }
        ]
    }
];

@Component({
    template: `
        <span id="permissions-label">Permissions</span>
        <mona-multi-select-tree
            aria-labelledby="permissions-label"
            children="permissions"
            [adaptiveMode]="adaptiveMode()"
            itemDisabled="locked"
            placeholder="Grant permissions"
            textField="label"
            valueField="id"
            [checkParents]="checkParents()"
            [data]="permissions"
            [monaMultiSelectSummaryTag]="tagCount()"
            [showClearButton]="true"
            [valuePrimitive]="true"
            [(value)]="value">
        </mona-multi-select-tree>
    `,
    imports: [MultiSelectSummaryTagDirective, MultiSelectTreeComponent]
})
class PrimitiveHostComponent {
    protected readonly permissions = PERMISSIONS;
    public readonly adaptiveMode = signal<AdaptiveMode>("none");
    public readonly checkParents = signal(true);
    public readonly tagCount = signal(-1);
    public readonly value = signal<string[]>([]);
}

@Component({
    template: `
        <mona-multi-select-tree
            aria-label="Permissions"
            children="permissions"
            textField="label"
            valueField="id"
            [data]="permissions"
            [formField]="model.granted">
        </mona-multi-select-tree>
    `,
    imports: [FormField, MultiSelectTreeComponent]
})
class FormHostComponent {
    readonly #model = signal<{ granted: Permission[] }>({ granted: [] });
    protected readonly permissions = PERMISSIONS;
    public readonly model = form(this.#model, path => {
        minLength(path.granted, 1);
    });
}

describe("MultiSelectTreeComponent", () => {
    beforeEach(() => clearOverlays());
    afterEach(() => {
        clearOverlays();
        vi.unstubAllGlobals();
    });

    it("is a combobox that opens a checkbox tree", async () => {
        const fixture = await render(PrimitiveHostComponent);
        const host = getHost(fixture);
        expect(host.getAttribute("role")).toBe("combobox");
        expect(host.getAttribute("aria-haspopup")).toBe("tree");
        expect(host.textContent).toContain("Grant permissions");
        await openPopup(fixture);
        const tree = document.querySelector("[role='tree']") as HTMLElement;
        expect(host.getAttribute("aria-controls")).toBe(tree.id);
        expect(getNode("Orders").getAttribute("aria-checked")).toBe("false");
        expect(getNode("Orders").hasAttribute("aria-selected")).toBe(false);
    });

    it("shows a tag for each item of the value", async () => {
        const fixture = await render(PrimitiveHostComponent);
        fixture.componentInstance.value.set(["team.roles", "orders.view"]);
        await stable(fixture);
        expect(tagTexts(fixture)).toEqual(["Change roles", "View orders"]);
    });

    it("checks a clicked node with its children, and lists the value in the tree's order", async () => {
        const fixture = await render(PrimitiveHostComponent);
        fixture.componentInstance.value.set(["team.roles"]);
        await stable(fixture);
        await openPopup(fixture);
        clickNode("Orders");
        await stable(fixture);
        expandNode("Orders");
        await stable(fixture);
        // The locked refund permission stays as it is, so Orders isn't all checked.
        expect(fixture.componentInstance.value()).toEqual(["orders", "orders.view", "orders.edit", "team.roles"]);
        expect(getHost(fixture).getAttribute("aria-expanded")).toBe("true");
        expect(getNode("View orders").getAttribute("aria-checked")).toBe("true");
        expect(getNode("Issue refunds").getAttribute("aria-checked")).toBe("false");
    });

    it("checks a parent whose children are all checked, and shows a mixed parent", async () => {
        const fixture = await render(PrimitiveHostComponent);
        await openPopup(fixture);
        await press(fixture, "ArrowDown");
        await press(fixture, "ArrowRight");
        await press(fixture, "ArrowDown");
        expect(getHost(fixture).getAttribute("aria-activedescendant")).toBe(getNode("Invite members").id);
        await press(fixture, " ");
        expect(getNode("Team").getAttribute("aria-checked")).toBe("mixed");
        await press(fixture, "ArrowDown");
        await press(fixture, "Enter");
        expect(getNode("Team").getAttribute("aria-checked")).toBe("true");
        expect(fixture.componentInstance.value()).toEqual(["team", "team.invite", "team.roles"]);
        expect(getHost(fixture).getAttribute("aria-expanded")).toBe("true");
    });

    it("leaves parents unchecked without checkParents", async () => {
        const fixture = await render(PrimitiveHostComponent);
        fixture.componentInstance.checkParents.set(false);
        await stable(fixture);
        await openPopup(fixture);
        clickNode("Team");
        await stable(fixture);
        expandNode("Team");
        await stable(fixture);
        clickNode("Invite members");
        await stable(fixture);
        expect(fixture.componentInstance.value()).toEqual(["team", "team.roles"]);
    });

    it("doesn't check a disabled node", async () => {
        const fixture = await render(PrimitiveHostComponent);
        await openPopup(fixture);
        clickNode("Orders");
        await stable(fixture);
        expandNode("Orders");
        await stable(fixture);
        clickNode("Issue refunds");
        await stable(fixture);
        expect(fixture.componentInstance.value()).not.toContain("orders.refund");
        expect(getNode("Issue refunds").getAttribute("aria-disabled")).toBe("true");
    });

    it("unchecks a tag's item, with its children, from the tag's remove button", async () => {
        const fixture = await render(PrimitiveHostComponent);
        fixture.componentInstance.value.set(["team", "team.invite", "team.roles", "orders.view"]);
        await stable(fixture);
        removeTag(fixture, "Team");
        await stable(fixture);
        expect(fixture.componentInstance.value()).toEqual(["orders.view"]);
    });

    it("unchecks the last tag's item with Backspace", async () => {
        const fixture = await render(PrimitiveHostComponent);
        fixture.componentInstance.value.set(["orders.view", "team.roles"]);
        await stable(fixture);
        await press(fixture, "Backspace");
        expect(fixture.componentInstance.value()).toEqual(["orders.view"]);
    });

    it("sums up the tags after tagCount, and its remove button unchecks those items", async () => {
        const fixture = await render(PrimitiveHostComponent);
        fixture.componentInstance.tagCount.set(1);
        fixture.componentInstance.value.set(["orders.view", "orders.edit", "team.roles"]);
        await stable(fixture);
        expect(tagTexts(fixture)).toEqual(["View orders", "+ 2 items"]);
        removeTag(fixture, "+ 2 items");
        await stable(fixture);
        expect(fixture.componentInstance.value()).toEqual(["orders.view"]);
    });

    it("clears every item with the clear button", async () => {
        const fixture = await render(PrimitiveHostComponent);
        fixture.componentInstance.value.set(["orders.view"]);
        await stable(fixture);
        (fixture.nativeElement.querySelector("mona-indicator-icon[preset='clear']") as HTMLElement).click();
        await stable(fixture);
        expect(fixture.componentInstance.value()).toEqual([]);
    });

    it("works with signal forms, holding the whole items", async () => {
        const fixture = await render(FormHostComponent);
        const host = getHost(fixture);
        host.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
        await stable(fixture);
        expect(host.getAttribute("aria-invalid")).toBe("true");
        await openPopup(fixture);
        clickNode("Team");
        await stable(fixture);
        expect(
            fixture.componentInstance.model
                .granted()
                .value()
                .map(permission => permission.id)
        ).toEqual(["team", "team.invite", "team.roles"]);
        expect(host.hasAttribute("aria-invalid")).toBe(false);
        expect(tagTexts(fixture)).toEqual(["Team", "Invite members", "Change roles"]);
    });

    it("opens a bottom sheet on a small screen, which stays open while nodes are checked", async () => {
        vi.stubGlobal(
            "matchMedia",
            vi.fn((query: string) => ({
                addEventListener: vi.fn(),
                matches: true,
                media: query,
                removeEventListener: vi.fn()
            }))
        );
        const fixture = await render(PrimitiveHostComponent);
        fixture.componentInstance.adaptiveMode.set("auto");
        await stable(fixture);
        await openPopup(fixture);

        const sheet = document.querySelector("mona-dropdown-sheet") as HTMLElement;
        expect(sheet.querySelector("header")?.textContent?.trim()).toBe("Permissions");
        // The tree's rows are taller in the sheet, to be easy to tap.
        expect(sheet.querySelector("[role='tree']")?.closest("[class*='py-2.5']")).not.toBeNull();
        clickNode("Team");
        await stable(fixture);
        expect(fixture.componentInstance.value()).toEqual(["team", "team.invite", "team.roles"]);
        expect(document.querySelector("mona-dropdown-sheet")).not.toBeNull();
        const results = await axe.run(document.body, { rules: { region: { enabled: false } } });
        expect(results.violations.map(violation => violation.id)).toEqual([]);
    });

    it("has no axe violations with the popup open", async () => {
        const fixture = await render(PrimitiveHostComponent);
        fixture.componentInstance.value.set(["orders.view"]);
        await stable(fixture);
        await openPopup(fixture);
        const results = await axe.run(document.body, { rules: { region: { enabled: false } } });
        expect(results.violations.map(violation => violation.id)).toEqual([]);
    });
});

async function render<T>(component: new () => T): Promise<ComponentFixture<T>> {
    await TestBed.configureTestingModule({ imports: [component] }).compileComponents();
    const fixture = TestBed.createComponent(component);
    await stable(fixture);
    return fixture;
}

async function stable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

async function openPopup(fixture: ComponentFixture<unknown>): Promise<void> {
    getHost(fixture).click();
    await stable(fixture);
    await new Promise(resolve => setTimeout(resolve, 0));
    await stable(fixture);
}

async function press(fixture: ComponentFixture<unknown>, key: string): Promise<void> {
    getHost(fixture).dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
    await stable(fixture);
}

function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement.querySelector("mona-multi-select-tree") as HTMLElement;
}

function tagTexts(fixture: ComponentFixture<unknown>): string[] {
    return Array.from(getHost(fixture).querySelectorAll("mona-chip"), chip => chip.textContent?.trim() ?? "");
}

function removeTag(fixture: ComponentFixture<unknown>, text: string): void {
    const chip = Array.from(getHost(fixture).querySelectorAll("mona-chip")).find(
        candidate => candidate.textContent?.trim() === text
    );
    const button = chip?.querySelector("button, [role='button']") as HTMLElement | null;
    if (!button) {
        throw new Error(`Tag not found: ${text}`);
    }
    button.click();
}

function getNodes(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>(".cdk-overlay-container [role='treeitem']"));
}

function getNode(text: string): HTMLElement {
    const node = getNodes().find(candidate => candidate.querySelector("mona-tree-node")?.textContent?.trim() === text);
    if (!node) {
        throw new Error(`Node not found: ${text}`);
    }
    return node;
}

function clickNode(text: string): void {
    (getNode(text).querySelector("mona-tree-node > div") as HTMLElement).click();
}

/** Opens a node with its arrow, which doesn't check it. */
function expandNode(text: string): void {
    (getNode(text).querySelector("button") as HTMLButtonElement).click();
}

function clearOverlays(): void {
    document.querySelectorAll(".cdk-overlay-container").forEach(container => container.replaceChildren());
}
