import { Component } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { AccordionComponent } from "../components/accordion/accordion.component";
import { ExpansionPanelComponent } from "../components/expansion-panel/expansion-panel.component";

@Component({
    selector: "mona-test-child-panel",
    template: `<mona-expansion-panel title="In a child" />`,
    imports: [ExpansionPanelComponent]
})
class ChildPanelComponent {}

@Component({
    template: `
        <mona-accordion>
            <mona-expansion-panel title="First" />
            <mona-test-child-panel />
            <mona-expansion-panel title="Last" />
        </mona-accordion>
    `,
    imports: [AccordionComponent, ChildPanelComponent, ExpansionPanelComponent]
})
class HostComponent {}

describe("mona-accordion with a panel in a child component's template", () => {
    let fixture: ComponentFixture<HostComponent>;

    function triggers(): HTMLButtonElement[] {
        return Array.from(fixture.nativeElement.querySelectorAll("mona-expansion-panel button"));
    }

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(HostComponent);
        document.body.appendChild(fixture.nativeElement);
        await settle();
    });

    it("closes it when another panel opens", async () => {
        triggers()[1].click();
        await settle();
        expect(triggers()[1].getAttribute("aria-expanded")).toBe("true");

        triggers()[0].click();
        await settle();

        expect(triggers()[0].getAttribute("aria-expanded")).toBe("true");
        expect(triggers()[1].getAttribute("aria-expanded")).toBe("false");
    });

    it("closes another panel when it opens", async () => {
        triggers()[0].click();
        await settle();

        triggers()[1].click();
        await settle();

        expect(triggers()[0].getAttribute("aria-expanded")).toBe("false");
        expect(triggers()[1].getAttribute("aria-expanded")).toBe("true");
    });

    it("moves between the headers in document order", async () => {
        triggers()[0].focus();

        triggers()[0].dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true })
        );
        expect(document.activeElement).toBe(triggers()[1]);

        triggers()[1].dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true })
        );
        expect(document.activeElement).toBe(triggers()[2]);
    });
});
