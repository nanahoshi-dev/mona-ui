import { ChangeDetectionStrategy, Component, computed, inject, input, output } from "@angular/core";
import { LucideChevronDown, LucideChevronLeft, LucideChevronRight, LucideChevronUp } from "@lucide/angular";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { ThemeService } from "../../../../theme/services/theme.service";
import { splitterResizerHandleThemeVariants, SplitterVariantProps } from "../../styles/splitter.styles";

@Component({
    selector: "mona-splitter-resizer-handle",
    imports: [ButtonDirective, LucideChevronLeft, LucideChevronRight, LucideChevronUp, LucideChevronDown],
    templateUrl: "./splitter-resizer-handle.component.html",
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
