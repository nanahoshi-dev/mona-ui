import { DOCUMENT } from "@angular/common";
import { Component, DestroyRef, computed, inject, input, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideCheck, LucideCopy } from "@lucide/angular";
import { KIND_HUES } from "../../api-kind-hues";
import type { ApiPageExport } from "../../api-model";
import { KIND_LABELS, selectorAlternatives } from "../../api-text";
import { ApiProseComponent } from "../api-prose/api-prose.component";

const COPIED_FOR_MS = 2000;

interface ExportUse {
    /** The use split before each attribute, so a long one wraps between them rather than mid-word. */
    readonly parts: readonly string[];
    readonly value: string;
}

interface ExportCard {
    readonly hue: string;
    readonly item: ApiPageExport;
    readonly key: string;
    readonly label: string;
    /** What a template uses it by: each of a component's or directive's selectors, or a pipe's name. */
    readonly uses: readonly ExportUse[];
}

/**
 * Exports as cards, each tinted by its kind, with its name linking to its reference page, the first sentence of what it
 * is, and the selectors a template uses it by, each copied with a click.
 */
@Component({
    selector: "app-api-export-list",
    imports: [ApiProseComponent, LucideCheck, LucideCopy, RouterLink],
    templateUrl: "./api-export-list.component.html"
})
export class ApiExportListComponent {
    readonly #document = inject(DOCUMENT);
    #copiedTimer: ReturnType<typeof setTimeout> | undefined;
    protected readonly cards = computed(() =>
        this.exports().map((item): ExportCard => ({
            hue: KIND_HUES[item.kind],
            item,
            key: `${item.entryPoint}/${item.name}`,
            label: KIND_LABELS[item.kind],
            uses: (item.selector ? selectorAlternatives(item.selector) : item.pipeName ? [item.pipeName] : []).map(
                value => ({ parts: value.split(/(?=\[)/), value })
            )
        }))
    );
    /** What was copied last, as the card's key and the selector, until its check mark goes. */
    protected readonly copied = signal<{ readonly key: string; readonly use: string } | null>(null);
    /** What a screen reader hears after a copy. */
    protected readonly status = computed(() => {
        const copied = this.copied();
        return copied ? `Copied ${copied.use}` : "";
    });
    public readonly exports = input.required<readonly ApiPageExport[]>();
    /** The exported names the summaries mention, with the entry point that exports each, so they link. */
    public readonly links = input<Readonly<Record<string, string>>>({});

    public constructor() {
        inject(DestroyRef).onDestroy(() => clearTimeout(this.#copiedTimer));
    }

    protected async copy(key: string, use: string): Promise<void> {
        const clipboard = this.#document.defaultView?.navigator.clipboard;
        if (!clipboard) {
            return;
        }
        try {
            await clipboard.writeText(use);
        } catch {
            // Without clipboard access the selector stays on the page to select.
            return;
        }
        clearTimeout(this.#copiedTimer);
        this.copied.set({ key, use });
        this.#copiedTimer = setTimeout(() => this.copied.set(null), COPIED_FOR_MS);
    }

    protected isCopied(key: string, use: string): boolean {
        const copied = this.copied();
        return copied?.key === key && copied.use === use;
    }
}
