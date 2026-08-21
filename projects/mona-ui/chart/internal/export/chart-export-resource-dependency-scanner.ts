import { extractCssUrls } from "./chart-export-resource-policy";

/**
 * Generic visual resource dependency discovery (R6-01 / INV-03).
 *
 * Discovery answers "what URI dependencies exist?" and never mutates the tree;
 * policy classification happens afterwards in the resource manager so that
 * unknown surfaces fail closed instead of being silently left live.
 */

export interface ChartExportResourceDependency {
    readonly element: Element;
    readonly isLocalFragment: boolean;
    readonly rawValue: string;
    readonly source:
        | { readonly kind: "attribute"; readonly name: string }
        | { readonly kind: "style"; readonly property: string };
    readonly url: string;
}

const DIRECT_URI_ATTRIBUTES = new Set(["href", "xlink:href", "src", "poster"]);

/**
 * The serialized style attribute is already covered by inline style declaration
 * enumeration; scanning it as an attribute would double-report its url() tokens.
 */
const NON_RESOURCE_ATTRIBUTES = new Set(["style"]);

function toLocalFragmentId(url: string): string | null {
    const trimmed = url.trim();
    return trimmed.startsWith("#") && trimmed.length > 1 ? trimmed.slice(1) : null;
}

/**
 * Enumerates every visually relevant URI dependency inside a frozen island root:
 * direct URI attributes (href/xlink:href/src/poster), case-insensitive CSS url()
 * tokens in any attribute value, and case-insensitive CSS url() tokens in every
 * inline frozen style declaration.
 */
export function discoverResourceDependencies(root: Element): readonly ChartExportResourceDependency[] {
    const dependencies: ChartExportResourceDependency[] = [];

    for (const element of [root, ...Array.from(root.querySelectorAll("*"))]) {
        // 1. Direct URI attributes and CSS url(...) tokens inside other attribute values
        for (const name of element.getAttributeNames()) {
            const lowerName = name.toLowerCase();

            if (NON_RESOURCE_ATTRIBUTES.has(lowerName)) {
                continue;
            }

            const rawValue = (element.getAttribute(name) ?? "").trim();

            if (!rawValue) {
                continue;
            }

            if (DIRECT_URI_ATTRIBUTES.has(lowerName)) {
                dependencies.push({
                    element,
                    isLocalFragment: toLocalFragmentId(rawValue) !== null,
                    rawValue,
                    source: { kind: "attribute", name },
                    url: rawValue
                });
                continue;
            }

            if (/\burl\s*\(/i.test(rawValue)) {
                for (const url of extractCssUrls(rawValue)) {
                    dependencies.push({
                        element,
                        isLocalFragment: toLocalFragmentId(url) !== null,
                        rawValue,
                        source: { kind: "attribute", name },
                        url
                    });
                }
            }
        }

        // 2. Inline frozen style declarations
        const style = (element as HTMLElement).style;
        if (style) {
            for (let i = 0; i < style.length; i++) {
                const property = style[i];
                if (!property) {
                    continue;
                }
                const propertyValue = style.getPropertyValue(property);
                if (!propertyValue || !/\burl\s*\(/i.test(propertyValue)) {
                    continue;
                }
                for (const url of extractCssUrls(propertyValue)) {
                    dependencies.push({
                        element,
                        isLocalFragment: toLocalFragmentId(url) !== null,
                        rawValue: propertyValue,
                        source: { kind: "style", property },
                        url
                    });
                }
            }
        }
    }

    return dependencies;
}
