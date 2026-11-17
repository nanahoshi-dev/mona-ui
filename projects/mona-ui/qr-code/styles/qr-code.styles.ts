/**
 * A square that keeps its colors in forced colors mode, where the code's contrast is what makes it scan. `max-w-full`
 * lets a fixed size shrink in a narrow container instead of overflowing it.
 */
export const QR_CODE_HOST_CLASSES = `
    inline-block aspect-square max-w-full shrink-0 align-middle
    forced-color-adjust-none
    [&>svg]:block [&>svg]:size-full
`;
