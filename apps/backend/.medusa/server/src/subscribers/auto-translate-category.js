"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = autoTranslateCategory;
const utils_1 = require("@medusajs/framework/utils");
const translation_service_1 = require("../lib/translation-service");
async function autoTranslateCategory({ event: { data }, container, }) {
    const productService = container.resolve(utils_1.Modules.PRODUCT);
    const category = await productService.retrieveProductCategory(data.id);
    let needsUpdate = false;
    const metadata = category.metadata || {};
    const nameManual = metadata.name_uz_manual === true;
    const descManual = metadata.description_uz_manual === true;
    if (category.name && !nameManual) {
        const nameSrc = metadata.name_uz_src;
        const shouldTranslateName = !metadata.name_uz || nameSrc !== category.name;
        if (shouldTranslateName) {
            const translatedName = await (0, translation_service_1.translateText)(category.name, "uz");
            if (translatedName) {
                metadata.name_uz = translatedName;
                metadata.name_uz_src = category.name;
                needsUpdate = true;
            }
        }
    }
    // If RU description was removed, clear auto translation (unless manual)
    if (!category.description && !descManual && (metadata.description_uz || metadata.description_uz_src)) {
        metadata.description_uz = null;
        metadata.description_uz_src = null;
        needsUpdate = true;
    }
    if (category.description && !descManual) {
        const descSrc = metadata.description_uz_src;
        const shouldTranslateDesc = !metadata.description_uz || descSrc !== category.description;
        if (shouldTranslateDesc) {
            const translatedDescription = await (0, translation_service_1.translateText)(category.description, "uz");
            if (translatedDescription) {
                metadata.description_uz = translatedDescription;
                metadata.description_uz_src = category.description;
                needsUpdate = true;
            }
        }
    }
    if (needsUpdate) {
        await productService.updateProductCategories(category.id, {
            metadata,
        });
        console.log(`[AutoTranslate] Translated category ${category.id} to Uzbek`);
    }
}
exports.config = {
    event: ["product-category.created", "product-category.updated"],
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0by10cmFuc2xhdGUtY2F0ZWdvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvc3Vic2NyaWJlcnMvYXV0by10cmFuc2xhdGUtY2F0ZWdvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBS0Esd0NBdURDO0FBMURELHFEQUFtRDtBQUNuRCxvRUFBMEQ7QUFFM0MsS0FBSyxVQUFVLHFCQUFxQixDQUFDLEVBQ2xELEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxFQUNmLFNBQVMsR0FDc0I7SUFDL0IsTUFBTSxjQUFjLEdBQTBCLFNBQVMsQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBRWhGLE1BQU0sUUFBUSxHQUFHLE1BQU0sY0FBYyxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUV0RSxJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7SUFDeEIsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUM7SUFFekMsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGNBQWMsS0FBSyxJQUFJLENBQUE7SUFDbkQsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLHFCQUFxQixLQUFLLElBQUksQ0FBQTtJQUUxRCxJQUFJLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNqQyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsV0FBaUMsQ0FBQTtRQUMxRCxNQUFNLG1CQUFtQixHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sSUFBSSxPQUFPLEtBQUssUUFBUSxDQUFDLElBQUksQ0FBQTtRQUUxRSxJQUFJLG1CQUFtQixFQUFFLENBQUM7WUFDeEIsTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFBLG1DQUFhLEVBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtZQUMvRCxJQUFJLGNBQWMsRUFBRSxDQUFDO2dCQUNuQixRQUFRLENBQUMsT0FBTyxHQUFHLGNBQWMsQ0FBQTtnQkFDakMsUUFBUSxDQUFDLFdBQVcsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFBO2dCQUNwQyxXQUFXLEdBQUcsSUFBSSxDQUFBO1lBQ3BCLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVELHdFQUF3RTtJQUN4RSxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLElBQUksUUFBUSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQztRQUNyRyxRQUFRLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQTtRQUM5QixRQUFRLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFBO1FBQ2xDLFdBQVcsR0FBRyxJQUFJLENBQUE7SUFDcEIsQ0FBQztJQUVELElBQUksUUFBUSxDQUFDLFdBQVcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3hDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxrQkFBd0MsQ0FBQTtRQUNqRSxNQUFNLG1CQUFtQixHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsSUFBSSxPQUFPLEtBQUssUUFBUSxDQUFDLFdBQVcsQ0FBQTtRQUV4RixJQUFJLG1CQUFtQixFQUFFLENBQUM7WUFDeEIsTUFBTSxxQkFBcUIsR0FBRyxNQUFNLElBQUEsbUNBQWEsRUFBQyxRQUFRLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFBO1lBQzdFLElBQUkscUJBQXFCLEVBQUUsQ0FBQztnQkFDMUIsUUFBUSxDQUFDLGNBQWMsR0FBRyxxQkFBcUIsQ0FBQTtnQkFDL0MsUUFBUSxDQUFDLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUE7Z0JBQ2xELFdBQVcsR0FBRyxJQUFJLENBQUE7WUFDcEIsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRUQsSUFBSSxXQUFXLEVBQUUsQ0FBQztRQUNoQixNQUFNLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFO1lBQ3hELFFBQVE7U0FDVCxDQUFDLENBQUE7UUFDRixPQUFPLENBQUMsR0FBRyxDQUFDLHVDQUF1QyxRQUFRLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQTtJQUM1RSxDQUFDO0FBQ0gsQ0FBQztBQUVZLFFBQUEsTUFBTSxHQUFxQjtJQUN0QyxLQUFLLEVBQUUsQ0FBQywwQkFBMEIsRUFBRSwwQkFBMEIsQ0FBQztDQUNoRSxDQUFBIn0=