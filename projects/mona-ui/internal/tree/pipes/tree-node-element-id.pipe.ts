import { Pipe, PipeTransform } from "@angular/core";
import { getTreeNodeElementId } from "../utils/getTreeNodeElementId";

@Pipe({
    name: "treeNodeElementId"
})
export class TreeNodeElementIdPipe implements PipeTransform {
    public transform(uid: string): string {
        return getTreeNodeElementId(uid);
    }
}
