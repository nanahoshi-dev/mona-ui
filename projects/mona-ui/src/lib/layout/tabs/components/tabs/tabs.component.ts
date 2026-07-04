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
    private readonly tabListComponent = viewChild.required(TabListComponent);
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
            if (previousId && tabList.any(t => t.id === previousId)) {
                return previousId;
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
     * @description Displays a close button on each tab, unless overridden per tab.
     * @default false
     */
    public readonly closable = input(false);

    /**
     * @description Renders every tab with reduced visual emphasis and removes pointer and keyboard interaction.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Keeps a tab's content in the DOM after it is deselected instead of removing it.
     * @default true
     */
    public readonly keepTabContent = input(true);

    /**
     * @description Border-radius preset applied to the tabs and the tab content area.
     * @default "medium"
     */
    public readonly rounded = input<TabsVariantProps["rounded"]>("medium");

    /**
     * @description Size preset controlling the tabs' dimensions.
     * @default "medium"
     */
    public readonly size = input<TabsVariantProps["size"]>("medium");

    /**
     * @description Emitted with a {@link TabCloseEvent} when a tab is closed.
     */
    public readonly tabClose = output<TabCloseEvent>();

    /**
     * @description Emitted with a {@link TabSelectEvent} when a tab is selected. This event is preventable.
     */
    public readonly tabSelect = output<TabSelectEvent>();

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

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
