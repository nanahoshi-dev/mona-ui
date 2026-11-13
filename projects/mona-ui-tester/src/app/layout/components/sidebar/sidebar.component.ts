import { Component, ElementRef, afterRenderEffect, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideBraces, LucideSearch, LucideSparkles } from "@lucide/angular";
import { CommandShortcutComponent } from "@nanahoshi/mona-ui/command";
import { DocsNavigationService } from "../../services/docs-navigation.service";
import { DocsSearchService } from "../../services/docs-search.service";
import { SidebarGroupComponent } from "../sidebar-group/sidebar-group.component";

@Component({
    selector: "app-sidebar",
    imports: [CommandShortcutComponent, SidebarGroupComponent, LucideBraces, LucideSearch, LucideSparkles, RouterLink],
    templateUrl: "./sidebar.component.html",
    host: {
        class: "flex flex-col h-full"
    }
})
export class SidebarComponent {
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

    protected readonly navigation = inject(DocsNavigationService);
    protected readonly search = inject(DocsSearchService);

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
