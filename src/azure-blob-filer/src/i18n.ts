import { createI18n } from 'vue-i18n';

const messages = {
  ja: {
    // PrimeVue Locale
    primevueLocale: {
      monthNamesJanuary: '1月',
      monthNamesFebruary: '2月',
      monthNamesMarch: '3月',
      monthNamesApril: '4月',
      monthNamesMay: '5月',
      monthNamesJune: '6月',
      monthNamesJuly: '7月',
      monthNamesAugust: '8月',
      monthNamesSeptember: '9月',
      monthNamesOctober: '10月',
      monthNamesNovember: '11月',
      monthNamesDecember: '12月',
      dayNamesMinSu: '日',
      dayNamesMinMo: '月',
      dayNamesMinTu: '火',
      dayNamesMinWe: '水',
      dayNamesMinTh: '木',
      dayNamesMinFr: '金',
      dayNamesMinSa: '土',
    },
    general: {
      refresh: '更新',
      createFolder: 'フォルダ作成',
      folderUpload: 'フォルダアップロード',
      fileUpload: 'ファイルアップロード',
      folderDelete: 'フォルダ削除',
    },
    toast: {
      errorSummary: 'エラー',
      errorDetail: 'エラーが発生しました。',
      createdSummary: '登録完了',
      createdDetail: '登録処理が完了しました。',
      updatedSummary: '更新完了',
      updatedDetail: '更新処理が完了しました。',
      deletedSummary: '削除完了',
      deletedDetail: '削除処理が完了しました。',
    },
  },
};

const i18n = createI18n({
  locale: 'ja',
  fallbackLocale: 'ja',
  messages: messages,
});

export default i18n;
