"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = autoTranslateCollection;
const utils_1 = require("@medusajs/framework/utils");
const translation_service_1 = require("../lib/translation-service");
async function autoTranslateCollection({ event: { data }, container, }) {
    const productService = container.resolve(utils_1.Modules.PRODUCT);
    const collections = await productService.listProductCollections({ id: data.id });
    const collection = collections?.[0];
    if (!collection) {
        return;
    }
    let needsUpdate = false;
    const metadata = collection.metadata || {};
    const titleManual = metadata.title_uz_manual === true;
    if (collection.title && !titleManual) {
        const titleSrc = metadata.title_uz_src;
        const shouldTranslateTitle = !metadata.title_uz || titleSrc !== collection.title;
        if (shouldTranslateTitle) {
            const translatedTitle = await (0, translation_service_1.translateText)(collection.title, "uz");
            if (translatedTitle) {
                metadata.title_uz = translatedTitle;
                metadata.title_uz_src = collection.title;
                needsUpdate = true;
            }
        }
    }
    if (needsUpdate) {
        await productService.updateProductCollections({ id: collection.id }, { metadata });
        console.log(`[AutoTranslate] Translated collection ${collection.id} to Uzbek`);
    }
}
exports.config = {
    event: ["product-collection.created", "product-collection.updated"],
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0by10cmFuc2xhdGUtY29sbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zdWJzY3JpYmVycy9hdXRvLXRyYW5zbGF0ZS1jb2xsZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUtBLDBDQW1DQztBQXRDRCxxREFBbUQ7QUFDbkQsb0VBQTBEO0FBRTNDLEtBQUssVUFBVSx1QkFBdUIsQ0FBQyxFQUNwRCxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFDZixTQUFTLEdBQ3NCO0lBQy9CLE1BQU0sY0FBYyxHQUEwQixTQUFTLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUVoRixNQUFNLFdBQVcsR0FBRyxNQUFPLGNBQXNCLENBQUMsc0JBQXNCLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDekYsTUFBTSxVQUFVLEdBQUcsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDbkMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2hCLE9BQU07SUFDUixDQUFDO0lBRUQsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFBO0lBQ3ZCLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFBO0lBRTFDLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxlQUFlLEtBQUssSUFBSSxDQUFBO0lBRXJELElBQUksVUFBVSxDQUFDLEtBQUssSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3JDLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxZQUFrQyxDQUFBO1FBQzVELE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxJQUFJLFFBQVEsS0FBSyxVQUFVLENBQUMsS0FBSyxDQUFBO1FBRWhGLElBQUksb0JBQW9CLEVBQUUsQ0FBQztZQUN6QixNQUFNLGVBQWUsR0FBRyxNQUFNLElBQUEsbUNBQWEsRUFBQyxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFBO1lBQ25FLElBQUksZUFBZSxFQUFFLENBQUM7Z0JBQ3BCLFFBQVEsQ0FBQyxRQUFRLEdBQUcsZUFBZSxDQUFBO2dCQUNuQyxRQUFRLENBQUMsWUFBWSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUE7Z0JBQ3hDLFdBQVcsR0FBRyxJQUFJLENBQUE7WUFDcEIsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRUQsSUFBSSxXQUFXLEVBQUUsQ0FBQztRQUNoQixNQUFPLGNBQXNCLENBQUMsd0JBQXdCLENBQUMsRUFBRSxFQUFFLEVBQUUsVUFBVSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQTtRQUMzRixPQUFPLENBQUMsR0FBRyxDQUFDLHlDQUF5QyxVQUFVLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQTtJQUNoRixDQUFDO0FBQ0gsQ0FBQztBQUVZLFFBQUEsTUFBTSxHQUFxQjtJQUN0QyxLQUFLLEVBQUUsQ0FBQyw0QkFBNEIsRUFBRSw0QkFBNEIsQ0FBQztDQUNwRSxDQUFBIn0=