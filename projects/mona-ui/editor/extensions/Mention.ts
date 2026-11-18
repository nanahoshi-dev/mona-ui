import { mergeAttributes, Node } from "@tiptap/core";
import { type EditorState, Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

/** The text typed after `@`, and where it is, from the `@` to the caret. */
export interface MentionQuery {
    readonly from: number;
    readonly query: string;
    readonly to: number;
}

/** The options of {@link Mention}. */
export interface MentionOptions {
    /** Whether typing `@` offers mentions. Without it, the editor only keeps the mentions it has. */
    readonly enabled: () => boolean;

    /** Handles a key pressed while a query is typed, such as an arrow key in the suggestions. True if it did. */
    readonly onKeyDown: (event: KeyboardEvent) => boolean;

    /** Told when the query starts, changes or ends (null), and when the editor goes away (null). */
    readonly onQuery: (view: EditorView, query: MentionQuery | null) => void;
}

interface MentionPluginState {
    /** Where a query that Escape closed starts, so it stays closed while it is typed. */
    readonly dismissed: number | null;
    readonly query: MentionQuery | null;
}

/** The plugin's key, for a transaction that closes the query: `tr.setMeta(MENTION_KEY, { dismiss: query.from })`. */
export const MENTION_KEY = new PluginKey<MentionPluginState>("monaMention");

/** An `@` at the start of the text or after a space or an opening parenthesis, and what follows it up to the caret. */
const QUERY_PATTERN = /(?:^|[\s(])@([^\s@]{0,50})$/u;

/** The query at the caret: an `@` and what's typed after it, outside code. */
function findQuery(state: EditorState): MentionQuery | null {
    const { selection } = state;
    if (!selection.empty) {
        return null;
    }
    const $from = selection.$from;
    if (!$from.parent.isTextblock || $from.parent.type.spec.code) {
        return null;
    }
    const code = state.schema.marks["code"];
    if (code && $from.marks().some(mark => mark.type === code)) {
        return null;
    }
    const start = Math.max(0, $from.parentOffset - 60);
    const textBefore = $from.parent.textBetween(start, $from.parentOffset, undefined, "￼");
    const match = QUERY_PATTERN.exec(textBefore);
    if (!match) {
        return null;
    }
    const query = match[1] ?? "";
    return { from: $from.pos - query.length - 1, query, to: $from.pos };
}

function sameQuery(a: MentionQuery | null | undefined, b: MentionQuery | null | undefined): boolean {
    return a?.from === b?.from && a?.query === b?.query && a?.to === b?.to;
}

/**
 * A mention: `@` and a label, kept as one piece that is deleted at once. It's `<span data-type="mention"
 * data-id="…" data-label="…">@label</span>` in the HTML. While an `@` and the text after it are typed, the editor is
 * told the query, so it can offer what to mention.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- Tiptap extensions are named in PascalCase.
export const Mention = Node.create<MentionOptions>({
    name: "mention",
    group: "inline",
    inline: true,
    atom: true,
    selectable: false,

    addOptions() {
        return {
            enabled: () => false,
            onKeyDown: () => false,
            onQuery: () => undefined
        };
    },

    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: (element: HTMLElement) => element.getAttribute("data-id"),
                renderHTML: (attributes: Record<string, unknown>) =>
                    attributes["id"] ? { "data-id": attributes["id"] } : {}
            },
            label: {
                default: null,
                parseHTML: (element: HTMLElement) =>
                    element.getAttribute("data-label") ?? element.textContent?.replace(/^@/u, "") ?? null,
                renderHTML: (attributes: Record<string, unknown>) =>
                    attributes["label"] ? { "data-label": attributes["label"] } : {}
            }
        };
    },

    parseHTML() {
        return [{ tag: 'span[data-type="mention"]' }];
    },

    renderHTML({ HTMLAttributes: attributes, node }) {
        const label = String(node.attrs["label"] ?? node.attrs["id"] ?? "");
        return ["span", mergeAttributes({ "data-type": "mention" }, attributes), `@${label}`];
    },

    renderText({ node }) {
        return `@${String(node.attrs["label"] ?? node.attrs["id"] ?? "")}`;
    },

    addProseMirrorPlugins() {
        const options = this.options;
        return [
            new Plugin<MentionPluginState>({
                key: MENTION_KEY,
                state: {
                    init: () => ({ dismissed: null, query: null }),
                    apply: (tr, previous, _oldState, newState) => {
                        const meta = tr.getMeta(MENTION_KEY) as { readonly dismiss?: number } | undefined;
                        const dismissed =
                            meta?.dismiss ?? (previous.dismissed === null ? null : tr.mapping.map(previous.dismissed));
                        const query = options.enabled() ? findQuery(newState) : null;
                        if (query === null) {
                            return { dismissed: null, query: null };
                        }
                        return { dismissed, query: query.from === dismissed ? null : query };
                    }
                },
                view: view => {
                    let current: MentionQuery | null = null;
                    return {
                        update: updated => {
                            const next = MENTION_KEY.getState(updated.state)?.query ?? null;
                            if (!sameQuery(current, next)) {
                                current = next;
                                options.onQuery(updated, next);
                            }
                        },
                        destroy: () => {
                            if (current !== null) {
                                current = null;
                                options.onQuery(view, null);
                            }
                        }
                    };
                },
                props: {
                    handleKeyDown: (view, event) => {
                        const query = MENTION_KEY.getState(view.state)?.query;
                        if (!query || event.isComposing) {
                            return false;
                        }
                        if (event.key === "Escape") {
                            view.dispatch(view.state.tr.setMeta(MENTION_KEY, { dismiss: query.from }));
                            return true;
                        }
                        return options.onKeyDown(event);
                    }
                }
            })
        ];
    }
});
