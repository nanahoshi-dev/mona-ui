import { booleanAttribute, Component, computed, contentChild, input, model, TemplateRef } from "@angular/core";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { TabContentTemplateDirective } from "../../directives/tab-content-template.directive";
import { TabTitleTemplateDirective } from "../../directives/tab-title-template.directive";
import type { TabItem } from "../../models/TabItem";

@Component({
    selector: "mona-tab",
    template: ""
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
     * @description Displays a close button on this tab. Turning it on here shows the button even when the parent
     * `mona-tabs` has `closable` off; turning it off here doesn't hide a button the parent asked for.
     * @default false
     */
    public readonly closable = input(false, { transform: booleanAttribute });

    /**
     * @description Renders this tab with reduced visual emphasis and removes pointer and keyboard interaction. A tab is
     * disabled when this or the parent `mona-tabs` component's `disabled` input is on.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Whether the tab is selected. Setting it to `true` selects the tab unless it's disabled, and it
     * follows the selection, so `[(selected)]` stays current. Setting it to `false` doesn't clear the selection, because
     * a group of tabs always keeps one selected.
     * @default false
     */
    public readonly selected = model(false);

    /**
     * @description Title text displayed on the tab.
     * @default ""
     */
    public readonly title = input("");

    /**
     * @internal
     */
    public get tabItem(): TabItem {
        return this.#tabItem();
    }
}
