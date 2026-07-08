import { Component, output } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ButtonDirective } from "@mirei/mona-ui/button";
import { NumericTextBoxComponent } from "@mirei/mona-ui/numeric-text-box";
import { TextBoxComponent } from "@mirei/mona-ui/text-box";
import { EditorImageFormOptions } from "../../models/EditorImageFormOptions";
import { EditorImageInsertEvent } from "../../models/EditorImageInsertEvent";

@Component({
    selector: "mona-editor-image-inserter",
    imports: [TextBoxComponent, ReactiveFormsModule, ButtonDirective, NumericTextBoxComponent],
    templateUrl: "./editor-image-inserter.component.html",
    styleUrl: "./editor-image-inserter.component.scss"
})
export class EditorImageInserterComponent {
    protected readonly imageForm = new FormGroup<EditorImageFormOptions>({
        altText: new FormControl(""),
        height: new FormControl(null),
        link: new FormControl("", { nonNullable: true, validators: [Validators.required] }),
        width: new FormControl(null)
    });

    public readonly cancel = output();
    public readonly insert = output<EditorImageInsertEvent>();

    public onCancel(): void {
        this.cancel.emit();
    }

    public onImageInsert(): void {
        this.insert.emit({
            altText: this.imageForm.controls.altText.value ?? "",
            height: this.imageForm.controls.height.value,
            link: this.imageForm.controls.link.value,
            width: this.imageForm.controls.width.value
        });
    }
}
