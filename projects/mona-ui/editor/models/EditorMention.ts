import type { Observable } from "rxjs";

/**
 * Someone, or something, the content can mention. A mention keeps both: the content shows `@label`, and the HTML
 * keeps the id in `data-id` for the page to read, such as to notify the person.
 */
export interface EditorMention {
    /** What the mention refers to, such as a user id. */
    readonly id: string;

    /** What the mention shows after the `@`, such as a name. */
    readonly label: string;
}

/**
 * Finds the mentions to offer for the text typed after `@`, which is empty right after the `@`. It returns them, or a
 * promise or an observable of them; a new search replaces one still running, so an observable can be HttpClient's
 * request. Return a few, such as the first ten matches: the list doesn't page.
 */
export type EditorMentionSearch = (
    query: string
) => Iterable<EditorMention> | Observable<Iterable<EditorMention>> | Promise<Iterable<EditorMention>>;
