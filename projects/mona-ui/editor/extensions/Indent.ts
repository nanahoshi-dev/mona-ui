/**
 * Indent extension for Tiptap v3
 * Port of the well-known v2 example, updated for @tiptap/core@3 and @tiptap/pm.
 */

import { type CommandProps, Extension, type KeyboardShortcutCommand } from "@tiptap/core";
import { AllSelection, TextSelection, Transaction } from "@tiptap/pm/state";

export interface IndentOptions {
    /**
     * Default indent value in pixels.
     */
    defaultIndentLevel: number;

    /**
     * Allowed indent levels in pixels. Indent and outdent step to the next and previous level.
     */
    indentLevels: number[];

    /**
     * Node types that should support the `indent` attribute.
     * Typically: ['paragraph', 'heading']
     */
    types: string[];
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

/**
 * The level after `current` in `direction`, or `current` when there is none.
 */
const stepIndentLevel = (current: number, direction: 1 | -1, levels: readonly number[]): number => {
    const sorted = [...levels].sort((a, b) => (a - b) * direction);
    return sorted.find(level => (level - current) * direction > 0) ?? current;
};

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
 * Move the `indent` attribute of the node at `pos` one level in `direction`.
 */
const setNodeIndentMarkup = (tr: Transaction, pos: number, direction: 1 | -1, options: IndentOptions): Transaction => {
    const doc = tr.doc;
    if (!doc) return tr;

    const node = doc.nodeAt(pos);
    if (!node) return tr;

    const attrs = node.attrs as { indent?: number };
    const currentIndent = attrs.indent ?? 0;
    const indent = stepIndentLevel(currentIndent, direction, options.indentLevels);

    if (indent === currentIndent) return tr;

    const nodeAttrs = {
        ...node.attrs,
        indent
    };

    return tr.setNodeMarkup(pos, node.type, nodeAttrs, node.marks);
};

/**
 * Move all matching blocks in the current selection one level in `direction`.
 */
const updateIndentLevel = (tr: Transaction, direction: 1 | -1, options: IndentOptions): Transaction => {
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
            tr = setNodeIndentMarkup(tr, pos, direction, options);
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

// eslint-disable-next-line @typescript-eslint/naming-convention -- Tiptap extensions are named in PascalCase.
export const Indent = Extension.create<IndentOptions>({
    name: "indent",

    /**
     * Tiptap v3 uses `addOptions` instead of `defaultOptions`.
     */
    addOptions() {
        return {
            defaultIndentLevel: 0,
            indentLevels: [0, 30, 60, 90, 120, 150, 180, 210],
            types: ["paragraph", "heading"]
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
                                style: `margin-inline-start: ${indent}px;`
                            };
                        },
                        parseHTML: element => {
                            const el = element as HTMLElement;
                            const raw = el.style.marginInlineStart || el.style.marginLeft;
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
                    tr = updateIndentLevel(tr, 1, this.options);

                    // `can()` runs commands without `dispatch`: it only asks whether they would change anything.
                    if (!tr.docChanged) {
                        return false;
                    }
                    dispatch?.(tr);
                    return true;
                },

            outdent:
                () =>
                ({ tr, state, dispatch }: CommandProps) => {
                    const { selection } = state;

                    tr = tr.setSelection(selection);
                    tr = updateIndentLevel(tr, -1, this.options);

                    // `can()` runs commands without `dispatch`: it only asks whether they would change anything.
                    if (!tr.docChanged) {
                        return false;
                    }
                    dispatch?.(tr);
                    return true;
                }
        };
    },

    /**
     * Keyboard shortcuts:
     *  - Mod-] → indent()
     *  - Mod-[ → outdent()
     *
     * Tab is left to lists (where it nests the item) and to the browser, so the keyboard can leave the editor.
     */
    addKeyboardShortcuts() {
        const indentCommand: KeyboardShortcutCommand = () => this.editor.commands.indent();
        const outdentCommand: KeyboardShortcutCommand = () => this.editor.commands.outdent();

        return {
            // eslint-disable-next-line @typescript-eslint/naming-convention -- ProseMirror key names.
            "Mod-]": indentCommand,
            // eslint-disable-next-line @typescript-eslint/naming-convention -- ProseMirror key names.
            "Mod-[": outdentCommand
        };
    }
});

export default Indent;
