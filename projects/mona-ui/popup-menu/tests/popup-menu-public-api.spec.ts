import { Component, viewChild } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PopupMenuComponent, PopupMenuItemComponent } from "../public-api";
import * as publicApi from "../public-api";

@Component({
    imports: [PopupMenuComponent, PopupMenuItemComponent],
    template: `
        <span id="menu-name">Row actions</span>
        <button #target type="button">Open</button>
        <mona-popup-menu aria-labelledby="menu-name" trigger="none" [target]="target">
            <mona-popup-menu-item label="Edit"></mona-popup-menu-item>
        </mona-popup-menu>
    `
})
class ManualMenuHostComponent {
    public readonly menu = viewChild.required(PopupMenuComponent);
}

function menus(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>("[role='menu']"));
}

describe("popup menu public API", () => {
    it("exports what consumers use", () => {
        expect(publicApi.PopupMenuComponent).toBeDefined();
        expect(publicApi.PopupMenuItemClickEvent).toBeDefined();
    });

    it.each([
        "PopupMenuToken",
        "PopupMenuRadioItemToken",
        "PopupMenuGroupTemplateToken",
        "PopupMenuIconTemplateToken",
        "PopupMenuShortcutTemplateToken",
        "PopupMenuTextTemplateToken",
        "PopupMenuOrigin",
        "PopupMenuItemType",
        "PopupMenuTemplateOrigin",
        "PopupMenuTemplateType",
        "ensurePopupComponentTypes",
        "ensurePopupTemplateTypes",
        "preparePopupMenuItems"
    ])("keeps the engine's %s out", name => {
        expect(publicApi).not.toHaveProperty(name);
    });

    describe('with trigger="none"', () => {
        let fixture: ComponentFixture<ManualMenuHostComponent>;

        async function settle(): Promise<void> {
            fixture.detectChanges();
            await fixture.whenStable();
            await new Promise(resolve => setTimeout(resolve, 5));
            fixture.detectChanges();
        }

        beforeEach(async () => {
            fixture = TestBed.createComponent(ManualMenuHostComponent);
            document.body.appendChild(fixture.nativeElement);
            await settle();
        });

        afterEach(() => {
            (fixture.nativeElement as HTMLElement).remove();
            document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
        });

        it("ignores clicks on the target", async () => {
            (fixture.nativeElement as HTMLElement).querySelector("button")?.click();
            await settle();

            expect(menus()).toHaveLength(0);
        });

        it("opens through openMenu(), named by aria-labelledby", async () => {
            fixture.componentInstance.menu().openMenu();
            await settle();

            expect(menus()).toHaveLength(1);
            expect(menus()[0].getAttribute("aria-labelledby")).toBe("menu-name");
        });
    });
});
