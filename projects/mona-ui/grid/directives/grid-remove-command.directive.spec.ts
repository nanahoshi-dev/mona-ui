import { Component, signal } from "@angular/core";
import { type ComponentFixture, DeferBlockState, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridCommandColumnComponent } from "../components/grid-command-column/grid-command-column.component";
import { GridComponent } from "../components/grid/grid.component";
import type { GridRemoveEvent } from "../models/GridRemoveEvent";
import { GridCellTemplateDirective } from "./grid-cell-template.directive";
import { GridRemoveCommandDirective } from "./grid-command.directive";
import { GridEditableDirective } from "./grid-editable.directive";

interface Order {
    id: number;
    name: string;
}

@Component({
    imports: [
        GridCellTemplateDirective,
        GridColumnComponent,
        GridCommandColumnComponent,
        GridComponent,
        GridEditableDirective,
        GridRemoveCommandDirective
    ],
    template: `
        <mona-grid
            aria-label="Orders"
            rowKey="id"
            [data]="rows"
            [monaGridEditable]="{ mode: 'row' }"
            (remove)="removes.push($event)">
            <mona-grid-column field="name" title="Name"></mona-grid-column>
            <mona-grid-command-column [removeConfirmation]="confirm()">
                <ng-template monaGridCellTemplate let-row="row">
                    <button type="button" class="remove-order" [monaGridRemoveCommand]="row">Remove</button>
                </ng-template>
            </mona-grid-command-column>
        </mona-grid>
    `
})
class RemoveCommandHostComponent {
    public readonly confirm = signal(true);
    public readonly removes: GridRemoveEvent[] = [];
    public readonly rows: Order[] = [
        { id: 1, name: "First" },
        { id: 2, name: "Second" }
    ];
}

describe("GridRemoveCommandDirective", () => {
    let fixture: ComponentFixture<RemoveCommandHostComponent>;
    let host: RemoveCommandHostComponent;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        for (const block of await fixture.getDeferBlocks()) {
            await block.render(DeferBlockState.Complete);
        }
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function removeButton(): HTMLButtonElement {
        return fixture.nativeElement.querySelector("button.remove-order") as HTMLButtonElement;
    }

    function confirmDialog(): HTMLElement | null {
        return document.querySelector("[role='alertdialog'], [role='dialog']");
    }

    function dialogButton(text: string): HTMLButtonElement {
        const buttons = Array.from(confirmDialog()?.querySelectorAll("button") ?? []);
        const button = buttons.find(candidate => candidate.textContent?.trim() === text);
        if (button == null) {
            throw new Error(`No dialog button "${text}"`);
        }
        return button;
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(RemoveCommandHostComponent);
        host = fixture.componentInstance;
        document.body.appendChild(fixture.nativeElement as HTMLElement);
        await settle();
    });

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
        fixture.destroy();
        document.querySelectorAll(".cdk-overlay-container").forEach(container => container.remove());
    });

    it("asks first inside a command column with removeConfirmation, and removes once the user confirms", async () => {
        removeButton().click();
        await settle();

        expect(host.removes).toHaveLength(0);
        expect(confirmDialog()).not.toBeNull();

        dialogButton("Delete").click();
        await settle();

        expect(host.removes).toHaveLength(1);
        expect(host.removes[0].key).toBe(1);
    });

    it("doesn't remove when the user cancels", async () => {
        removeButton().click();
        await settle();

        dialogButton("Cancel").click();
        await settle();

        expect(host.removes).toHaveLength(0);
    });

    it("removes at once without removeConfirmation", async () => {
        host.confirm.set(false);
        await settle();

        removeButton().click();
        await settle();

        expect(confirmDialog()).toBeNull();
        expect(host.removes).toHaveLength(1);
    });
});
