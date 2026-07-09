import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, contentChildren, inject, input } from "@angular/core";
import { from } from "@mirei/ts-collections";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { SplitterPaneStyleDirective } from "../../directives/splitter-pane-style.directive";
import { splitterBaseThemeVariants, SplitterVariantInput, SplitterVariantProps } from "../../styles/splitter.styles";
import { SplitterPaneComponent } from "../splitter-pane/splitter-pane.component";
import { SplitterResizerComponent } from "../splitter-resizer/splitter-resizer.component";

@Component({
    selector: "mona-splitter",
    imports: [SplitterResizerComponent, NgTemplateOutlet, SplitterPaneStyleDirective],
    templateUrl: "./splitter.component.html",
    host: {
        "[class]": "baseClass()"
    }
})
export class SplitterComponent implements SplitterVariantInput {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const orientation = this.orientation();
        return splitterBaseThemeVariants(theme)({ orientation });
    });
    protected readonly paneList = contentChildren(SplitterPaneComponent);
    /**
     * @description The layout direction of the splitter panes.
     * @default "horizontal"
     */
    public readonly orientation = input<SplitterVariantProps["orientation"]>("horizontal");

    /**
     * @internal Used by SplitterResizerComponent to resolve sibling panes by id.
     */
    public getPaneByUid(uid: string): SplitterPaneComponent | null {
        return from(this.paneList()).firstOrDefault(pane => pane.uid === uid);
    }
}
