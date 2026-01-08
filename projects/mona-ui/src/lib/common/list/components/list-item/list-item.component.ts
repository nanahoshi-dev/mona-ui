import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
    Signal,
    TemplateRef
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { twMerge } from "tailwind-merge";
import { CheckboxDirective } from "../../../../inputs/check-box/directives/checkbox.directive";
import { ListItem } from "../../models/ListItem";
import { ListItemTemplateContext } from "../../models/ListItemTemplateContext";
import { ListService } from "../../services/list.service";
import { listGroupHeaderTextVariants, listItemBaseVariants } from "../../styles/list.styles";

@Component({
    selector: "mona-list-item",
    imports: [NgTemplateOutlet, CheckboxDirective, FormsModule],
    templateUrl: "./list-item.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[class]": "baseClass()"
    }
})
export class ListItemComponent<TData> {
    protected readonly baseClass = computed(() => {
        const isHeader = this.isHeader();
        if (isHeader) {
            return ``;
        }
        return listItemBaseVariants();
    });
    protected readonly checkboxes = computed(() => {
        return this.listService.selectableOptions().checkboxes && !this.isHeader();
    });
    protected readonly dataItem: Signal<TData | null> = computed(() => this.item()?.data ?? null);
    protected readonly itemChecked = computed(() => this.listService.isSelected(this.item()));
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
    protected readonly listService = inject(ListService);
    protected readonly textClasses = computed(() => {
        const isHeader = this.isHeader();
        if (isHeader) {
            const hasTemplate = this.template() != null;
            const classes = listGroupHeaderTextVariants({ hasTemplate });
            return twMerge(classes);
        }
        return ``; // TODO
    });

    public readonly checked = output<boolean>();
    public readonly item = input.required<ListItem<TData>>();
    public readonly template = input<TemplateRef<ListItemTemplateContext<TData>> | null>();

    protected onCheckboxChange(checked: boolean): void {
        this.checked.emit(checked);
    }
}
