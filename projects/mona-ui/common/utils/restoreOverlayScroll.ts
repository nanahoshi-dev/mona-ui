import { OverlayRef } from "@angular/cdk/overlay";

export const restoreOverlayScroll = (overlayRef: OverlayRef, element: HTMLElement): void => {
    requestAnimationFrame(() => {
        const scrollableContent = findScrollableElement(overlayRef.overlayElement);
        const scrollTop = scrollableContent?.scrollTop ?? 0;
        const width = element.getBoundingClientRect().width;

        overlayRef.updatePosition();
        overlayRef.updateSize({ width });

        requestAnimationFrame(() => {
            if (scrollableContent) {
                scrollableContent.scrollTop = scrollTop;
            }
        });
    });
};

const findScrollableElement = (container: HTMLElement): HTMLElement | null => {
    const virtualViewport = container.querySelector(".cdk-virtual-scroll-viewport") as HTMLElement | null;
    if (virtualViewport) {
        return virtualViewport;
    }
    const scrollable = container.querySelector("ul, [style*='overflow']") as HTMLElement | null;
    if (scrollable && scrollable.scrollHeight > scrollable.clientHeight) {
        return scrollable;
    }
    if (container.scrollHeight > container.clientHeight) {
        return container;
    }
    return null;
};
