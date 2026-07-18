import { cva } from "class-variance-authority";

export const editorBaseVariants = cva(
    `
        flex flex-col
        bg-surface text-foreground
        border border-border
        transition-[border-color,box-shadow] duration-150 ease-in
        focus-within:border-focus-indicator
        focus-within:ring-2 focus-within:ring-focus-indicator/35

        prose prose-neutral max-w-none
        prose-headings:text-foreground prose-headings:font-bold
        prose-headings:mt-1 prose-headings:mb-1
        prose-p:text-foreground prose-p:my-1
        prose-strong:text-foreground
        prose-a:text-primary

        [&_ol]:ps-8 [&_ul]:ps-8

        [&_blockquote]:border-l-4
        [&_blockquote]:border-l-solid
        [&_blockquote]:border-l-border-control-hover
        [&_blockquote]:px-4 [&_blockquote]:py-2
        [&_blockquote]:ms-4
        [&_blockquote]:bg-surface-muted

        [&_hr]:my-1 [&_hr]:bg-border-subtle
        [&_hr]:border [&_hr]:border-border-subtle

        [&_ul[data-type='taskList']_li]:flex
        [&_ul[data-type='taskList']_li]:py-0.5
        [&_ul[data-type='taskList']_li>label]:grow-0
        [&_ul[data-type='taskList']_li>label]:shrink-0
        [&_ul[data-type='taskList']_li>label]:basis-auto
        [&_ul[data-type='taskList']_li>div]:grow-1
        [&_ul[data-type='taskList']_li>div]:shrink-1
        [&_ul[data-type='taskList']_li>div]:basis-auto
        [&_ul[data-type='taskList']_input[type='checkbox']]:me-2!

        [&_img]:max-w-full
        [&_img]:h-auto
        [&_img.ProseMirror-selectednode]:outline-3
        [&_img.ProseMirror-selectednode]:outline-focus-indicator

        [&_pre]:bg-surface-muted
        [&_pre]:border [&_pre]:border-border-subtle
        [&_pre]:whitespace-pre-wrap
        [&_pre]:font-mono
        [&_pre_code]:p-0
        [&_pre_code]:text-sm
        [&_pre_code]:bg-none

        [&.ProseMirror-gapcursor]:after:border-foreground!

        [&_table]:border-collapse
        [&_table]:m-0
        [&_table]:overflow-hidden
        [&_table]:table-fixed
        [&_table]:w-full
        [&_table_td]:border [&_table_td]:border-border-subtle
        [&_table_td]:p-2 [&_table_td]:align-top [&_table_td]:relative
        [&_table_th]:border [&_table_th]:border-border-subtle
        [&_table_th]:p-2 [&_table_th]:align-top [&_table_th]:relative

        [&_table_th]:bg-surface-muted [&_table_th]:text-foreground [&_table_th]:font-bold

        [&_.selectedCell]:after:content-[''] [&_.selectedCell]:after:absolute [&_.selectedCell]:after:inset-0
        [&_.selectedCell]:after:pointer-events-none
        [&_.selectedCell]:after:z-2
        [&_.selectedCell]:after:bg-active/70

        [&_.column-resize-handle]:absolute
        [&_.column-resize-handle]:bg-focus-indicator
        [&_.column-resize-handle]:w-1
        [&_.column-resize-handle]:pointer-events-none
        [&_.column-resize-handle]:top-0
        [&_.column-resize-handle]:-bottom-0.5
        [&_.column-resize-handle]:-right-0.5

        [&_.ProseMirror.resize-cursor]:cursor-ew-resize

    `
);

export const editorContainerVariants = cva(
    `
        h-full w-full bg-surface
        [&_div:first-child[contenteditable='true']]:p-1.5
        [&_div:first-child[contenteditable='true']]:text-foreground
        [&_div:first-child[contenteditable='true']]:border-none
        [&_div:first-child[contenteditable='true']]:outline-none
        [&_div:first-child[contenteditable='true']]:w-full
        [&_div:first-child[contenteditable='true']]:h-full
        [&_div:first-child[contenteditable='true']]:overflow-auto
        [&_div:first-child[contenteditable='true']]:resize-none
        [&_div:first-child[contenteditable='true']]:[scrollbar-width:thin]
    `
);

export const editorFontColorPreviewVariants = cva(
    `
        w-full flex h-[2px]
    `
);

export const editorFontColorValueVariants = cva(
    `
       flex flex-col items-center justify-center
       gap-0.5 ps-1.25 text-sm
    `
);

export const editorFontFamilyDropdownListVariants = cva(
    `
        w-[12em]
    `
);

export const editorFontHighlightPreviewVariants = cva(
    `
        w-full flex h-[2px]
    `
);

export const editorFontHighlightValueVariants = cva(
    `
       flex flex-col items-center justify-center
       gap-0.5 ps-1.25 text-sm
    `
);

export const editorFontSizeDropdownListVariants = cva(
    `
        w-[8em]
    `
);

export const editorHeadingsDropdownListVariants = cva(
    `
        w-[14em]
    `
);

export const editorImageInserterActionsVariants = cva(
    `
        flex justify-end gap-1 px-2 py-1
        bg-surface-muted
        border-t border-t-border-subtle
    `
);

export const editorImageInserterFormVariants = cva(
    `
        flex flex-col gap-1.5 pt-2
    `
);

export const editorImageInserterRowLabelVariants = cva(
    `
        mb-0.5 ps-0.5 text-sm font-semibold
    `
);

export const editorImageInserterRowVariants = cva(
    `
        flex flex-col justify-center px-2
    `
);

export const editorTableCreatorVariants = cva(
    `
        grid grid-cols-8 gap-0.5 p-1
    `
);

export const editorTableCreatorCellVariants = cva(
    `
        flex h-6 w-6
        bg-input-background border border-input-border
    `
);

export const editorToolbarVariants = cva(
    `
        flex flex-wrap items-center justify-start gap-1 p-1
        bg-surface-muted text-foreground border-b border-b-border-subtle
    `
);
