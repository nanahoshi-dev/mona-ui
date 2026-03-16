import { NotificationType } from "../models/NotificationType";

export function getDefaultTitle(type: NotificationType): string {
    switch (type) {
        case "info":
            return "Info";
        case "success":
            return "Success";
        case "warning":
            return "Warning";
        case "error":
            return "Error";
    }
}
