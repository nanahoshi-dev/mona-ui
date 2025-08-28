import { cva } from "class-variance-authority";

export const listVariants = cva(
    `
        h-full flex flex-col overflow-hidden
    `,
    {
        variants: {}
    }
);

export const listInnerListVariants = cva(
    `
        list-none p-0 m-0 overflow-x-hidden overflow-y-auto
        h-full outline-none
    `,
    {
        variants: {}
    }
);

export const listGroupHeaderVariants = cva(
    `
        px-3 py-1.5 font-bold select-none
    `,
    {
        variants: {}
    }
);

export const listGroupHeaderTextVariants = cva(`font-bold select-none`, {
    variants: {}
});

export const listItemTextVariants = cva(``, {
    variants: {}
});

export const listItemVariants = cva(
    `
        relative flex cursor-default select-none items-center
        outline-none focus:bg-accent focus:text-accent-foreground
        px-3 py-1
        hover:bg-accent hover:text-accent-foreground
        data-[disabled='false']:cursor-pointer
        data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-50
        data-[selected='true']:bg-primary data-[selected='true']:text-primary-foreground
        data-[highlighted='true']:ring-1 data-[highlighted='true']:ring-ring/20
        data-[highlighted='true']:bg-accent data-[highlighted='true']:text-accent-foreground
        data-[highlighted='true']:rounded-none
        data-[focused]:bg-accent data-[focused]:text-accent-foreground
    `,
    {
        variants: {}
    }
);
