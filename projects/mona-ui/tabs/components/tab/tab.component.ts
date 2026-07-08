import { ChangeDetectionStrategy, Component, computed, contentChild, input, model, TemplateRef } from "@angular/core";
import { createElementControlId } from "@mirei/mona-ui/internal";
import { TabContentTemplateDirective } from "../../directives/tab-content-template.directive";
import { TabTitleTemplateDirective } from "../../directives/tab-title-template.directive";
import { TabItem } from "../../models/TabItem";

@Component({
    selector: "mona-tab",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabComponent {
    readonly #id = createElementControlId();
    readonly #tabItem = computed(() => {
        const closable = this.closable();
        const contentTemplate = this.contentTemplate();
        const disabled = this.disabled();
        const selected = this.selected();
        const titleTemplate = this.titleTemplate();
        const title = this.title();
        const id = this.#id;
        const tabItem: TabItem = {
            closable,
            contentTemplate,
            disabled,
            id,
            index: 0,
            selected,
            title,
            titleTemplate
        };
        return tabItem;
    });
    protected readonly contentTemplate = contentChild(TabContentTemplateDirective, { read: TemplateRef });
    protected readonly titleTemplate = contentChild(TabTitleTemplateDirective, { read: TemplateRef });

    /**
     * @description Displays a close button on this tab. Overrides the parent `mona-tabs` component's `closable` input.
     * @default false
     */
    public readonly closable = input<boolean>(false);

    /**
     * @description Renders this tab with reduced visual emphasis and removes pointer and keyboard interaction.
     * Overrides the parent `mona-tabs` component's `disabled` input.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Whether the tab is selected.
     * @default false
     */
    public readonly selected = model(false);

    /**
     * @description Title text displayed on the tab.
     * @default ""
     */
    public readonly title = input("");

    public get tabItem(): TabItem {
        return this.#tabItem();
    }
}
