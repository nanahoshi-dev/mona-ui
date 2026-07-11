import { inject, Pipe, PipeTransform } from "@angular/core";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { WINDOW_STYLE_STRATEGY, WindowResizerVariantProps } from "../styles/window.styles";

@Pipe({
    name: "monaResizePosition"
})
export class ResizePositionPipe implements PipeTransform {
    readonly #styleStrategy = inject(WINDOW_STYLE_STRATEGY);
    readonly #themeService = inject(ThemeService);
    public transform(position: WindowResizerVariantProps["position"]): string | null {
        if (!position) {
            return null;
        }
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).resizer({ position });
    }
}
