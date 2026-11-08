import { Component, signal } from "@angular/core";
import { email, form, FormField, required } from "@angular/forms/signals";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import type { DialogAction, DialogActionEvent } from "@nanahoshi/mona-ui/dialog";
import { DialogComponent, DialogContentTemplateDirective } from "@nanahoshi/mona-ui/dialog";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";

interface ContactModel {
    email: string;
    name: string;
}

@Component({
    selector: "app-dialog-form-example",
    imports: [
        ButtonDirective,
        DialogComponent,
        DialogContentTemplateDirective,
        FormField,
        LabelComponent,
        TextBoxComponent
    ],
    templateUrl: "./form-example.component.html"
})
export class DialogFormExampleComponent {
    readonly #model = signal<ContactModel>({ email: "", name: "" });
    protected readonly actions: DialogAction<string>[] = [
        { data: "cancel", text: "Cancel" },
        { data: "save", default: true, look: "primary", text: "Save" }
    ];
    protected readonly contact = form(this.#model, path => {
        required(path.name, { message: "Enter a name." });
        required(path.email, { message: "Enter an email address." });
        email(path.email, { message: "Enter a valid email address." });
    });
    protected readonly open = signal(false);
    protected readonly saved = signal<ContactModel | null>(null);

    protected onAction(event: DialogActionEvent): void {
        if (event.action.data !== "save") {
            return;
        }
        if (this.contact().invalid()) {
            // Keeps the dialog open and shows every field's error.
            event.preventDefault();
            this.contact().markAsTouched();
            return;
        }
        this.saved.set(this.#model());
    }

    protected openDialog(): void {
        this.#model.set({ email: "", name: "" });
        this.contact().reset();
        this.open.set(true);
    }
}
