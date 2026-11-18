import { cva } from "class-variance-authority";

/**
 * Avatars overlap, each after the first pulled back over the one before by a quarter of its width (the group sets
 * `--mona-avatar-group-overlap`), with a ring in the page's color to keep their edges apart. The ring is a shadow, which
 * forced colors drop, so the avatars' own borders separate them there.
 */
export const avatarGroupThemeVariants = cva(
    `
        inline-flex items-center
        [&>*]:ring-2 [&>*]:ring-background
        [&>*:not(:first-child)]:ms-(--mona-avatar-group-overlap)
    `
);

/** The item that stands for the avatars past `max`. */
export const AVATAR_GROUP_MORE_CLASSES = `
    inline-flex items-center justify-center overflow-hidden
    border-solid border-border bg-secondary text-secondary-foreground
    font-semibold tabular-nums leading-none select-none
`;
