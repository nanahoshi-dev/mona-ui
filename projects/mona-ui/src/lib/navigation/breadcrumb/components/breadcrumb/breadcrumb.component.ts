import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    contentChildren,
    inject,
    TemplateRef
} from "@angular/core";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { count } from "@mirei/ts-collections";
import { ChevronRight, LucideAngularModule } from "lucide-angular";
import { ThemeService } from "../../../../theme/services/theme.service";
import { BreadcrumbItemDirective } from "../../directives/breadcrumb-item.directive";
import { BreadcrumbSeparatorTemplateDirective } from "../../directives/breadcrumb-separator-template.directive";
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
    protected readonly itemComponents = contentChildren(BreadcrumbItemComponent);
    protected readonly itemCount = computed(() => count(this.itemComponents()));
    protected readonly listClass = computed(() => {
        const theme = this.#themeService.theme();
        return breadcrumbListThemeVariants(theme)();
    });
    protected readonly separatorIcon = ChevronRight;
    protected readonly separatorTemplate = contentChild(BreadcrumbSeparatorTemplateDirective, {
        read: TemplateRef
    });

    public onItemClick(item: BreadcrumbItemComponent): void {
        item.itemClick.emit();
    }
}
