import { ChangeDetectionStrategy, Component, model, output, TemplateRef, viewChild } from "@angular/core";

@Component({
    selector: "mona-button-group-item",
    imports: [],
    template: `
        <ng-template>
            <ng-content></ng-content>
        </ng-template>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonGroupItemComponent {
    /**
     * Emits when the button is clicked.
     */
    public readonly click = output<MouseEvent>();

    /**
     * The content of the button.
     */
    public readonly content = viewChild.required(TemplateRef);

    /**
     * Whether the button is disabled.
     */
    public readonly disabled = model(false);

    /**
     * Whether the button is selected.
     */
    public readonly selected = model(false);
}
