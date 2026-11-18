import { Directive } from "@angular/core";

@Directive({
    selector: `
        ng-template[monaDropDownItemTemplate],
        ng-template[monaAutoCompleteItemTemplate],
        ng-template[monaDropDownListItemTemplate],
        ng-template[monaDropDownTreeItemTemplate],
        ng-template[monaComboBoxItemTemplate],
        ng-template[monaMultiSelectItemTemplate],
        ng-template[monaMultiSelectTreeItemTemplate]
    `
})
export class DropdownItemTemplateDirective {}
