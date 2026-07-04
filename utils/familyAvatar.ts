import { ImageSourcePropType } from "react-native";

/** Map relationship label to circle avatar image. General/unknown uses AV17.png */
export const getFamilyAvatarSource = (label: string): ImageSourcePropType => {
    const l = label.toLowerCase();
    if (l.includes("father") || l.includes("dad")) return require("../assets/images/Father.png");
    if (l.includes("mother") || l.includes("mom")) return require("../assets/images/Mother.png");
    if (l.includes("brother")) {
        if (l.includes("old") || l.includes("older")) return require("../assets/images/OldBrother.png");
        return require("../assets/images/YoungBrother.png");
    }
    if (l.includes("sister")) {
        if (l.includes("old") || l.includes("older")) return require("../assets/images/OldSis.png");
        return require("../assets/images/YoungSis.png");
    }
    if (l.includes("son")) return require("../assets/images/YoungBrother.png");
    if (l.includes("daughter")) return require("../assets/images/YoungSis.png");
    return require("../assets/images/AV17.png");
};
