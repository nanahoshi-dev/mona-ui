import { Component, ElementRef, computed, effect, inject, untracked, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Meta, Title } from "@angular/platform-browser";
import { RouterOutlet } from "@angular/router";
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
import { THEME_OPTIONS, type ThemeOption } from "../../../theme-options";
import { DocsNavigationService } from "../../services/docs-navigation.service";
import { PageService } from "../../services/page.service";
import { SidebarService } from "../../services/sidebar.service";
import { DocsPagerComponent } from "../docs-pager/docs-pager.component";
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
        DocsPagerComponent,
        LucideDynamicIcon,
        LucideX,
        DropdownListComponent,
        FormsModule
    ],
    templateUrl: "./page.component.html",
    providers: [PageService]
})
export class PageComponent {
    readonly #navigation = inject(DocsNavigationService);
    readonly #themeService = inject(ThemeService);
    protected readonly activeBreadcrumbs = computed(() => {
        const page = this.#navigation.currentPage();
        const category = this.#navigation.currentCategory();
        return page && category ? ["Documentation", category.title, page.title] : ["Documentation"];
    });
    protected readonly pageIcon = computed(() => {
        const url = this.#navigation.url();
        if (url.includes("introduction")) return LucideSparkles;
        if (url.includes("installation")) return LucideBookOpen;
        if (url.includes("avatar")) return LucideUser;
        if (url.includes("button")) return LucidePlay;
        return LucideTerminal;
    });
    protected readonly scrollContainer = viewChild<ElementRef<HTMLElement>>("scrollContainer");
    protected readonly selectedTheme = computed(() =>
        this.themeOptions.find(
            theme =>
                theme.name === this.#themeService.themeName() && theme.variant === this.#themeService.themeVariant()
        )
    );
    protected readonly sidebarService = inject(SidebarService);
    protected readonly themeOptions = THEME_OPTIONS;

    public constructor() {
        const title = inject(Title);
        const meta = inject(Meta);
        effect(() => {
            const page = this.#navigation.currentPage();
            title.setTitle(page ? `${page.title} · Mona UI` : "Mona UI");
            if (page) {
                meta.updateTag({ content: page.description, name: "description" });
            }
        });
        // The page scrolls inside this element, which the router doesn't reset. A link to a section scrolls on its own.
        effect(() => {
            this.#navigation.currentPage();
            const container = this.scrollContainer()?.nativeElement;
            if (container && !untracked(this.#navigation.url).includes("#")) {
                container.scrollTop = 0;
            }
        });
    }

    /** Only following a link closes the drawer, so a section can be opened without it closing. */
    protected onDrawerClick(event: Event): void {
        if ((event.target as Element).closest("a")) {
            this.sidebarService.close();
        }
    }

    protected onThemeChange(theme: ThemeOption): void {
        this.#themeService.setTheme(theme);
    }
}
