import { inject, Pipe, PipeTransform } from "@angular/core";
import { windowResizerThemeVariants, WindowResizerVariantProps } from "../styles/window.styles";

@Pipe({
    name: "monaResizePosition"
})
export class ResizePositionPipe implements PipeTransform {
    public transform(position: WindowResizerVariantProps["position"]): string | null {
        if (!position) {
            return null;
        }
        return windowResizerThemeVariants({ position });
    }
}
