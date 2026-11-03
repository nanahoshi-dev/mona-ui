import { Directive } from "@angular/core";

@Directive({
    selector: `
        ng-template[monaDropDownGroupHeaderTemplate],
        ng-template[monaAutoCompleteGroupHeaderTemplate],
        ng-template[monaDropDownListGroupHeaderTemplate],
        ng-template[monaComboBoxGroupHeaderTemplate],
        ng-template[monaMultiSelectGroupHeaderTemplate]
  `
})
export class DropdownGroupHeaderTemplateDirective {}
