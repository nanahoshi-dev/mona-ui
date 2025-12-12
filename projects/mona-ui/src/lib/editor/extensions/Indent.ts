/**
 * Indent extension for Tiptap v3
 * Port of the well-known v2 example, updated for @tiptap/core@3 and @tiptap/pm.
 */

import { type CommandProps, Extension, type KeyboardShortcutCommand } from "@tiptap/core";
import { AllSelection, TextSelection, Transaction } from "@tiptap/pm/state";

export interface IndentOptions {
    /**
     * Node types that should support the `indent` attribute.
     * Typically: ['paragraph', 'heading']
     */
    types: string[];

    /**
     * Allowed indent levels in pixels.
     * The extension will clamp to min/max of this list.
     */
    indentLevels: number[];

    /**
     * Default indent value in pixels.
     */
    defaultIndentLevel: number;
}

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        indent: {
            /**
             * Increase indent on the current block(s).
             */
            indent: () => ReturnType;

            /**
             * Decrease indent on the current block(s).
             */
            outdent: () => ReturnType;
        };
    }
}

const clamp = (val: number, min: number, max: number): number => {
    if (val < min) return min;
    if (val > max) return max;
    return val;
};

enum IndentProps {
    min = 0,
    max = 210,
    more = 30,
    less = -30
}

/**
 * Helpers for list detection (kept simple here).
 * If you want to support more list types, extend these.
 */
const isBulletListNode = (name: string): boolean => name === "bulletList" || name === "bullet_list";
const isOrderedListNode = (name: string): boolean => name === "orderedList" || name === "ordered_list";
const isTaskListNode = (name: string): boolean => name === "taskList" || name === "task_list";

const isListNodeName = (name: string): boolean =>
    isBulletListNode(name) || isOrderedListNode(name) || isTaskListNode(name);

/**
 * Update the `indent` attribute of the node at `pos` by `delta` pixels.
 */
const setNodeIndentMarkup = (tr: Transaction, pos: number, delta: number): Transaction => {
    const doc = tr.doc;
    if (!doc) return tr;

    const node = doc.nodeAt(pos);
    if (!node) return tr;

    const minIndent = IndentProps.min;
    const maxIndent = IndentProps.max;

    const currentIndent = (node.attrs as any).indent ?? 0;
    const indent = clamp(currentIndent + delta, minIndent, maxIndent);

    if (indent === currentIndent) return tr;

    const nodeAttrs = {
        ...node.attrs,
        indent
    };

    return tr.setNodeMarkup(pos, node.type, nodeAttrs, node.marks);
};

/**
 * Apply indent delta to all matching blocks in the current selection.
 */
const updateIndentLevel = (tr: Transaction, delta: number, options: IndentOptions): Transaction => {
    const { doc, selection } = tr;

    if (!doc || !selection) return tr;
    if (!(selection instanceof TextSelection || selection instanceof AllSelection)) {
        return tr;
    }

    const { from, to } = selection;

    doc.nodesBetween(from, to, (node, pos) => {
        const nodeName = node.type.name;

        // Only apply to configured types (typically paragraph + heading)
        if (options.types.includes(nodeName)) {
            tr = setNodeIndentMarkup(tr, pos, delta);
            return false;
        }

        // Don’t traverse into lists (you might want to handle list indentation differently)
        if (isListNodeName(nodeName)) {
            return false;
        }

        return true;
    });

    return tr;
};

export const Indent = Extension.create<IndentOptions>({
    name: "indent",

    /**
     * Tiptap v3 uses `addOptions` instead of `defaultOptions`.
     */
    addOptions() {
        return {
            types: ["paragraph", "heading"],
            indentLevels: [0, 30, 60, 90, 120, 150, 180, 210],
            defaultIndentLevel: 0
        };
    },

    /**
     * Attach a global `indent` attribute to the configured node types.
     * Stored as a pixel value and rendered as `margin-left`.
     */
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    indent: {
                        default: this.options.defaultIndentLevel,
                        renderHTML: attributes => {
                            const indent = attributes["indent"] ?? this.options.defaultIndentLevel;
                            if (!indent || indent === 0) {
                                return {};
                            }

                            return {
                                style: `margin-left: ${indent}px;`
                            };
                        },
                        parseHTML: element => {
                            const raw = (element as HTMLElement).style.marginLeft;
                            const parsed = raw ? parseInt(raw, 10) : NaN;
                            return Number.isNaN(parsed) ? this.options.defaultIndentLevel : parsed;
                        }
                    }
                }
            }
        ];
    },

    addCommands() {
        return {
            indent:
                () =>
                ({ tr, state, dispatch }: CommandProps) => {
                    const { selection } = state;

                    // Keep current selection intact
                    tr = tr.setSelection(selection);
                    tr = updateIndentLevel(tr, IndentProps.more, this.options);

                    if (tr.docChanged && dispatch) {
                        dispatch(tr);
                        return true;
                    }

                    return false;
                },

            outdent:
                () =>
                ({ tr, state, dispatch }: CommandProps) => {
                    const { selection } = state;

                    tr = tr.setSelection(selection);
                    tr = updateIndentLevel(tr, IndentProps.less, this.options);

                    if (tr.docChanged && dispatch) {
                        dispatch(tr);
                        return true;
                    }

                    return false;
                }
        };
    },

    /**
     * Default keyboard shortcuts:
     *  - Tab       → indent()
     *  - Shift-Tab → outdent()
     */
    addKeyboardShortcuts() {
        const indentCommand: KeyboardShortcutCommand = () => this.editor.commands.indent();
        const outdentCommand: KeyboardShortcutCommand = () => this.editor.commands.outdent();

        return {
            Tab: indentCommand,
            "Shift-Tab": outdentCommand
        };
    }
});

export default Indent;
