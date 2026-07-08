import { Directive, effect, inject, untracked } from "@angular/core";
import { ListService } from "@mirei/mona-ui/list";
import { DropdownDataInputToken } from "../models/DropdownDataInput";

@Directive({
    selector: "[monaDropdownDataHandler]"
})
export class DropdownDataHandlerDirective {
    readonly #host = inject(DropdownDataInputToken);
    readonly #listService = inject(ListService);
    public constructor() {
        effect(() => {
            const data = this.#host.data();
            untracked(() => this.#listService.setData(data));
        });
        effect(() => {
            const itemDisabled = this.#host.itemDisabled() ?? "";
            untracked(() => this.#listService.setDisabledBy(itemDisabled));
        });
        effect(() => {
            const textField = this.#host.textField() ?? "";
            untracked(() => this.#listService.setTextField(textField));
        });
        effect(() => {
            const valueField = this.#host.valueField() ?? "";
            untracked(() => this.#listService.setValueField(valueField));
        });
    }
}
