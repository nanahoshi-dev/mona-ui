import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChildren,
    inject,
    input,
    linkedSignal,
    output,
    viewChild
} from "@angular/core";
import { ImmutableSet, select } from "@mirei/ts-collections";
import { TabCloseEvent } from "../../models/TabCloseEvent";
import { TabItem } from "../../models/TabItem";
import { TabSelectEvent } from "../../models/TabSelectEvent";
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
    protected readonly selectedTabId = linkedSignal<ImmutableSet<TabItem>, string | null>({
        source: () => this.tabList(),
        computation: (tabList, previous) => {
            const previousId = previous?.value;
            const previousTab = tabList.firstOrDefault(t => t.id === previousId);
            if (previousTab?.selected) {
                return previousId || null;
            }
            return tabList.firstOrDefault()?.id ?? null;
        }
    });
    protected readonly tabList = computed(() => {
        const tabs = this.tabs();
        return select(tabs, t => t.tabItem)
            .tap((t, tx) => (t.index = tx))
            .toImmutableSet();
    });

    /**
     * @description Whether the tabs should be closable.
     * If true, a close button will be displayed for each tab.
     */
    public readonly closable = input(false);

    /**
     * @description Whether the tabs should be disabled.
     */
    public readonly disabled = input(false);

    /**
     * @description Whether the tab content should be kept when the tab is closed.
     * If false, the tab content will be removed from the DOM when the tab is switched to a different tab.
     */
    public readonly keepTabContent = input(true);

    /**
     * @description Sets the border radius of the tabs and tab content area.
     */
    public readonly rounded = input<TabsVariantProps["rounded"]>("medium");

    /**
     * @description Sets the size of the tabs.
     */
    public readonly size = input<TabsVariantProps["size"]>("medium");

    /**
     * @description Emitted when a tab is closed.
     */
    public readonly tabClose = output<TabCloseEvent>();

    /**
     * @description Emitted when a tab is selected. This event is preventable.
     */
    public readonly tabSelect = output<TabSelectEvent>();

    public readonly userClass = input("", { alias: "class" });

    protected readonly tabListComponent = viewChild.required(TabListComponent);

    protected handlePanelKeyDown(event: KeyboardEvent): void {
        if (event.key === "Tab" && event.shiftKey) {
            if (event.target !== event.currentTarget) {
                return;
            }
            event.preventDefault();
            this.tabListComponent().focusSelectedTab();
        }
    }
}
