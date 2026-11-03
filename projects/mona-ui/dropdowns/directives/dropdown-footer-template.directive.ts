import { Directive } from "@angular/core";

@Directive({
    selector: `
        ng-template[monaDropDownFooterTemplate],
        ng-template[monaAutoCompleteFooterTemplate],
        ng-template[monaDropDownListFooterTemplate],
        ng-template[monaDropDownTreeFooterTemplate],
        ng-template[monaComboBoxFooterTemplate],
        ng-template[monaMultiSelectFooterTemplate]
    `
})
export class DropdownFooterTemplateDirective {}
