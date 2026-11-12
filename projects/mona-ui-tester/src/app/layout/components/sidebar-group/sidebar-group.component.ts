import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, inject, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
    LucideBookOpen,
    LucideChevronRight,
    LucideDynamicIcon,
    LucideMoon,
    LucidePaintbrush,
    LucidePalette,
    LucideSparkles,
    LucideTextCursorInput
} from "@lucide/angular";
import type { LucideIconInput } from "@lucide/angular";
import type { DocsCategory } from "../../docs-manifest";
import { DocsNavigationService } from "../../services/docs-navigation.service";

/** The manifest stays free of Angular imports, so the guides' icons live here. */
const PAGE_ICONS: Readonly<Record<string, LucideIconInput>> = {
    forms: LucideTextCursorInput,
    installation: LucideBookOpen,
    introduction: LucideSparkles,
    "theme-colors": LucidePalette,
    "theme-luna": LucideMoon,
    theming: LucidePaintbrush
};

let nextListId = 0;

@Component({
    selector: "app-sidebar-group",
    imports: [LucideChevronRight, LucideDynamicIcon, NgTemplateOutlet, RouterLink],
    templateUrl: "./sidebar-group.component.html"
})
export class SidebarGroupComponent {
    protected readonly expanded = computed(() => this.navigation.isExpanded(this.category().id));
    protected readonly icons = PAGE_ICONS;
    /** The sidebar is on the page twice, so a category's id alone wouldn't be unique. */
    protected readonly listId = `app-sidebar-group-${nextListId++}`;
    protected readonly navigation = inject(DocsNavigationService);

    public readonly category = input.required<DocsCategory>();
}
