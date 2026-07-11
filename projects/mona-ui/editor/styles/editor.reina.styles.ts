import { cva } from "class-variance-authority";

export const reinaEditorBaseVariants = cva(
    `
        flex flex-col bg-background text-foreground
        rounded-lg border border-solid border-input-border
        transition-[border-color] duration-150 ease-out
        focus-visible:ring-2 focus-visible:ring-primary/35
        focus-visible:border-primary

        prose prose-neutral max-w-none
        prose-headings:text-foreground prose-headings:font-semibold
        prose-headings:mt-1 prose-headings:mb-1
        prose-p:text-foreground prose-p:my-1
        prose-strong:text-foreground
        prose-a:text-primary

        [&_ol]:ps-8 [&_ul]:ps-8

        [&_blockquote]:border-l-4
        [&_blockquote]:border-l-solid
        [&_blockquote]:border-l-primary
        [&_blockquote]:px-4 [&_blockquote]:py-2
        [&_blockquote]:ms-4
        [&_blockquote]:bg-background-light

        [&_hr]:border [&_hr]:border-solid [&_hr]:border-input-border
        [&_hr]:bg-background-dark [&_hr]:my-1

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
        [&_img.ProseMirror-selectednode]:outline-primary

        [&_pre]:bg-background-dark
        [&_pre]:border [&_pre]:border-solid [&_pre]:border-input-border
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
        [&_table_td]:border [&_table_td]:border-solid [&_table_td]:border-foreground/40
        [&_table_td]:p-2 [&_table_td]:align-top [&_table_td]:relative
        [&_table_th]:border [&_table_th]:border-solid [&_table_th]:border-foreground/40
        [&_table_th]:p-2 [&_table_th]:align-top [&_table_th]:relative

        [&_table_th]:bg-background-darker [&_table_th]:color-foreground [&_table_th]:font-semibold

        [&_.selectedCell]:after:content-[''] [&_.selectedCell]:after:absolute [&_.selectedCell]:after:inset-0
        [&_.selectedCell]:after:pointer-events-none
        [&_.selectedCell]:after:z-2
        [&_.selectedCell]:after:bg-primary

        [&_.column-resize-handle]:absolute
        [&_.column-resize-handle]:bg-primary
        [&_.column-resize-handle]:w-1
        [&_.column-resize-handle]:pointer-events-none
        [&_.column-resize-handle]:top-0
        [&_.column-resize-handle]:-bottom-0.5
        [&_.column-resize-handle]:-right-0.5

        [&_.ProseMirror.resize-cursor]:cursor-ew-resize

    `
);

export const reinaEditorContainerVariants = cva(
    `
        bg-background w-full h-full
        [&_div:first-child[contenteditable='true']]:p-1.5
        [&_div:first-child[contenteditable='true']]:text-foreground
        [&_div:first-child[contenteditable='true']]:border-none
        [&_div:first-child[contenteditable='true']]:outline-none
        [&_div:first-child[contenteditable='true']]:w-full
        [&_div:first-child[contenteditable='true']]:h-full
        [&_div:first-child[contenteditable='true']]:overflow-auto
        [&_div:first-child[contenteditable='true']]:[scrollbar-width:thin]
    `
);

export const reinaEditorFontColorPreviewVariants = cva(`w-full flex h-[2px]`);

export const reinaEditorFontColorValueVariants = cva(`
       flex flex-col items-center justify-center
       gap-0.5 ps-1.25 text-sm
    `);

export const reinaEditorFontFamilyDropdownListVariants = cva(`w-[12em]`);

export const reinaEditorFontHighlightPreviewVariants = cva(`w-full flex h-[2px]`);

export const reinaEditorFontHighlightValueVariants = cva(`
       flex flex-col items-center justify-center
       gap-0.5 ps-1.25 text-sm
    `);

export const reinaEditorFontSizeDropdownListVariants = cva(`w-[8em]`);

export const reinaEditorHeadingsDropdownListVariants = cva(`w-[14em]`);

export const reinaEditorImageInserterActionsVariants = cva(`
        flex justify-end gap-1 px-2 py-1
        bg-background-dark
        border-t border-t-solid border-t-input-border
    `);

export const reinaEditorImageInserterFormVariants = cva(`flex flex-col gap-1.5 pt-2`);

export const reinaEditorImageInserterRowLabelVariants = cva(`mb-0.5 ps-0.5 text-sm font-semibold`);

export const reinaEditorImageInserterRowVariants = cva(`flex flex-col justify-center px-2`);

export const reinaEditorTableCreatorVariants = cva(`grid grid-cols-8 gap-0.5 p-1`);

export const reinaEditorTableCreatorCellVariants = cva(`
        flex rounded-sm border border-solid border-input-border
        w-6 h-6 bg-background-light
    `);

export const reinaEditorToolbarVariants = cva(`
        flex flex-wrap items-center justify-start gap-1 p-1
        bg-background-dark text-foreground border-b border-b-solid border-b-input-border
    `);
