import { ChartExportError } from "../../models/chart-export.models";
import { containsCssUrl, extractCssUrls } from "./chart-export-resource-policy";

/**
 * Deterministic fragment isolation for staged raster islands (R6-02 / INV-04).
 *
 * Raster islands are temporarily staged under document.body, so any preserved
 * island-local ID shares the live document ID namespace. If the live page already
 * uses the same ID, fragment resolution becomes ambiguous. Isolation rewrites all
 * IDs in the frozen root to transaction-local namespaced values and rewrites every
 * owned local reference (href/xlink:href/url(#id)) through the same map.
 *
 * Must run AFTER resource dependency validation (which proves every preserved
 * fragment target is inside the island) and BEFORE staging/rasterization.
 */

type FragmentRewriteMap = ReadonlyMap<string, string>;

function collectIslandIds(root: Element): readonly { readonly element: Element; readonly id: string }[] {
    const found: { element: Element; id: string }[] = [];

    for (const element of [root, ...Array.from(root.querySelectorAll("*"))]) {
        const id = element.getAttribute("id")?.trim();
        if (id) {
            found.push({ element, id });
        }
    }

    return found;
}

function buildRewriteMap(ids: readonly { readonly id: string }[], namespacePrefix: string): FragmentRewriteMap {
    const map = new Map<string, string>();
    for (const { id } of ids) {
        if (map.has(id)) {
            throw new ChartExportError("resource-load-failed", `Template SVG document contains duplicate ID '#${id}'.`);
        }
        map.set(id, `${namespacePrefix}--${id}`);
    }
    return map;
}

function rewriteLocalUriAttribute(value: string, rewriteMap: FragmentRewriteMap): string | null {
    const trimmed = value.trim();
    if (!trimmed.startsWith("#")) {
        return null;
    }
    const targetId = trimmed.slice(1);
    const rewritten = rewriteMap.get(targetId);
    if (!rewritten) {
        throw new ChartExportError(
            "resource-load-failed",
            `Template SVG reference '#${targetId}' was not certified as an island-owned fragment before isolation.`
        );
    }
    return `#${rewritten}`;
}

function rewriteCssUrlTokens(value: string, rewriteMap: FragmentRewriteMap): string {
    let updated = value;
    for (const url of extractCssUrls(value)) {
        const trimmed = url.trim();
        if (!trimmed.startsWith("#")) {
            continue;
        }
        const targetId = trimmed.slice(1);
        const rewritten = rewriteMap.get(targetId);
        if (!rewritten) {
            throw new ChartExportError(
                "resource-load-failed",
                `Template CSS reference 'url(#${targetId})' was not certified as an island-owned fragment before isolation.`
            );
        }
        updated = updated.replace(`#${targetId}`, `#${rewritten}`);
    }
    return updated;
}

/**
 * Namespaces every ID declared in the frozen root and rewrites all owned local
 * references consistently. Only URI-context fragments are rewritten; color hashes,
 * text content, and unrelated data are untouched (R6-02 §22.4). External URLs must
 * already have been captured or rejected by resource policy. Uncertified local
 * references fail closed.
 */
export function isolateFragmentIds(root: Element, namespacePrefix: string): boolean {
    if (!namespacePrefix) {
        throw new ChartExportError(
            "template-rasterization-failed",
            "Fragment isolation requires a non-empty deterministic namespace prefix."
        );
    }

    // Pass 1 — collect and validate IDs using original values for understandable diagnostics.
    const islandIds = collectIslandIds(root);
    const rewriteMap = buildRewriteMap(islandIds, namespacePrefix);

    // Pass 2 — rewrite declarations and every owned local reference. Reference
    // certification runs even when the island declares no IDs of its own, so an
    // uncertified local reference can never silently survive isolation.

    // Pass 2 — rewrite declarations and every owned local reference.
    for (const { element, id } of islandIds) {
        element.setAttribute("id", rewriteMap.get(id)!);
    }

    for (const element of [root, ...Array.from(root.querySelectorAll("*"))]) {
        for (const attributeName of ["href", "xlink:href"]) {
            if (!element.hasAttribute(attributeName)) {
                continue;
            }
            const rewritten = rewriteLocalUriAttribute(element.getAttribute(attributeName) ?? "", rewriteMap);
            if (rewritten !== null) {
                element.setAttribute(attributeName, rewritten);
            }
        }

        for (const attributeName of element.getAttributeNames()) {
            const rawValue = element.getAttribute(attributeName) ?? "";
            if (!rawValue || !containsCssUrl(rawValue)) {
                continue;
            }
            const updated = rewriteCssUrlTokens(rawValue, rewriteMap);
            if (updated !== rawValue) {
                element.setAttribute(attributeName, updated);
            }
        }

        const style = (element as HTMLElement).style;
        if (style) {
            for (let i = 0; i < style.length; i++) {
                const property = style[i];
                if (!property) {
                    continue;
                }
                const propertyValue = style.getPropertyValue(property);
                if (!propertyValue || !containsCssUrl(propertyValue)) {
                    continue;
                }
                const updated = rewriteCssUrlTokens(propertyValue, rewriteMap);
                if (updated !== propertyValue) {
                    style.setProperty(property, updated);
                }
            }
        }
    }

    return islandIds.length > 0;
}
