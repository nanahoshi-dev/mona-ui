import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import {
    LucideBookOpen,
    LucideDynamicIcon,
    LucideMoon,
    LucidePlay,
    LucideSparkles,
    LucideTerminal,
    LucideUser,
    LucideX
} from "@lucide/angular";

import { BreadcrumbComponent, BreadcrumbItemComponent } from "mona-ui";
import { filter, map, startWith } from "rxjs";
import { PageService } from "../../services/page.service";
import { SidebarService } from "../../services/sidebar.service";
import { PageNavigationComponent } from "../page-navigation/page-navigation.component";
import { SidebarComponent } from "../sidebar/sidebar.component";

@Component({
    selector: "app-page",
    imports: [
        RouterOutlet,
        SidebarComponent,
        PageNavigationComponent,
        BreadcrumbComponent,
        BreadcrumbItemComponent,
        LucideDynamicIcon,
        LucideMoon,
        LucideX
    ],
    templateUrl: "./page.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [PageService]
})
export class PageComponent {
    readonly #router = inject(Router);
    readonly #url = toSignal(
        this.#router.events.pipe(
            filter(e => e instanceof NavigationEnd),
            map(() => this.#router.url),
            startWith(this.#router.url)
        ),
        { requireSync: true }
    );
    protected readonly activeBreadcrumbs = computed(() => {
        const url = this.#url();
        const segments = url.split("/").filter(s => s && !s.includes("#") && !s.includes("?"));
        return segments.map(seg => {
            if (seg === "components") return "Documentation";
            return seg
                .split("-")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
        });
    });
    protected readonly pageIcon = computed(() => {
        const url = this.#url();
        if (url.includes("introduction")) return LucideSparkles;
        if (url.includes("installation")) return LucideBookOpen;
        if (url.includes("avatar")) return LucideUser;
        if (url.includes("button")) return LucidePlay;
        return LucideTerminal;
    });
    protected readonly sidebarService = inject(SidebarService);
}
