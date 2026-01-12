"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = autoTranslateProduct;
const utils_1 = require("@medusajs/framework/utils");
const translation_service_1 = require("../lib/translation-service");
async function autoTranslateProduct({ event: { data }, container, }) {
    const productService = container.resolve(utils_1.Modules.PRODUCT);
    const product = await productService.retrieveProduct(data.id);
    let needsUpdate = false;
    const metadata = product.metadata || {};
    // Avoid infinite loops:
    // - we store the RU source text in *_uz_src
    // - on the next subscriber run, src will match and no update will happen
    //
    // Manual override:
    // - if *_uz_manual is true, we never overwrite the translation automatically
    const titleManual = metadata.title_uz_manual === true;
    const descManual = metadata.description_uz_manual === true;
    if (product.title && !titleManual) {
        const titleSrc = metadata.title_uz_src;
        const shouldTranslateTitle = !metadata.title_uz || titleSrc !== product.title;
        if (shouldTranslateTitle) {
            const translatedTitle = await (0, translation_service_1.translateText)(product.title, "uz");
            if (translatedTitle) {
                metadata.title_uz = translatedTitle;
                metadata.title_uz_src = product.title;
                needsUpdate = true;
            }
        }
    }
    // If RU description was removed, clear auto translation (unless manual)
    if (!product.description && !descManual && (metadata.description_uz || metadata.description_uz_src)) {
        metadata.description_uz = null;
        metadata.description_uz_src = null;
        needsUpdate = true;
    }
    if (product.description && !descManual) {
        const descSrc = metadata.description_uz_src;
        const shouldTranslateDesc = !metadata.description_uz || descSrc !== product.description;
        if (shouldTranslateDesc) {
            const translatedDescription = await (0, translation_service_1.translateText)(product.description, "uz");
            if (translatedDescription) {
                metadata.description_uz = translatedDescription;
                metadata.description_uz_src = product.description;
                needsUpdate = true;
            }
        }
    }
    if (needsUpdate) {
        await productService.updateProducts(product.id, {
            metadata,
        });
        console.log(`[AutoTranslate] Translated product ${product.id} to Uzbek`);
    }
}
exports.config = {
    event: ["product.created", "product.updated"],
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0by10cmFuc2xhdGUtcHJvZHVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zdWJzY3JpYmVycy9hdXRvLXRyYW5zbGF0ZS1wcm9kdWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUtBLHVDQTZEQztBQWhFRCxxREFBbUQ7QUFDbkQsb0VBQTBEO0FBRTNDLEtBQUssVUFBVSxvQkFBb0IsQ0FBQyxFQUNqRCxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFDZixTQUFTLEdBQ3NCO0lBQy9CLE1BQU0sY0FBYyxHQUEwQixTQUFTLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUVoRixNQUFNLE9BQU8sR0FBRyxNQUFNLGNBQWMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBRTdELElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztJQUN4QixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQztJQUV4Qyx3QkFBd0I7SUFDeEIsNENBQTRDO0lBQzVDLHlFQUF5RTtJQUN6RSxFQUFFO0lBQ0YsbUJBQW1CO0lBQ25CLDZFQUE2RTtJQUM3RSxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsZUFBZSxLQUFLLElBQUksQ0FBQTtJQUNyRCxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMscUJBQXFCLEtBQUssSUFBSSxDQUFBO0lBRTFELElBQUksT0FBTyxDQUFDLEtBQUssSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2xDLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxZQUFrQyxDQUFBO1FBQzVELE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxJQUFJLFFBQVEsS0FBSyxPQUFPLENBQUMsS0FBSyxDQUFBO1FBRTdFLElBQUksb0JBQW9CLEVBQUUsQ0FBQztZQUN6QixNQUFNLGVBQWUsR0FBRyxNQUFNLElBQUEsbUNBQWEsRUFBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFBO1lBQ2hFLElBQUksZUFBZSxFQUFFLENBQUM7Z0JBQ3BCLFFBQVEsQ0FBQyxRQUFRLEdBQUcsZUFBZSxDQUFBO2dCQUNuQyxRQUFRLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUE7Z0JBQ3JDLFdBQVcsR0FBRyxJQUFJLENBQUE7WUFDcEIsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRUQsd0VBQXdFO0lBQ3hFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsSUFBSSxRQUFRLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDO1FBQ3BHLFFBQVEsQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFBO1FBQzlCLFFBQVEsQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUE7UUFDbEMsV0FBVyxHQUFHLElBQUksQ0FBQTtJQUNwQixDQUFDO0lBRUQsSUFBSSxPQUFPLENBQUMsV0FBVyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDdkMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGtCQUF3QyxDQUFBO1FBQ2pFLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxRQUFRLENBQUMsY0FBYyxJQUFJLE9BQU8sS0FBSyxPQUFPLENBQUMsV0FBVyxDQUFBO1FBRXZGLElBQUksbUJBQW1CLEVBQUUsQ0FBQztZQUN4QixNQUFNLHFCQUFxQixHQUFHLE1BQU0sSUFBQSxtQ0FBYSxFQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUE7WUFDNUUsSUFBSSxxQkFBcUIsRUFBRSxDQUFDO2dCQUMxQixRQUFRLENBQUMsY0FBYyxHQUFHLHFCQUFxQixDQUFBO2dCQUMvQyxRQUFRLENBQUMsa0JBQWtCLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQTtnQkFDakQsV0FBVyxHQUFHLElBQUksQ0FBQTtZQUNwQixDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFRCxJQUFJLFdBQVcsRUFBRSxDQUFDO1FBQ2hCLE1BQU0sY0FBYyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFO1lBQzlDLFFBQVE7U0FDVCxDQUFDLENBQUE7UUFDRixPQUFPLENBQUMsR0FBRyxDQUFDLHNDQUFzQyxPQUFPLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQTtJQUMxRSxDQUFDO0FBQ0gsQ0FBQztBQUVZLFFBQUEsTUFBTSxHQUFxQjtJQUN0QyxLQUFLLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBQztDQUM5QyxDQUFBIn0=