import { Image } from "@tiptap/extension-image";

/**
 * The image node with `width` and `height` kept as attributes, on top of the base `src`, `alt` and `title`.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- Tiptap extensions are named in PascalCase.
export const ExtendedImage = Image.extend({
    name: "extendedImage",
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: null,
                parseHTML: (element: Element) => element.getAttribute("width"),
                renderHTML: (attributes: Record<string, unknown>) =>
                    attributes["width"] ? { width: attributes["width"] } : {}
            },
            height: {
                default: null,
                parseHTML: (element: Element) => element.getAttribute("height"),
                renderHTML: (attributes: Record<string, unknown>) =>
                    attributes["height"] ? { height: attributes["height"] } : {}
            }
        };
    }
});
