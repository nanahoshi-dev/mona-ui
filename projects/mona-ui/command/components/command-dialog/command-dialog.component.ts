import { A11yModule } from "@angular/cdk/a11y";
import { DOCUMENT, NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    inject,
    Injector,
    input,
    model,
    Renderer2,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { inertOutside, positionGlobalOverlay } from "@nanahoshi/mona-ui/internal";
import { PopupService, type PopupRef } from "@nanahoshi/mona-ui/popup";
import { merge, take } from "rxjs";
import { CommandDialogContentDirective } from "../../directives/command-dialog-content.directive";
import { COMMAND_DEFAULT_MESSAGES } from "../../i18n/command.default-messages";
import { commandDialogPanelThemeVariants } from "../../styles/command.styles";
import { isApplePlatform, matchesShortcut } from "../../utils/command-shortcut";

const VIEWPORT_MARGIN = "2rem";
const TOP_OF_VIEWPORT = 0.12;

/**
 * A modal for a `mona-command`. It stays near the top of the page instead of centering, so the input doesn't jump as
 * results come and go, and the `mona-command` inside is created each time it opens, so it starts with an empty query.
 */
@Component({
    selector: "mona-command-dialog",
    imports: [A11yModule, NgTemplateOutlet],
    templateUrl: "./command-dialog.component.html",
    host: {
        class: "hidden"
    }
})
export class CommandDialogComponent {
    readonly #document = inject(DOCUMENT);
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    readonly #popupService = inject(PopupService);
    readonly #renderer = inject(Renderer2);
    #popupRef: PopupRef | null = null;

    protected readonly content = contentChild(CommandDialogContentDirective, { read: TemplateRef });
    protected readonly messages = this.#i18n.componentMessages("command", COMMAND_DEFAULT_MESSAGES);
    protected readonly panel = viewChild.required<TemplateRef<void>>("panel");
    protected readonly panelClass = computed(() => commandDialogPanelThemeVariants());

    /** @description The accessible name of the dialog. */
    public readonly ariaLabel = input<string>();
    /** @description Whether the dialog is open. */
    public readonly open = model(false);
    /**
     * @description A key combination that opens and closes the dialog from anywhere on the page, such as `mod+k`.
     * `mod` is Command on Apple devices and Ctrl elsewhere. Nothing is bound unless this is set.
     */
    public readonly shortcut = input<string | null>(null);
    /** @description The dialog's width. It never gets wider than the viewport. */
    public readonly width = input<number | string>("36rem");

    public constructor() {
        effect(() => {
            const open = this.open();
            untracked(() => {
                if (open && !this.#popupRef) {
                    this.#show();
                } else if (!open && this.#popupRef) {
                    this.#popupRef.close();
                }
            });
        });
        effect(onCleanup => {
            const shortcut = this.shortcut();
            if (shortcut) {
                onCleanup(untracked(() => this.#listenFor(shortcut)));
            }
        });
        inject(DestroyRef).onDestroy(() => this.#popupRef?.close());
    }

    #listenFor(shortcut: string): () => void {
        const apple = isApplePlatform(this.#document.defaultView);
        return this.#renderer.listen(this.#document, "keydown", (event: KeyboardEvent) => {
            if (!event.repeat && !event.isComposing && matchesShortcut(event, shortcut, apple)) {
                event.preventDefault();
                this.open.update(open => !open);
            }
        });
    }

    #show(): void {
        const top = Math.round((this.#document.defaultView?.innerHeight ?? 0) * TOP_OF_VIEWPORT);
        const popupRef = this.#popupService.create({
            anchor: this.#document.body,
            backdropClass: ["fixed", "inset-0", "bg-background/50", "transition-opacity", "z-40", "backdrop-blur-xs"],
            blockScroll: true,
            closeOnBackdropClick: true,
            closeOnEscape: true,
            closeOnOutsideClick: false,
            content: this.panel(),
            hasBackdrop: true,
            maxHeight: `calc(100dvh - ${2 * top}px)`,
            maxWidth: `calc(100dvw - ${VIEWPORT_MARGIN})`,
            popupWrapperClass: "mona-popup-constrain-height",
            positionStrategy: "global",
            width: this.width()
        });
        this.#popupRef = popupRef;
        positionGlobalOverlay(popupRef.overlayRef, { top });
        afterNextRender(
            {
                write: () => popupRef.overlayRef.hostElement.querySelector<HTMLElement>("[role='combobox']")?.focus()
            },
            { injector: this.#injector }
        );

        const release = inertOutside(popupRef.overlayRef.hostElement);
        merge(popupRef.closeStart, popupRef.closed)
            .pipe(take(1))
            .subscribe(() => {
                release();
                this.#popupRef = null;
                this.open.set(false);
            });
    }
}
