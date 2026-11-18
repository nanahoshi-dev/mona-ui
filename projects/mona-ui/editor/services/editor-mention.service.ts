import type { FlexibleConnectedPositionStrategy } from "@angular/cdk/overlay";
import { DOCUMENT } from "@angular/common";
import { computed, DestroyRef, inject, Injectable, Injector, signal, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { injectLiveAnnouncer } from "@nanahoshi/mona-ui/internal/live-announcer";
import { type PopupRef, PopupService } from "@nanahoshi/mona-ui/popup";
import type { EditorView } from "@tiptap/pm/view";
import { catchError, from, fromEvent, isObservable, map, type Observable, of, Subject, switchMap } from "rxjs";
import { EditorMentionListComponent } from "../components/editor-mention-list/editor-mention-list.component";
import { MENTION_KEY, type MentionQuery } from "../extensions/Mention";
import { EDITOR_DEFAULT_MESSAGES } from "../i18n/editor.default-messages";
import type { EditorMention, EditorMentionSearch } from "../models/EditorMention";
import { type EditorMentionController, EditorService } from "./editor.service";

/** A search's result as an observable of an array, whatever form it came in. */
function toMentions(result: ReturnType<EditorMentionSearch>): Observable<readonly EditorMention[]> {
    if (isObservable(result)) {
        return result.pipe(map(mentions => Array.from(mentions)));
    }
    if (typeof (result as { then?: unknown }).then === "function") {
        return from(result as Promise<Iterable<EditorMention>>).pipe(map(mentions => Array.from(mentions)));
    }
    return of(Array.from(result as Iterable<EditorMention>));
}

/**
 * Offers mentions while `@` and a query are typed: it searches with the editor's `mentionSearch`, shows what it finds
 * in a popup at the `@`, and puts the chosen one in the content. Focus stays in the content; the content points at the
 * highlighted suggestion with `aria-activedescendant`.
 * @internal
 */
@Injectable()
export class EditorMentionService implements EditorMentionController {
    readonly #announcer = injectLiveAnnouncer();
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #editorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    readonly #messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    readonly #popupService = inject(PopupService);
    readonly #searches = new Subject<string | null>();
    #popupRef: PopupRef | null = null;
    #query: MentionQuery | null = null;
    #view: EditorView | null = null;

    /** The highlighted suggestion's id, for the content's `aria-activedescendant` while the list shows. */
    public readonly activeDescendant = computed(() =>
        this.open() && this.items().length > 0 ? this.optionId(this.highlightedIndex()) : null
    );
    public readonly highlightedIndex = signal(0);
    public readonly items = signal<readonly EditorMention[]>([]);

    /** The suggestions' list; its options' ids start with it. */
    public readonly listId = createElementControlId();
    public readonly loading = signal(false);
    public readonly open = signal(false);

    /** Set by the editor from its `mentionSearch`. */
    public readonly search = signal<EditorMentionSearch | null>(null);

    public constructor() {
        this.#editorService.mentionController = this;
        this.#searches
            .pipe(
                switchMap(query => {
                    const search = untracked(this.search);
                    if (query === null || search === null) {
                        return of(null);
                    }
                    this.loading.set(true);
                    let result: ReturnType<EditorMentionSearch>;
                    try {
                        result = search(query);
                    } catch {
                        return of<readonly EditorMention[]>([]);
                    }
                    return toMentions(result).pipe(catchError(() => of<readonly EditorMention[]>([])));
                }),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe(items => {
                this.loading.set(false);
                if (items === null) {
                    return;
                }
                this.items.set(items);
                this.highlightedIndex.set(0);
                const messages = untracked(this.#messages);
                this.#announce(items.length > 0 ? messages.mentionResults(items.length) : messages.mentionNoResults);
            });
        this.#editorService.blur$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => this.#dismiss());
        fromEvent(this.#document, "scroll", { capture: true, passive: true })
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => this.#reposition());
        this.#destroyRef.onDestroy(() => this.#close());
    }

    /** Whether typing `@` offers mentions: the editor has a `mentionSearch`. */
    public enabled(): boolean {
        return untracked(this.search) !== null;
    }

    /** Moves the highlight, wrapping from one end of the list to the other. */
    public highlight(index: number): void {
        const count = this.items().length;
        if (count === 0) {
            return;
        }
        this.highlightedIndex.set(((index % count) + count) % count);
        this.#document.getElementById(this.optionId(this.highlightedIndex()))?.scrollIntoView({ block: "nearest" });
    }

    /** Handles a key while a query is typed: the arrow keys move the highlight, and Enter and Tab pick it. */
    public onKeyDown(event: KeyboardEvent): boolean {
        if (!this.open() || this.items().length === 0 || event.altKey || event.ctrlKey || event.metaKey) {
            return false;
        }
        switch (event.key) {
            case "ArrowDown":
                this.highlight(this.highlightedIndex() + 1);
                return true;
            case "ArrowUp":
                this.highlight(this.highlightedIndex() - 1);
                return true;
            case "Enter":
            case "Tab":
                if (event.shiftKey) {
                    return false;
                }
                this.select(this.highlightedIndex());
                return true;
            default:
                return false;
        }
    }

    /** Told by the content when the query starts, changes or ends. */
    public onQuery(view: EditorView, query: MentionQuery | null): void {
        const previous = this.#query;
        this.#query = query;
        this.#view = query ? view : null;
        if (query === null) {
            this.#searches.next(null);
            this.#close();
            return;
        }
        if (previous?.query !== query.query || previous.from !== query.from) {
            this.#searches.next(query.query);
        }
        if (this.#popupRef === null) {
            this.#openPopup(view, query);
        } else {
            this.#reposition();
        }
    }

    public optionId(index: number): string {
        return `${this.listId}-${index}`;
    }

    /** Puts a suggestion in place of the query, followed by a space. */
    public select(index: number): void {
        const item = this.items()[index];
        const query = this.#query;
        const view = this.#view;
        if (!item || !query || !view || view.isDestroyed || this.#editorService.editor.view !== view) {
            return;
        }
        this.#editorService.editor
            .chain()
            .focus()
            .insertContentAt({ from: query.from, to: query.to }, [
                { attrs: { id: item.id, label: item.label }, type: "mention" },
                { text: " ", type: "text" }
            ])
            .run();
    }

    #anchor(view: EditorView, position: number): { height: number; width: number; x: number; y: number } {
        const coords = view.coordsAtPos(position);
        return { height: coords.bottom - coords.top, width: 1, x: coords.left, y: coords.top };
    }

    #announce(message: string): void {
        void this.#announcer.announce(message, "polite");
    }

    #close(): void {
        const popupRef = this.#popupRef;
        this.#popupRef = null;
        this.open.set(false);
        this.items.set([]);
        this.loading.set(false);
        popupRef?.close();
    }

    /** Closes the suggestions for the query being typed, as Escape does, so they stay closed while it is typed. */
    #dismiss(): void {
        const view = this.#view;
        const query = this.#query;
        if (view && query && !view.isDestroyed) {
            view.dispatch(view.state.tr.setMeta(MENTION_KEY, { dismiss: query.from }));
        }
    }

    #openPopup(view: EditorView, query: MentionQuery): void {
        const popupRef = this.#popupService.create({
            anchor: this.#anchor(view, query.from),
            anchorConnectionPoint: "bottomleft",
            closeOnEscape: false,
            closeOnOutsideClick: false,
            content: EditorMentionListComponent,
            data: this,
            injector: this.#injector,
            offset: { horizontal: 0, vertical: 4 },
            popupConnectionPoint: "topleft",
            restoreFocus: false,
            withPush: true,
            withScrollTracking: false
        });
        this.#popupRef = popupRef;
        this.open.set(true);
        popupRef.closed.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            if (this.#popupRef === popupRef) {
                this.#popupRef = null;
                this.open.set(false);
            }
        });
    }

    /** Keeps the popup at the `@` as the content or the page scrolls. */
    #reposition(): void {
        const popupRef = this.#popupRef;
        const view = this.#view;
        const query = this.#query;
        if (!popupRef || !view || !query || view.isDestroyed) {
            return;
        }
        const strategy = popupRef.overlayRef.getConfig().positionStrategy as
            FlexibleConnectedPositionStrategy | undefined;
        strategy?.setOrigin(this.#anchor(view, query.from));
        popupRef.overlayRef.updatePosition();
    }
}
