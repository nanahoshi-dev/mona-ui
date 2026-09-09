import {
    afterRenderEffect,
    Component,
    computed,
    ElementRef,
    inject,
    Signal
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { twMerge } from "tailwind-merge";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
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
    readonly #i18n = inject(MonaI18nService);
    protected readonly baseClass = computed(() => {
        return treeDropHintBaseThemeVariants();
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
        const isRtl = this.#i18n.direction() === "rtl";
        const left = isRtl ? `${rect.right - 40}px` : `${rect.left}px`;
        if (position === "before") {
            return {
                display: "flex",
                left,
                top: `${rect.top}px`
            };
        } else if (position === "after") {
            return {
                display: "flex",
                left,
                top: `${rect.bottom}px`
            };
        } else {
            return { display: "none" };
        }
    });
    protected readonly iconClass = computed(() => {
        const icon = "ri-arrow-right-s-fill";
        const variantClass = treeDropHintIconThemeVariants();
        return twMerge(icon, variantClass);
    });

    public constructor() {
        afterRenderEffect({
            write: () => {
                const styles = this.dropHintStyles();
                Object.assign(this.#hostElementRef.nativeElement.style, styles);
            }
        });
    }
}
