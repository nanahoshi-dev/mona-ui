import { Image, SetImageOptions } from "@tiptap/extension-image";

type ImageAttributes = {
    alt?: string;
    src: string;
    title?: string;
};

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        image: {
            setImage: (options: SetImageOptions) => ReturnType;
        };
    }
}

export const ExtendedImage = Image.extend({
    name: "extendedImage",
    addAttributes() {
        return {
            width: {
                default: null,
                parseHTML: (element: Element) => element.getAttribute("width"),
                renderHTML: (attributes: Record<string, unknown>) =>
                    attributes["width"] ? { width: attributes["width"] } : {}
            },
            height: {
                default: null,
                parseHTML: (element: Element) => element.getAttribute("height"),
                renderHTML: (attributes: Record<string, never>) =>
                    attributes["height"] ? { height: attributes["height"] } : {}
            }
        };
    }
});
