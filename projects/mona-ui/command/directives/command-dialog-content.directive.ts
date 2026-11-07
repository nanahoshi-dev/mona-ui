import { Directive } from "@angular/core";

/** Marks the template a `mona-command-dialog` renders while it's open. */
@Directive({
    selector: "ng-template[monaCommandDialogContent]"
})
export class CommandDialogContentDirective {}
