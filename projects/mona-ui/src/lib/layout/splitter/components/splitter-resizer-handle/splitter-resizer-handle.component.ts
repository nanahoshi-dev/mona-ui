import { ChangeDetectionStrategy, Component, computed, inject, input, output } from "@angular/core";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, LucideAngularModule } from "lucide-angular";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { ThemeService } from "../../../../theme/services/theme.service";
import { splitterResizerHandleThemeVariants, SplitterVariantProps } from "../../styles/splitter.styles";

@Component({
    selector: "mona-splitter-resizer-handle",
    imports: [LucideAngularModule, ButtonDirective],
    templateUrl: "./splitter-resizer-handle.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[class]": "baseClass()"
    }
})
export class SplitterResizerHandleComponent {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const orientation = this.orientation();
        return splitterResizerHandleThemeVariants(theme)({ orientation });
    });
    protected readonly downArrowIcon = ChevronDown;
    protected readonly leftArrowIcon = ChevronLeft;
    protected readonly rightArrowIcon = ChevronRight;
    protected readonly topArrowIcon = ChevronUp;

    public readonly collapseNext = output<MouseEvent>();
    public readonly collapsePrevious = output<MouseEvent>();
    public readonly nextControlsVisible = input.required<boolean>();
    public readonly orientation = input.required<SplitterVariantProps["orientation"]>();
    public readonly previousControlsVisible = input.required<boolean>();
    public readonly resizable = input.required<boolean>();

    protected onPointerDown(event: PointerEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }
}
