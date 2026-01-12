"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateText = void 0;
const google_translate_api_1 = require("@vitalets/google-translate-api");
const translateText = async (text, targetLang = 'uz') => {
    if (!text)
        return null;
    try {
        const { text: translatedText } = await (0, google_translate_api_1.translate)(text, { to: targetLang });
        return translatedText;
    }
    catch (error) {
        console.error(`Translation failed for text "${text}":`, error);
        return null;
    }
};
exports.translateText = translateText;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRpb24tc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvdHJhbnNsYXRpb24tc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx5RUFBMkQ7QUFFcEQsTUFBTSxhQUFhLEdBQUcsS0FBSyxFQUFFLElBQVksRUFBRSxhQUFxQixJQUFJLEVBQTBCLEVBQUU7SUFDckcsSUFBSSxDQUFDLElBQUk7UUFBRSxPQUFPLElBQUksQ0FBQztJQUV2QixJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxHQUFHLE1BQU0sSUFBQSxnQ0FBUyxFQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQzNFLE9BQU8sY0FBYyxDQUFDO0lBQ3hCLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsSUFBSSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDL0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBVlcsUUFBQSxhQUFhLGlCQVV4QiJ9