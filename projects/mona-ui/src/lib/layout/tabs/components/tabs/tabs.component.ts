import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, contentChildren, inject, input, output } from "@angular/core";
import { select } from "@mirei/ts-collections";
import { TabCloseEvent } from "../../models/TabCloseEvent";
import {
    tabContentThemeVariants,
    tabsBaseThemeVariants,
    TabsVariantInput,
    TabsVariantProps
} from "../../styles/tabs.styles";
import { TabListComponent } from "../tab-list/tab-list.component";
import { ThemeService } from "../../../../theme/services/theme.service";
import { twMerge } from "tailwind-merge";
import { TabComponent } from "../tab/tab.component";

@Component({
    selector: "mona-tabs",
    templateUrl: "./tabs.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet, TabListComponent],
    host: {
        "[class]": "baseClass()"
    }
})
export class TabsComponent implements TabsVariantInput {
    readonly #themeService = inject(ThemeService);
    private readonly tabs = contentChildren(TabComponent);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const variantClass = tabsBaseThemeVariants(theme)();
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly contentClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded() === "full" ? "large" : this.rounded();
        return tabContentThemeVariants(theme)({ rounded });
    });
    protected readonly tabList = computed(() => {
        const tabs = this.tabs();
        return select(tabs, t => t.tabItem)
            .tap((t, tx) => ({ ...t, index: tx }))
            .toImmutableSet();
    });
    public readonly closable = input(false);
    public readonly keepTabContent = input(false);
    public readonly rounded = input<TabsVariantProps["rounded"]>("medium");
    public readonly tabClose = output<TabCloseEvent>();
    public readonly userClass = input("", { alias: "class" });
}
