import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from "@angular/core";
import { TabCloseEvent } from "../../models/TabCloseEvent";
import { TabsService } from "../../services/tabs.service";
import {
    tabContentThemeVariants,
    tabsBaseThemeVariants,
    TabsVariantInput,
    TabsVariantProps
} from "../../styles/tabs.styles";
import { TabListComponent } from "../tab-list/tab-list.component";
import { ThemeService } from "../../../../theme/services/theme.service";
import { twMerge } from "tailwind-merge";

@Component({
    selector: "mona-tabs",
    templateUrl: "./tabs.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet, TabListComponent],
    providers: [TabsService],
    host: {
        "[class]": "baseClass()"
    }
})
export class TabsComponent implements TabsVariantInput {
    readonly #tabsService = inject(TabsService);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const variantClass = tabsBaseThemeVariants(theme)();
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly contentClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return tabContentThemeVariants(theme)({ rounded });
    });
    protected readonly tabList = this.#tabsService.tabList;
    public readonly closable = input(false);
    public readonly keepTabContent = input(false);
    public readonly rounded = input<TabsVariantProps["rounded"]>("medium");
    public readonly tabClose = output<TabCloseEvent>();
    public readonly userClass = input("", { alias: "class" });
}
