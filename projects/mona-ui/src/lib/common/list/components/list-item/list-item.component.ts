import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, Signal, TemplateRef } from "@angular/core";
import { listGroupHeaderTextVariants, listItemTextVariants } from "../../styles/list.styles";
import { twMerge } from "tailwind-merge";
import { ListItem } from "../../models/ListItem";
import { ListItemTemplateContext } from "../../models/ListItemTemplateContext";
import { ListService } from "../../services/list.service";

@Component({
    selector: "mona-list-item",
    imports: [NgTemplateOutlet],
    templateUrl: "./list-item.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: "w-full h-full"
    }
})
export class ListItemComponent<TData> {
    protected readonly dataItem: Signal<TData | null> = computed(() => this.item()?.data ?? null);
    protected readonly itemText = computed(() => {
        const item = this.item();
        if (item == null) {
            return "";
        }
        if (item.header) {
            return item.header;
        }
        return this.listService.getItemText(item);
    });
    protected readonly isHeader = computed(() => this.item()?.header ?? false);
    protected readonly listService = inject(ListService<TData>);
    protected readonly textClasses = computed(() => {
        const isHeader = this.isHeader();
        if (isHeader) {
            const hasTemplate = this.template() != null;
            const classes = listGroupHeaderTextVariants({ hasTemplate });
            return twMerge(classes);
        }
        const classes = listItemTextVariants();
        return twMerge(classes);
    });
    public readonly item = input.required<ListItem<TData>>();
    public readonly template = input<TemplateRef<ListItemTemplateContext<TData>> | null>(null);
}
