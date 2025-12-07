import { translateText } from "../lib/translation-service";

async function testTranslation() {
  console.log("Testing translation service...");
  
  const textToTranslate = "Электрическая дрель";
  const targetLang = "uz";
  
  console.log(`Translating "${textToTranslate}" to "${targetLang}"...`);
  
  const translatedText = await translateText(textToTranslate, targetLang);
  
  console.log(`Result: ${translatedText}`);
  
  if (translatedText) {
    console.log("✅ Translation service is working!");
  } else {
    console.log("❌ Translation service failed.");
  }
}

testTranslation();
