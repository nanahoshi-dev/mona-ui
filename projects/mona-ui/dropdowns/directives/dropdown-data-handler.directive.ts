import { Directive, effect, inject, untracked } from "@angular/core";
import { ListService } from "@nanahoshi/mona-ui/internal/list";
import { DROPDOWN_DATA_INPUT_TOKEN } from "../models/DropdownDataInput";

@Directive({
    selector: "[monaDropdownDataHandler]"
})
export class DropdownDataHandlerDirective {
    readonly #host = inject(DROPDOWN_DATA_INPUT_TOKEN);
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
