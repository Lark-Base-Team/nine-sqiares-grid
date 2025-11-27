import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationZH from '../public/locales/zh-CN/translation.json';
import translationEN from '../public/locales/en/translation.json';
import translationJA from '../public/locales/ja/translation.json';



export function initI18n(lang: any) {
  // 初始化 i18n
  i18n.use(initReactI18next).init({
    resources: {
      en: {
        translation: translationEN,
      },
      zh: {
        translation: translationZH,
      },
      ja: {
        translation: translationJA,
      },
    },
    lng: lang, // 设置默认语言
    fallbackLng: 'en', // 如果没有对应的语言文件，则使用默认语言
    interpolation: {
      escapeValue: false, // 不进行 HTML 转义
    },
  });
}
