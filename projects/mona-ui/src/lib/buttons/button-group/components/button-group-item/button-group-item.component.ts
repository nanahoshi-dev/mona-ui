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
     * @description Emits when the button is clicked.
     */
    public readonly click = output<MouseEvent>();

    /**
     * @internal
     * The content of the button.
     */
    public readonly content = viewChild.required(TemplateRef);

    /**
     * @description Whether the button is disabled.
     */
    public readonly disabled = model(false);

    /**
     * @description Whether the button is selected.
     */
    public readonly selected = model(false);
}
