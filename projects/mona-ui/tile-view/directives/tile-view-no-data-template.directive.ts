import { Directive } from "@angular/core";

/** Template shown in place of the tiles while there are no items. */
@Directive({
    selector: "ng-template[monaTileViewNoDataTemplate]"
})
export class TileViewNoDataTemplateDirective {}
