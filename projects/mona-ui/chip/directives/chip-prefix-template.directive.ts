import { Directive } from "@angular/core";

/**
 * @description Apply to an `<ng-template>` directly inside `<mona-chip>` to render prefix content
 * (e.g., an avatar or icon) before the chip label or projected content. The template receives no context.
 */
@Directive({
    selector: "ng-template[monaChipPrefixTemplate]"
})
export class ChipPrefixTemplateDirective {}
