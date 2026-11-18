import { Extension } from "@tiptap/core";
import { type EditorState, Plugin, PluginKey, type Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";

/** An image being uploaded: what shows where it goes, until the image takes its place. */
interface ImagePlaceholder {
    readonly element: HTMLElement;
    readonly id: string;
    readonly position: number;
}

/** What a transaction asks of the placeholders: add one at a position, or remove one. */
type PlaceholderAction = { readonly add: ImagePlaceholder } | { readonly remove: string };

/** The options of {@link ImageUpload}. */
export interface ImageUploadOptions {
    /** The pasted or dropped files to upload, out of all of them. None leaves the paste or drop to the editor. */
    readonly accepted: (files: readonly File[]) => File[];

    /** Starts uploading the files, putting their images at the position. */
    readonly upload: (view: EditorView, files: readonly File[], position: number) => void;
}

const PLACEHOLDER_KEY = new PluginKey<readonly ImagePlaceholder[]>("monaImageUploadPlaceholders");

/** Where the content a transaction put in ends: after its last step's new range. */
function insertionEnd(tr: Transaction): number | null {
    let end: number | null = null;
    tr.mapping.maps.at(-1)?.forEach((_from, _to, _newFrom, newTo) => {
        end = newTo;
    });
    return end;
}

/** The files of a paste or drop, or none when there are none. */
function filesOf(transfer: DataTransfer | null): File[] {
    return transfer ? Array.from(transfer.files) : [];
}

/**
 * Shows a placeholder at a position while an image uploads. It is a widget, not content: the document and the value
 * don't change, and the placeholder moves with the text around it.
 */
export function addImagePlaceholder(view: EditorView, id: string, position: number, element: HTMLElement): void {
    const action: PlaceholderAction = { add: { element, id, position } };
    view.dispatch(view.state.tr.setMeta(PLACEHOLDER_KEY, action).setMeta("addToHistory", false));
}

/** Where a placeholder is now, or null when it's gone: removed, or deleted with the content on both sides of it. */
export function findImagePlaceholder(state: EditorState, id: string): number | null {
    return PLACEHOLDER_KEY.getState(state)?.find(placeholder => placeholder.id === id)?.position ?? null;
}

/** Removes a placeholder, in the transaction that puts the image in its place or on its own. */
export function removeImagePlaceholder(view: EditorView, id: string): void {
    const action: PlaceholderAction = { remove: id };
    view.dispatch(view.state.tr.setMeta(PLACEHOLDER_KEY, action).setMeta("addToHistory", false));
}

/** The meta that removes a placeholder, for a transaction that does more. */
export function imagePlaceholderRemoval(id: string): { readonly key: PluginKey; readonly value: PlaceholderAction } {
    return { key: PLACEHOLDER_KEY, value: { remove: id } };
}

/**
 * Uploads image files pasted or dropped into the content. The editor keeps the paste or drop when none of the files
 * is accepted, or when a paste also carries HTML, such as an image copied from a web page, which keeps its address.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- Tiptap extensions are named in PascalCase.
export const ImageUpload = Extension.create<ImageUploadOptions>({
    name: "monaImageUpload",

    addOptions() {
        return {
            accepted: () => [],
            upload: () => undefined
        };
    },

    addProseMirrorPlugins() {
        const options = this.options;
        return [
            new Plugin<readonly ImagePlaceholder[]>({
                key: PLACEHOLDER_KEY,
                state: {
                    init: () => [],
                    apply: (tr, placeholders) => {
                        const action = tr.getMeta(PLACEHOLDER_KEY) as PlaceholderAction | undefined;
                        const removedIndex =
                            action && "remove" in action
                                ? placeholders.findIndex(placeholder => placeholder.id === action.remove)
                                : -1;
                        const removed = removedIndex < 0 ? null : placeholders[removedIndex];
                        const end = removed && tr.docChanged ? insertionEnd(tr) : null;
                        // Mapped by hand: a widget is dropped once the character beside it is deleted, which would
                        // lose an upload to one Backspace. A placeholder goes only when a deletion spans it, and text
                        // typed at one goes after it. The image put in place of one goes before the placeholders
                        // added after it at the same place, so the images of one paste keep their order.
                        let next = !tr.docChanged
                            ? placeholders
                            : placeholders.flatMap((placeholder, index) => {
                                  if (
                                      end !== null &&
                                      index > removedIndex &&
                                      placeholder.position === removed?.position
                                  ) {
                                      return [{ ...placeholder, position: end }];
                                  }
                                  const mapped = tr.mapping.mapResult(placeholder.position, -1);
                                  return mapped.deletedAcross ? [] : [{ ...placeholder, position: mapped.pos }];
                              });
                        if (action && "add" in action) {
                            next = [...next, action.add];
                        } else if (action && "remove" in action) {
                            next = next.filter(placeholder => placeholder.id !== action.remove);
                        }
                        return next;
                    }
                },
                props: {
                    decorations: state => {
                        const placeholders = PLACEHOLDER_KEY.getState(state) ?? [];
                        if (placeholders.length === 0) {
                            return null;
                        }
                        return DecorationSet.create(
                            state.doc,
                            placeholders.map(({ element, id, position }) =>
                                Decoration.widget(position, element, { id, key: id, side: -1 })
                            )
                        );
                    },
                    handleDrop: (view, event, _slice, moved) => {
                        if (moved) {
                            return false;
                        }
                        const files = options.accepted(filesOf(event.dataTransfer));
                        if (files.length === 0) {
                            return false;
                        }
                        event.preventDefault();
                        const target = view.posAtCoords({ left: event.clientX, top: event.clientY });
                        options.upload(view, files, target?.pos ?? view.state.selection.from);
                        return true;
                    },
                    handlePaste: (view, event) => {
                        if (event.clipboardData?.getData("text/html")) {
                            return false;
                        }
                        const files = options.accepted(filesOf(event.clipboardData));
                        if (files.length === 0) {
                            return false;
                        }
                        event.preventDefault();
                        if (!view.state.selection.empty) {
                            view.dispatch(view.state.tr.deleteSelection());
                        }
                        options.upload(view, files, view.state.selection.from);
                        return true;
                    }
                }
            })
        ];
    }
});
