import { ChangeDetectionStrategy, Component, computed, contentChild, input, model, TemplateRef } from "@angular/core";
import { v4 } from "uuid";
import { createElementControlId } from "../../../../utils/createElementControlId";
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
     * @description Whether the tab is closable.
     * If true, a close button will be displayed for the tab.
     * This will take precedence over the `closable` prop on the `mona-tabs` component.
     */
    public readonly closable = input<boolean>(false);

    /**
     * @description Whether the tab is disabled.
     * If true, the tab will be disabled and cannot be selected.
     * This will take precedence over the `disabled` prop on the `mona-tabs` component.
     */
    public readonly disabled = input(false);

    /**
     * @description Sets the selected state of the tab.
     */
    public readonly selected = model(false);

    /**
     * @description Sets the title of the tab.
     */
    public readonly title = input("");

    public get tabItem(): TabItem {
        return this.#tabItem();
    }
}
