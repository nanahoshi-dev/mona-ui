import { Component, computed, inject, input, output } from "@angular/core";
import { LucideChevronDown, LucideChevronLeft, LucideChevronRight, LucideChevronUp } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { SPLITTER_DEFAULT_MESSAGES } from "../../i18n/splitter.default-messages";
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
    readonly #i18n = inject(MonaI18nService);
    protected readonly baseClass = computed(() => {
        const orientation = this.orientation();
        return splitterResizerHandleThemeVariants({ orientation });
    });
    protected readonly messages = this.#i18n.componentMessages("splitter", SPLITTER_DEFAULT_MESSAGES);

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
