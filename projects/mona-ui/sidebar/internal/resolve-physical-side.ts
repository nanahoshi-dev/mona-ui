import type { MonaTextDirection } from "@nanahoshi/mona-ui/i18n";
import type { SidebarLogicalSide } from "../models/SidebarSide";

/** The physical edge a sidebar sits against, for the styles that have to name one. */
export function resolvePhysicalSide(direction: MonaTextDirection, side: SidebarLogicalSide): "left" | "right" {
    const isRtl = direction === "rtl";
    if (side === "start") {
        return isRtl ? "right" : "left";
    }
    return isRtl ? "left" : "right";
}
