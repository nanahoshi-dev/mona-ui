import { Component, ElementRef, afterRenderEffect, inject } from "@angular/core";
import { LucideSearch, LucideSparkles } from "@lucide/angular";
import { DocsNavigationService } from "../../services/docs-navigation.service";
import { SidebarGroupComponent } from "../sidebar-group/sidebar-group.component";

@Component({
    selector: "app-sidebar",
    imports: [SidebarGroupComponent, LucideSearch, LucideSparkles],
    templateUrl: "./sidebar.component.html",
    host: {
        class: "flex flex-col h-full"
    }
})
export class SidebarComponent {
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

    protected readonly navigation = inject(DocsNavigationService);

    public constructor() {
        // A page far down the list, reached by a link or a reload, would otherwise be out of sight.
        afterRenderEffect(() => {
            if (this.navigation.currentPage()) {
                this.#elementRef.nativeElement
                    .querySelector("a[aria-current='page']")
                    ?.scrollIntoView?.({ block: "nearest" });
            }
        });
    }
}
