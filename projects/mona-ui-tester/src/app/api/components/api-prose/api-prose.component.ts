import { Component, computed, inject, input } from "@angular/core";
import { Router } from "@angular/router";
import { Marked } from "marked";
import { routeInternalLink } from "../../../layout/internal-links";
import { apiSymbolPath, prose } from "../../api-text";

const escapeHtml = (text: string): string =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * A description from the library's JSDoc, rendered as markdown. A code span that names an exported type links to that
 * type's page.
 */
@Component({
    selector: "app-api-prose",
    templateUrl: "./api-prose.component.html",
    host: {
        "(click)": "onClick($event)"
    }
})
export class ApiProseComponent {
    readonly #router = inject(Router);
    protected readonly html = computed(() => {
        const links = this.links();
        const marked = new Marked({
            renderer: {
                codespan({ text }): string {
                    const code = `<code>${escapeHtml(text)}</code>`;
                    return Object.hasOwn(links, text)
                        ? `<a href="${apiSymbolPath(links[text], text)}">${code}</a>`
                        : code;
                }
            }
        });
        const markdown = prose(this.markdown());
        return this.inline()
            ? marked.parseInline(markdown, { async: false })
            : marked.parse(markdown, { async: false });
    });
    /** Renders one line of text, without a paragraph around it. */
    public readonly inline = input(false);
    /** Exported names, with the entry point of each, that a code span may link to. */
    public readonly links = input<Readonly<Record<string, string>>>({});
    public readonly markdown = input.required<string>();

    protected onClick(event: MouseEvent): void {
        routeInternalLink(event, this.#router);
    }
}
