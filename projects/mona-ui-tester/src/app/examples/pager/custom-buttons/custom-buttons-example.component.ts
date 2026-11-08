import { Component } from "@angular/core";
import { LucideChevronsLeft, LucideChevronsRight } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { PagerComponent, PagerNavigationButtonsTemplateDirective } from "@nanahoshi/mona-ui/pager";

@Component({
    selector: "app-pager-custom-buttons-example",
    imports: [
        ButtonDirective,
        LucideChevronsLeft,
        LucideChevronsRight,
        PagerComponent,
        PagerNavigationButtonsTemplateDirective
    ],
    templateUrl: "./custom-buttons-example.component.html"
})
export class PagerCustomButtonsExampleComponent {}
