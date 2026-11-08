import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideChevronLeft, LucideChevronRight } from "@lucide/angular";
import { DocsNavigationService } from "../../services/docs-navigation.service";

/** Links to the previous and next pages in reading order, at the end of a page. */
@Component({
    selector: "app-docs-pager",
    imports: [LucideChevronLeft, LucideChevronRight, RouterLink],
    templateUrl: "./docs-pager.component.html"
})
export class DocsPagerComponent {
    protected readonly navigation = inject(DocsNavigationService);
}
