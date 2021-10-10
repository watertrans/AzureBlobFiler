import { createI18n } from 'vue-i18n';

const messages = {
  en: {
    setting: {
      zipFilenameDecoding: 'utf-8',
    },
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
      zipFileUpload: 'Upload Zip File',
      folderDelete: 'Delete Folder',
      fileDelete: 'Delete Files',
      folderName: 'Folder Name',
      selectedItems: 'Action for {count} item(s)',
      inputSasUrl: 'Input SAS URL',
      sasUrl: 'SAS URL',
      submit: 'Submit',
      yes: 'Yes',
      no: 'No',
    },
    message: {
      required: "Enter '{target}'.",
      illegalCharacter: "Not possible to enter '{illegal}' for '{target}'.",
      unexpectedSignedResource: 'Please create a SAS URL for the container.',
      unexpectedSignedPermissions: 'Do not have enough permissions for the container.',
      invalidSasUrl: 'The specified SAS URL cannot be used.',
      folderDeleteConfirmationMessage: 'Are you sure you want to delete current folder?',
      fileDeleteConfirmationMessage: 'Are you sure you want to delete selected files?',
    },
  },
  ja: {
    setting: {
      zipFilenameDecoding: 'Shift_JIS',
    },
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
      zipFileUpload: 'ZIPファイルアップロード',
      folderDelete: 'フォルダ削除',
      fileDelete: 'ファイル削除',
      folderName: 'フォルダ名',
      selectedItems: 'アクション（{count}件）',
      inputSasUrl: 'SAS URLを設定してください',
      sasUrl: 'SAS URL',
      submit: '設定',
      yes: 'はい',
      no: 'いいえ',
    },
    message: {
      required: "'{target}'を入力してください。",
      illegalCharacter: "'{target}'に'{illegal}'を入力することはできません。",
      unexpectedSignedResource: 'コンテナーに対するSAS URLを発行してください。',
      unexpectedSignedPermissions: 'コンテナーに対するアクセス許可が足りません。',
      invalidSasUrl: '指定したSAS URLは使用できません。',
      folderDeleteConfirmationMessage: '現在のフォルダを削除してよろしいですか？',
      fileDeleteConfirmationMessage: '選択したファイルを削除してもよろしいですか？',
    },
  },
};

const i18n = createI18n({
  locale: navigator.language.split('-')[0],
  fallbackLocale: 'en',
  messages: messages,
});

export default i18n;
