import {
    afterRenderEffect,
    Component,
    computed,
    ElementRef,
    inject,
    input,
    output,
    signal,
    untracked,
    viewChild
} from "@angular/core";
import { LucideChevronDown, LucideDynamicIcon, type LucideIconInput, LucideLoader, LucideX } from "@lucide/angular";
import { ThemeService } from "@mirei/mona-ui/theme";
import { twMerge } from "tailwind-merge";
import { indicatorIconHostThemeVariants, indicatorIconSvgThemeVariants } from "../../styles/indicator-icon.styles";

export type IndicatorIconPreset = "clear" | "dropdown" | "loading";

@Component({
    selector: "mona-indicator-icon",
    templateUrl: "./indicator-icon.component.html",
    imports: [LucideDynamicIcon],
    host: {
        "[attr.aria-hidden]": "interactive() ? null : true",
        "[attr.aria-label]": "interactive() ? label() || null : null",
        "[attr.role]": "interactive() ? 'button' : null",
        "[attr.tabindex]": "interactive() ? 0 : null",
        "[attr.title]": "interactive() ? label() || null : null",
        "[class]": "baseClass()",
        "(click)": "onActivate($event)",
        "(keydown.enter)": "onActivate($event)",
        "(keydown.space)": "onActivate($event)"
    }
})
export class IndicatorIconComponent {
    readonly #themeService = inject(ThemeService);

    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const interactive = this.interactive();
        const preset = this.preset();
        return twMerge(indicatorIconHostThemeVariants(theme)({ interactive, preset }), this.userClass());
    });
    protected readonly hasProjectedContent = signal(false);
    protected readonly iconClass = computed(() => {
        const theme = this.#themeService.theme();
        const loading = this.preset() === "loading";
        return indicatorIconSvgThemeVariants(theme)({ loading });
    });
    protected readonly iconToRender = computed<LucideIconInput | null>(() => {
        switch (this.preset()) {
            case "clear":
                return LucideX;
            case "dropdown":
                return LucideChevronDown;
            case "loading":
                return LucideLoader;
            default:
                return this.icon();
        }
    });
    protected readonly projectedContent = viewChild<ElementRef<HTMLElement>>("projectedContent");

    public readonly activate = output<KeyboardEvent | MouseEvent>();
    public readonly icon = input<LucideIconInput | null>(null);
    public readonly interactive = input(false);
    public readonly label = input("");
    public readonly preset = input<IndicatorIconPreset | null>(null);
    public readonly size = input(16);
    public readonly userClass = input("", { alias: "class" });

    public constructor() {
        afterRenderEffect({
            read: () => {
                const element = this.projectedContent();
                const hasContent = element ? this.hasContent(element.nativeElement) : false;
                untracked(() => {
                    if (this.hasProjectedContent() !== hasContent) {
                        this.hasProjectedContent.set(hasContent);
                    }
                });
            }
        });
    }

    protected onActivate(event: Event): void {
        if (!this.interactive()) {
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        this.activate.emit(event as KeyboardEvent | MouseEvent);
    }

    private hasContent(element: HTMLElement): boolean {
        return Array.from(element.childNodes).some(node => {
            if (node.nodeType === Node.COMMENT_NODE) {
                return false;
            }
            return node.nodeType !== Node.TEXT_NODE || !!node.textContent?.trim();
        });
    }
}
