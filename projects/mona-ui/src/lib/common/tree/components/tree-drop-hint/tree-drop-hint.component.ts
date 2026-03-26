import { Component, computed, effect, ElementRef, inject, Signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { twMerge } from "tailwind-merge";
import { ThemeService } from "../../../../theme/services/theme.service";
import { DropPositionChangeEvent } from "../../models/DropPositionChangeEvent";
import { TreeService } from "../../services/tree.service";
import { treeDropHintBaseThemeVariants, treeDropHintIconThemeVariants } from "../../styles/tree.styles";

@Component({
    selector: "mona-tree-drop-hint",
    templateUrl: "./tree-drop-hint.component.html",
    host: {
        "[class]": "baseClass()"
    }
})
export class TreeDropHintComponent<T> {
    readonly #dropPositionChange: Signal<DropPositionChangeEvent<T> | null> = toSignal(
        inject(TreeService).dropPositionChange$,
        {
            initialValue: null
        }
    );
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return treeDropHintBaseThemeVariants(theme)();
    });
    protected readonly dropHintStyles: Signal<Partial<CSSStyleDeclaration>> = computed(() => {
        const dropPositionData = this.#dropPositionChange();
        if (!dropPositionData) {
            return { display: "none" };
        }
        const node = dropPositionData.targetNode;
        if (!node) {
            return { display: "none" };
        }
        const nodeElement = this.#hostElementRef.nativeElement.parentElement?.querySelector(
            `[data-uid="${node.uid}"] > div`
        );
        if (!nodeElement) {
            return { display: "none" };
        }
        const rect = nodeElement.getBoundingClientRect();
        const position = dropPositionData.position;
        const leftOffset = 0;
        if (position === "before") {
            return {
                display: "flex",
                top: `${rect.top}px`,
                left: `${rect.left + leftOffset}px`
            };
        } else if (position === "after") {
            return {
                display: "flex",
                top: `${rect.bottom}px`,
                left: `${rect.left + leftOffset}px`
            };
        } else {
            return { display: "none" };
        }
    });
    protected readonly iconClass = computed(() => {
        const theme = this.#themeService.theme();
        const icon = "ri-arrow-right-s-fill";
        const variantClass = treeDropHintIconThemeVariants(theme)();
        return twMerge(icon, variantClass);
    });

    public constructor() {
        effect(() => {
            const styles = this.dropHintStyles();
            Object.assign(this.#hostElementRef.nativeElement.style, styles);
        });
    }
}
