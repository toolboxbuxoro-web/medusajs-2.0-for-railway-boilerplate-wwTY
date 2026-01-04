import { translate } from '@vitalets/google-translate-api';

export const translateText = async (text: string, targetLang: string = 'uz'): Promise<string | null> => {
  if (!text) return null;
  
  try {
    const { text: translatedText } = await translate(text, { to: targetLang });
    return translatedText;
  } catch (error) {
    console.error(`Translation failed for text "${text}":`, error);
    return null;
  }
};
