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
    public readonly click = output<MouseEvent>();
    public readonly content = viewChild.required(TemplateRef);
    public readonly selected = model(false);
}
