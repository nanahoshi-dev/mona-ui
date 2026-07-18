import { Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import {
    LucideBookOpen,
    LucideDynamicIcon,
    LucidePlay,
    LucideSparkles,
    LucideTerminal,
    LucideUser,
    LucideX
} from "@lucide/angular";

import { BreadcrumbComponent, BreadcrumbItemComponent } from "@nanahoshi/mona-ui/breadcrumb";
import { filter, map, startWith } from "rxjs";
import { THEME_OPTIONS, type ThemeOption } from "../../../theme-options";
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
        LucideX,
        DropdownListComponent,
        FormsModule
    ],
    templateUrl: "./page.component.html",
    providers: [PageService]
})
export class PageComponent {
    readonly #router = inject(Router);
    readonly #themeService = inject(ThemeService);
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
    protected readonly selectedTheme = computed(() =>
        this.themeOptions.find(theme => theme.id === this.#themeService.themeId())
    );
    protected readonly themeOptions = THEME_OPTIONS;
    protected readonly sidebarService = inject(SidebarService);

    protected onThemeChange(theme: ThemeOption): void {
        this.#themeService.setThemeId(theme.id);
    }
}
