import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    contentChildren,
    inject,
    input,
    output,
    signal,
    TemplateRef
} from "@angular/core";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { count, index } from "@mirei/ts-collections";
import { ChevronRight, LucideAngularModule } from "lucide-angular";
import { ThemeService } from "../../../../theme/services/theme.service";
import { BreadcrumbItemTemplateDirective } from "../../directives/breadcrumb-item-template.directive";
import { BreadcrumbItemDirective } from "../../directives/breadcrumb-item.directive";
import { BreadcrumbSeparatorTemplateDirective } from "../../directives/breadcrumb-separator-template.directive";
import { BreadcrumbItem } from "../../models/BreadcrumbItem";
import { breadcrumbListThemeVariants } from "../../styles/breadcrumb.styles";
import { BreadcrumbItemComponent } from "../breadcrumb-item/breadcrumb-item.component";

@Component({
    selector: "mona-breadcrumb",
    templateUrl: "./breadcrumb.component.html",
    imports: [NgTemplateOutlet, FontAwesomeModule, LucideAngularModule, BreadcrumbItemDirective],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {}
})
export class BreadcrumbComponent {
    readonly #themeService = inject(ThemeService);
    protected readonly activeItem = signal<BreadcrumbItemComponent | null>(null);
    protected readonly itemComponents = contentChildren(BreadcrumbItemComponent);
    protected readonly itemCount = computed(() => count(this.itemComponents()));
    protected readonly itemTemplate = contentChild(BreadcrumbItemTemplateDirective, { read: TemplateRef });
    protected readonly listClass = computed(() => {
        const theme = this.#themeService.theme();
        return breadcrumbListThemeVariants(theme)();
    });
    protected readonly separatorIcon = ChevronRight;
    protected readonly separatorTemplate = contentChild(BreadcrumbSeparatorTemplateDirective, {
        read: TemplateRef
    });

    public readonly itemClick = output<BreadcrumbItem>();
    public readonly items = input<Iterable<BreadcrumbItem>>([]);

    public onItemClick(item: BreadcrumbItemComponent): void {
        this.activeItem.set(item);
    }
}
