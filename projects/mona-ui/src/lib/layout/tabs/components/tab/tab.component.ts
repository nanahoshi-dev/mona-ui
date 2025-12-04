import {
    afterRenderEffect,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    DestroyRef,
    inject,
    input,
    model,
    TemplateRef
} from "@angular/core";
import { v4 } from "uuid";
import { TabContentTemplateDirective } from "../../directives/tab-content-template.directive";
import { TabTitleTemplateDirective } from "../../directives/tab-title-template.directive";
import { TabItem } from "../../models/TabItem";
import { TabsService } from "../../services/tabs.service";

@Component({
    selector: "mona-tab",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabComponent {
    readonly #tabItem = computed(() => {
        const closable = this.closable();
        const contentTemplate = this.contentTemplate();
        const disabled = this.disabled();
        const selected = this.selected();
        const titleTemplate = this.titleTemplate();
        const title = this.title();
        const uid = this.uid;
        const tabItem: TabItem = {
            closable,
            contentTemplate,
            disabled,
            index: 0,
            selected,
            title,
            titleTemplate,
            uid
        };
        return tabItem;
    });
    readonly #tabService = inject(TabsService);
    protected readonly contentTemplate = contentChild(TabContentTemplateDirective, { read: TemplateRef });
    public readonly titleTemplate = contentChild(TabTitleTemplateDirective, { read: TemplateRef });
    public readonly closable = input<boolean>(false);
    public readonly disabled = input(false);
    public readonly selected = model(false);
    public readonly title = input("");
    public readonly uid = v4();
    public index = 0;

    public constructor() {
        afterRenderEffect({
            read: () => this.#tabService.addTab(this.uid, this.#tabItem())
        });
        inject(DestroyRef).onDestroy(() => this.#tabService.removeTab(this.uid));
    }
}
