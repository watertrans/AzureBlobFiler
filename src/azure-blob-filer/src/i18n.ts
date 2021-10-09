import { createI18n } from 'vue-i18n';

const messages = {
  en: {
    general: {
      refresh: 'Refresh',
      close: 'Close',
      cancel: 'Cancel',
      upload: 'Upload',
      uploading: 'Uploading...',
      uploaded: 'Uploaded',
      createFolder: 'Create Folder',
      folderUpload: 'Upload Folder',
      fileUpload: 'Upload Files',
      folderDelete: 'Delete Folder',
      fileDelete: 'Delete Files',
      folderName: 'Folder Name',
      selectedItems: 'Action for {count} item(s)',
      inputSasUrl: 'Input SAS URL',
      sasUrl: 'SAS URL',
      submit: 'Submit',
    },
    message: {
      required: "Enter '{target}'.",
      illegalCharacter: "Not possible to enter '{illegal}' for '{target}'.",
      unexpectedSignedResource: 'Please create a SAS URL for the container.',
      unexpectedSignedPermissions: 'Do not have enough permissions for the container.',
      invalidSasUrl: 'The specified SAS URL cannot be used.',
    },
  },
  ja: {
    general: {
      refresh: '更新',
      close: '閉じる',
      cancel: 'キャンセル',
      upload: 'アップロード',
      uploading: 'アップロードしています...',
      uploaded: 'アップロード完了',
      createFolder: 'フォルダ作成',
      folderUpload: 'フォルダアップロード',
      fileUpload: 'ファイルアップロード',
      folderDelete: 'フォルダ削除',
      fileDelete: 'ファイル削除',
      folderName: 'フォルダ名',
      selectedItems: 'アクション（{count}件）',
      inputSasUrl: 'SAS URLを設定してください',
      sasUrl: 'SAS URL',
      submit: '設定',
    },
    message: {
      required: "'{target}'を入力してください。",
      illegalCharacter: "'{target}'に'{illegal}'を入力することはできません。",
      unexpectedSignedResource: 'コンテナーに対するSAS URLを発行してください。',
      unexpectedSignedPermissions: 'コンテナーに対するアクセス許可が足りません。',
      invalidSasUrl: '指定したSAS URLは使用できません。',
    },
  },
};

const i18n = createI18n({
  locale: navigator.language.split('-')[0],
  fallbackLocale: 'en',
  messages: messages,
});

export default i18n;
