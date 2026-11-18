import { Directive } from "@angular/core";

/**
 * @description Apply to an `<ng-template>` directly inside `<mona-alert>` to draw the alert's icon in place of the one
 * its look shows. The template receives no context, and what it renders is hidden from assistive technology, like the
 * default icon.
 */
@Directive({
    selector: "ng-template[monaAlertIconTemplate]"
})
export class AlertIconTemplateDirective {}
