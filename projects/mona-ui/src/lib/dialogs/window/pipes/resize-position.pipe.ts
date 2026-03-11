import { inject, Pipe, PipeTransform } from "@angular/core";
import { ThemeService } from "../../../theme/services/theme.service";
import { windowResizerThemeVariants, WindowResizerVariantProps } from "../styles/window.styles";

@Pipe({
    name: "monaResizePosition"
})
export class ResizePositionPipe implements PipeTransform {
    readonly #themeService = inject(ThemeService);
    public transform(position: WindowResizerVariantProps["position"]): string | null {
        if (!position) {
            return null;
        }
        const theme = this.#themeService.theme();
        return windowResizerThemeVariants(theme)({ position });
    }
}
