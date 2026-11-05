import type { EditorState } from "@tiptap/pm/state";

/**
 * Reads an attribute of a mark across the selection. It returns the value only when all the selected text shares it,
 * and `null` when any of it lacks the mark or has another value, so that a color picker has something to change.
 * With only a cursor, it reads the marks the next typed text would get.
 */
export const selectionMarkAttribute = (state: EditorState, markName: string, attribute: string): string | null => {
    const read = (marks: readonly { attrs: Record<string, unknown>; type: { name: string } }[]): string | null => {
        const value = marks.find(mark => mark.type.name === markName)?.attrs[attribute];
        return typeof value === "string" && value ? value : null;
    };

    if (state.selection.empty) {
        return read(state.storedMarks ?? state.selection.$from.marks());
    }

    let common: string | null | undefined;
    for (const { $from, $to } of state.selection.ranges) {
        state.doc.nodesBetween($from.pos, $to.pos, node => {
            if (node.isText) {
                const value = read(node.marks);
                common = common === undefined || common === value ? value : null;
            }
        });
    }
    return common ?? null;
};
