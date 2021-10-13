<template>
  <div class="home">
    <ConfirmDialog></ConfirmDialog>
    <Splitter class="layout" stateKey="directorySplitter" stateStorage="local">
      <SplitterPanel class="layout-left" :size="20">
        <Tree class="layout-left__tree" :value="nodes" v-model:expandedKeys="expandedKeys" v-model:selectionKeys="selectionKeys" @node-select="onNodeSelect" @node-expand="onNodeSelect" selectionMode="single"></Tree>
      </SplitterPanel>
      <SplitterPanel class="layout-right" :size="80">
        <Menubar class="layout-right__menu" :model="menuItems" />
        <Breadcrumb class="layout-right__breadcrumb" :home="breadcrumbHome" :model="breadcrumbItems" />
        <DataTable
          class="layout-right__table"
          v-model:selection="selectedItems"
          dataKey="name"
          :loading="loading"
          :scrollable="true"
          scrollHeight="calc(100vh - 250px)"
          :value="blobItems"
          :resizableColumns="true"
          scrollDirection="both"
          columnResizeMode="expand"
        >
          <template #empty>&nbsp;</template>
          <Column selectionMode="multiple" style="flex-basis: 42px"></Column>
          <Column field="name" header="Name" style="flex-basis: 400px">
            <template #body="slotProps">
              <span style="position: relative">
                <img :src="getFileIcon(slotProps.data.name)" style="position: absolute; margin: -8px 0 0 -8px" />
                <span style="margin-left: 32px">{{ getFileName(slotProps.data.name) }}</span>
              </span>
            </template>
          </Column>
          <Column field="properties.lastModified" header="LastModified" style="flex-basis: 200px">
            <template #body="slotProps">
              {{ convertToISO8601Local(slotProps.data.properties.lastModified) }}
            </template>
          </Column>
          <Column field="properties.contentLength" header="Size" style="flex-basis: 120px" bodyStyle="justify-content: right">
            <template #body="slotProps">
              {{ formatBytes(slotProps.data.properties.contentLength) }}
            </template>
          </Column>
          <Column field="properties.contentType" header="ContentType" style="flex-basis: 200px"></Column>
          <Column style="flex-grow: 1"></Column>
        </DataTable>
        <textarea ref="messageRef" class="layout-right__message" v-model="messages" style="width: 100%" readonly></textarea>
        <input ref="fileUploadInputRef" type="file" name="file" id="fileUploadInput" @change="onChangeFileUploadInput" hidden multiple />
        <input ref="zipFileUploadInputRef" type="file" name="zipFile" id="zipFileUploadInput" @change="onChangeZipFileUploadInput" accept=".zip" hidden />
        <input ref="folderUploadInputRef" type="file" name="folder" id="folderUploadInput" @change="onChangeFolderUploadInput" hidden webkitdirectory />
      </SplitterPanel>
    </Splitter>
    <Dialog :header="t('general.inputSasUrl')" v-model:visible="isShowingInputSasUrlDialog" :style="{ width: '600px' }" :modal="true" :closable="false">
      <div class="p-fluid">
        <div class="field">
          <label for="sasUrl" style="font-weight: bold">{{ t('general.sasUrl') }}</label>
          <InputText id="sasUrl" v-model="sasUrl" :class="sasUrlErrorMessage ? 'p-invalid' : ''" maxlength="512" autocomplete="off" />
          <small id="sasUrlHelp" v-if="sasUrlErrorMessage" class="p-error">{{ sasUrlErrorMessage }}</small>
        </div>
      </div>
      <template #footer>
        <Button :label="t('general.submit')" icon="pi pi-check" @click="onClickDialogSubmitSasUrl" class="mr-0" />
      </template>
    </Dialog>
    <Dialog :header="t('general.createFolder')" v-model:visible="isShowingCreateFolderDialog" :style="{ width: '400px' }" :modal="true">
      <div class="p-fluid">
        <div class="field">
          <label for="folderName" style="font-weight: bold">{{ t('general.folderName') }}</label>
          <InputText id="folderName" v-model="folderName" :class="folderNameErrorMessage ? 'p-invalid' : ''" maxlength="254" autocomplete="off" />
          <small id="folderNameHelp" v-if="folderNameErrorMessage" class="p-error">{{ folderNameErrorMessage }}</small>
        </div>
      </div>
      <template #footer>
        <Button :label="t('general.cancel')" icon="pi pi-times" @click="isShowingCreateFolderDialog = false" class="p-button-text" />
        <Button :label="t('general.createFolder')" icon="pi pi-check" @click="onClickDialogCreateFolder" class="mr-0" />
      </template>
    </Dialog>
    <Dialog :header="isUploading ? t('general.uploading') : t('general.uploaded')" v-model:visible="isShowingUploadProgressDialog" :style="{ width: '768px', 'max-height': '80vh' }" :modal="true" :closable="false">
      <div class="fluid" style="margin-bottom: 5px">
        <ProgressBar :value="getUploadProgress()">
          <div style="font-weight: normal; color: #fff; text-shadow: 1px 1px 0 #495057">{{ getUploadProgress() }}%</div>
        </ProgressBar>
      </div>
      <FileUploadProgress
        v-for="uploadFile of uploadFiles"
        :key="uploadFile.key"
        :keyValue="uploadFile.key"
        :name="uploadFile.name"
        :size="uploadFile.size"
        :uploaded="uploadFile.uploaded"
        @compelete="onCompeleteUpload"
        @close="onCloseUploadProgress"
      ></FileUploadProgress>
      <template #footer>
        <Button :label="t('general.close')" icon="pi pi-check" @click="isShowingUploadProgressDialog = false" class="mr-0" :disabled="isUploading" />
      </template>
    </Dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, toRefs, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useConfirm } from 'primevue/useconfirm';
import { BlobItem, BlobPrefix, BlobServiceClient, BlobUploadCommonResponse, ContainerClient } from '@azure/storage-blob';
import { escapeURLPath } from '@/modules/utils/utils.common';
import { URLBuilder } from '@azure/core-http';
import { TransferProgressEvent } from '@azure/core-http';
import { TreeNode, MenuItem, StringKeyDictionary, WebkitFile, ZipItem } from '@/modules/models';
import { containsAll, formatBytes, getFileIcon, getFileName, convertToISO8601, convertToISO8601Local, setFocus } from '@/modules/utils';
import JSZip from 'jszip';
import FileUploadProgress, { FileUploadItem } from '@/components/FileUploadProgress.vue';

export default defineComponent({
  name: 'Home',
  components: {
    FileUploadProgress,
  },
  setup() {
    const { t } = useI18n();
    const route = useRoute();
    const confirm = useConfirm();
    const messageRef = ref<HTMLTextAreaElement>();
    const fileUploadInputRef = ref<HTMLInputElement>();
    const zipFileUploadInputRef = ref<HTMLInputElement>();
    const folderUploadInputRef = ref<HTMLInputElement>();
    const rootNode: TreeNode = {
      key: '',
      label: '',
      icon: 'pi pi-fw pi-inbox',
      children: [] as TreeNode[],
      data: [] as BlobItem[],
      loaded: false,
    };
    const menuItems = [
      {
        key: 'refresh',
        label: t('general.refresh'),
        icon: 'pi pi-fw pi-refresh',
        command: async () => {
          await onClickRefresh();
        },
      },
      {
        key: 'createFolder',
        label: t('general.createFolder'),
        icon: 'pi pi-fw pi-folder',
        command: async () => {
          await onClickCreateFolder();
        },
      },
      {
        key: 'upload',
        label: t('general.upload'),
        icon: 'pi pi-fw pi-upload',
        items: [
          {
            key: 'folderUpload',
            label: t('general.folderUpload'),
            icon: 'pi pi-fw pi-folder-open',
            command: async () => {
              await onClickFolderUpload();
            },
          },
          {
            key: 'fileUpload',
            label: t('general.fileUpload'),
            icon: 'pi pi-fw pi-copy',
            command: async () => {
              await onClickFileUpload();
            },
          },
          {
            key: 'zipFileUpload',
            label: t('general.zipFileUpload'),
            icon: 'pi pi-fw pi-sitemap',
            command: async () => {
              await onClickZipFileUpload();
            },
          },
        ] as MenuItem[],
      },
      {
        key: 'selectedItems',
        label: computed(() => {
          return t('general.selectedItems', { count: state.selectedItems.length });
        }),
        icon: 'pi pi-fw pi-ellipsis-h',
        disabled: computed(() => {
          return state.selectedItems.length == 0;
        }),
        items: [
          {
            key: 'fileDelete',
            label: t('general.fileDelete'),
            icon: 'pi pi-fw pi-file-excel',
            command: async () => {
              await onClickFileDelete();
            },
          },
        ] as MenuItem[],
      },
      {
        key: 'folderDelete',
        label: t('general.folderDelete'),
        icon: 'pi pi-fw pi-trash',
        command: async () => {
          await onClickFolderDelete();
        },
      },
    ] as MenuItem[];

    let blobSasUrl = process.env.VUE_APP_SAS_URL as string;
    let blobServiceClient: BlobServiceClient;
    let containerName = '.';
    let containerClient: ContainerClient;

    /**
     * Declaring reactive state.
     */
    const state = reactive({
      loading: false,
      expandedKeys: {} as StringKeyDictionary<boolean>,
      selectionKeys: {} as StringKeyDictionary<boolean>,
      breadcrumbHome: {
        label: '',
        command: () => selectNode(''),
      } as MenuItem,
      breadcrumbItems: [] as MenuItem[],
      nodes: [] as TreeNode[],
      node: rootNode,
      flattenedNodes: {} as StringKeyDictionary<TreeNode>,
      blobItems: [] as BlobItem[],
      selectedItems: [] as BlobItem[],
      messages: '',
      menuItems: menuItems,
      folderName: '',
      folderNameErrorMessage: '',
      sasUrl: '',
      sasUrlErrorMessage: '',
      isShowingCreateFolderDialog: false,
      isShowingUploadProgressDialog: false,
      isShowingInputSasUrlDialog: false,
      isUploading: false,
      uploadFiles: [] as FileUploadItem[],
      uploadSize: 0,
      uploadedSize: 0,
    });

    state.flattenedNodes[rootNode.key] = rootNode;

    /**
     * Verifies the connection with the specified SAS URL.
     */
    const initBlobServiceClient = async () => {
      blobServiceClient = new BlobServiceClient(blobSasUrl);
      containerName = '.';
      containerClient = blobServiceClient.getContainerClient(containerName);
      await containerClient.listBlobsByHierarchy('/', { prefix: '__DUMMY__' }).next();
      await listBlobs(rootNode, false);
      state.nodes.push(rootNode);
      state.breadcrumbHome.label = containerClient.containerName;
      rootNode.label = containerClient.containerName;
      if (rootNode.children && rootNode.children.length > 0) {
        expandNode(rootNode.key);
      }
    };

    /**
     * Build the tree and list the blob items.
     */
    const listBlobs = async (parentNode: TreeNode, reload: boolean) => {
      if (!parentNode.children) {
        return;
      }

      const prefix = parentNode.key;
      state.selectedItems = [] as BlobItem[];
      state.blobItems = [] as BlobItem[];

      // If the tree has already been built, it will display the previously obtained contents.
      if (!reload && parentNode.loaded) {
        const len = parentNode.data.length;
        for (let i = 0; i < len; i++) {
          // The '.keep' file is a hidden file to build a virtual directory.
          if (getFileName(parentNode.data[i].name) != '.keep') {
            state.blobItems.push(parentNode.data[i]);
          }
        }
        return;
      }

      if (reload) {
        parentNode.loaded = false;
        parentNode.children.splice(0);
        parentNode.data.splice(0);
      }

      state.loading = true;
      try {
        state.messages += '[INFO] GET /' + prefix + '\n';
        for await (const item of containerClient.listBlobsByHierarchy('/', { prefix: prefix })) {
          if (item.kind === 'prefix') {
            // BlobPrefix to build the tree.
            let blobPrefix = item as BlobPrefix;
            if (parentNode.children.find((value) => value.key == blobPrefix.name)) {
              continue;
            }
            const node = {
              key: blobPrefix.name,
              label: getFileName(blobPrefix.name.slice(0, -1)),
              icon: 'pi pi-fw pi-folder',
              children: [] as TreeNode[],
              data: [] as BlobItem[],
              leaf: false,
              parent: parentNode,
            } as TreeNode;
            parentNode.children.push(node);
            state.flattenedNodes[node.key] = node;
          } else {
            // List the BlobItem in the table.
            let blobItem = item as BlobItem;
            // The '.keep' file is a hidden file to build a virtual directory.
            if (getFileName(blobItem.name) != '.keep') {
              state.blobItems.push(blobItem);
            }
            parentNode.data.push(blobItem);
          }
        }
        parentNode.loaded = true;
      } catch (error) {
        state.messages += '[ERROR] ' + error.message + '\n';
      }
      state.loading = false;
      scrollMessage();
    };

    /**
     * Delete the folder and all blob items in the folder.
     */
    const deleteFolder = async () => {
      try {
        state.messages += '[INFO] Preparing for delete...' + '\n';
        const promises = [];

        for (const key in state.flattenedNodes) {
          const node = state.flattenedNodes[key];
          if (node.key.startsWith(state.node.key)) {
            for (const blobItem of node.data) {
              state.messages += '[INFO] Deleting /' + blobItem.name + '\n';
              promises.push(containerClient.deleteBlob(blobItem.name));
            }
            delete state.flattenedNodes[key];
          }
        }

        await Promise.all(promises);
        state.messages += '[INFO] Done.' + '\n';
      } catch (error) {
        state.messages += '[ERROR] ' + error.message + '\n';
      }
      scrollMessage();

      // Refresh the parent node.
      if (state.node.parent) {
        contractNodeChildren(state.node.parent.key);
        await listBlobs(state.node.parent, true);
        await selectNode(state.node.parent.key);
      } else {
        contractNodeChildren(rootNode.key);
        await listBlobs(rootNode, true);
        await selectNode(rootNode.key);
      }
    };

    /**
     * Delete all selected blob items.
     */
    const deleteFiles = async () => {
      try {
        state.messages += '[INFO] Preparing for delete...' + '\n';
        const promises = [];

        for (const blobItem of state.selectedItems) {
          state.messages += '[INFO] Deleting /' + blobItem.name + '\n';
          promises.push(containerClient.deleteBlob(blobItem.name));
        }

        await Promise.all(promises);
        state.messages += '[INFO] Done.' + '\n';
      } catch (error) {
        state.messages += '[ERROR] ' + error.message + '\n';
      }
      scrollMessage();

      // Refresh the current node.
      contractNodeChildren(state.node.key);
      await listBlobs(state.node, true);
      await selectNode(state.node.key);
    };

    /**
     * Load the ZIP file.
     */
    const loadZip = async (zip: JSZip) => {
      const items = [] as ZipItem[];
      const itemCount = Object.keys(zip.files).length;
      let count = 0;
      zip.forEach(async (relativePath, zipEntry) => {
        const content = await zipEntry.async('arraybuffer');
        if (!zipEntry.name.endsWith('/')) {
          items.push({ name: zipEntry.name, content: content, size: content.byteLength });
        }
        count++;
        if (itemCount == count) {
          await callbackZipLoaded(items);
        }
      });
    };

    /**
     * Callback when a ZIP file is loaded.
     */
    const callbackZipLoaded = async (items: ZipItem[]) => {
      state.isShowingUploadProgressDialog = true;
      state.uploadFiles = [] as FileUploadItem[];
      state.uploadSize = 0;
      state.uploadedSize = 0;
      state.isUploading = true;

      try {
        state.messages += '[INFO] Preparing for upload...' + '\n';
        const promises = [] as Promise<BlobUploadCommonResponse>[];
        for (const item of items) {
          state.messages += '[INFO] Uploading /' + state.node.key + item.name + '\n';
          const blockBlobClient = containerClient.getBlockBlobClient(state.node.key + item.name);
          const fileUploadItem: FileUploadItem = reactive({
            key: state.node.key + item.name,
            name: item.name,
            size: item.size,
            uploaded: 0,
          });
          state.uploadSize += item.size;
          state.uploadFiles.push(fileUploadItem);
          promises.push(
            blockBlobClient.uploadData(item.content, {
              onProgress: (progress: TransferProgressEvent) => {
                fileUploadItem.uploaded = progress.loadedBytes;
              },
            })
          );
        }
        await Promise.all(promises);
        state.messages += '[INFO] Done.' + '\n';
      } catch (error) {
        state.messages += '[ERROR] ' + error.message + '\n';
      }
      scrollMessage();
      await listBlobs(state.node, true);
      state.isUploading = false;
      if (zipFileUploadInputRef.value) {
        zipFileUploadInputRef.value.value = '';
      }
    };

    /**
     * Scroll the contents of the text box to the bottom line.
     */
    const scrollMessage = () => {
      if (messageRef.value) {
        messageRef.value.scrollTop = messageRef.value.scrollHeight;
      }
    };

    /**
     * Search a node with the specified node key.
     */
    const searchNode = (nodeKey: string): TreeNode | null => {
      return state.flattenedNodes[nodeKey];
    };

    /**
     * Expand a node with the specified node key.
     */
    const expandNode = (nodeKey: string) => {
      state.expandedKeys[nodeKey] = true;
    };

    /**
     * Contract a node with the specified node key.
     */
    const contractNode = (nodeKey: string) => {
      delete state.expandedKeys[nodeKey];
    };

    /**
     * Contract all node children with the specified node key.
     */
    const contractNodeChildren = (nodeKey: string) => {
      for (const key in state.expandedKeys) {
        if (key.startsWith(nodeKey)) {
          contractNode(key);
        }
      }
      contractNode(nodeKey);
    };

    /**
     * Select a node with the specified node key.
     */
    const selectNode = async (nodeKey: string) => {
      const node = searchNode(nodeKey);
      if (node) {
        await onNodeSelect(node);
      }
      for (const key in state.selectionKeys) {
        delete state.selectionKeys[key];
      }
      state.selectionKeys[nodeKey] = true;
    };

    /**
     * Refresh a node with the specified node key.
     */
    const refreshNode = async (nodeKey: string) => {
      const node = searchNode(nodeKey);
      if (node) {
        contractNodeChildren(node.key);
        await listBlobs(node, true);
        await selectNode(node.key);
      }
    };

    /**
     * Select a node with the specified node key.
     */
    const setBreadcrumb = (node: TreeNode) => {
      state.breadcrumbItems.splice(0);
      const items = node.key.slice(0, -1).split('/');
      let nodePath = '';
      const len = items.length;
      for (let i = 0; i < len; i++) {
        if (items[i]) {
          nodePath += items[i] + '/';
          const nodeKey = nodePath;
          state.breadcrumbItems.push({
            label: items[i],
            command: async () => {
              await selectNode(nodeKey);
            },
          });
        }
      }
    };

    /**
     * Calculates and returns the size of the uploaded file.
     */
    const getUploadProgress = (): number => {
      if (state.uploadSize == 0) {
        return 0;
      }
      return Math.floor((state.uploadedSize / state.uploadSize) * 100);
    };

    /**
     * Event handler when the refresh button is clicked.
     */
    const onClickRefresh = async () => {
      await refreshNode(state.node.key);
    };

    /**
     * Event handler when the create folder button is clicked.
     */
    const onClickCreateFolder = async () => {
      state.folderName = '';
      state.folderNameErrorMessage = '';
      state.isShowingCreateFolderDialog = true;
      setFocus('folderName');
    };

    /**
     * Event handler when the SAS URL dialog button is clicked.
     */
    const onClickDialogSubmitSasUrl = async () => {
      if (!state.sasUrl) {
        state.sasUrlErrorMessage = t('message.required', { target: t('general.sasUrl') });
        return;
      }

      const url = escapeURLPath(state.sasUrl);
      const urlParsed = URLBuilder.parse(url);

      if (urlParsed.getQueryParameterValue('sr') != 'c') {
        state.sasUrlErrorMessage = t('message.unexpectedSignedResource');
        return;
      }

      if (!urlParsed.getQueryParameterValue('sp')) {
        state.sasUrlErrorMessage = t('message.unexpectedSignedPermissions');
        return;
      }

      if (!containsAll(urlParsed.getQueryParameterValue('sp') as string, 'racwdl')) {
        state.sasUrlErrorMessage = t('message.unexpectedSignedPermissions');
        return;
      }

      blobSasUrl = state.sasUrl;

      try {
        await initBlobServiceClient();
      } catch (error) {
        console.log(error);
        state.sasUrlErrorMessage = t('message.invalidSasUrl');
        return;
      }

      state.isShowingInputSasUrlDialog = false;
    };

    /**
     * Event handler when the create folder dialog button is clicked.
     */
    const onClickDialogCreateFolder = async () => {
      if (!state.folderName) {
        state.folderNameErrorMessage = t('message.required', { target: t('general.folderName') });
        return;
      }

      if (state.folderName.includes('/')) {
        state.folderNameErrorMessage = t('message.illegalCharacter', { target: t('general.folderName'), illegal: '/' });
        return;
      }

      const key = state.node.key + state.folderName + '/';

      try {
        state.messages += '[INFO] Creating /' + state.folderName + '\n';
        const blockBlobClient = containerClient.getBlockBlobClient(key + '.keep');
        await blockBlobClient.uploadData(new ArrayBuffer(0));
        state.messages += '[INFO] Done.' + '\n';
      } catch (error) {
        state.messages += '[ERROR] ' + error.message + '\n';
      }

      scrollMessage();

      // Skip processing if a node with the same name already exists.
      if (state.node.children && !state.node.children.find((value) => value.key == key)) {
        const node = {
          key: key,
          label: getFileName(key.slice(0, -1)),
          icon: 'pi pi-fw pi-folder',
          children: [] as TreeNode[],
          data: [] as BlobItem[],
          leaf: false,
          parent: state.node,
        } as TreeNode;
        state.node.children.push(node);
        state.flattenedNodes[node.key] = node;
        expandNode(state.node.key);
      }

      await selectNode(key);
      state.isShowingCreateFolderDialog = false;
    };

    /**
     * Event handler when the file upload button is clicked.
     */
    const onClickFileUpload = async () => {
      if (!fileUploadInputRef.value) {
        return;
      }
      fileUploadInputRef.value.click();
    };

    /**
     * Event handler when the folder upload button is clicked.
     */
    const onClickFolderUpload = async () => {
      if (!folderUploadInputRef.value) {
        return;
      }
      folderUploadInputRef.value.click();
    };

    /**
     * Event handler when the zip file upload button is clicked.
     */
    const onClickZipFileUpload = async () => {
      if (!zipFileUploadInputRef.value) {
        return;
      }
      zipFileUploadInputRef.value.click();
    };

    /**
     * Event handler when the folder delete button is clicked.
     */
    const onClickFolderDelete = async () => {
      confirm.require({
        message: t('message.folderDeleteConfirmationMessage'),
        header: t('general.folderDelete'),
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: t('general.yes'),
        rejectLabel: t('general.no'),
        accept: async () => {
          await deleteFolder();
        },
      });
    };

    /**
     * Event handler when the file delete button is clicked.
     */
    const onClickFileDelete = async () => {
      confirm.require({
        message: t('message.fileDeleteConfirmationMessage'),
        header: t('general.fileDelete'),
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: t('general.yes'),
        rejectLabel: t('general.no'),
        accept: async () => {
          await deleteFiles();
        },
      });
    };

    /**
     * Event handler when the file upload input is changed.
     */
    const onChangeFileUploadInput = async () => {
      if (!fileUploadInputRef.value) {
        return;
      }

      if (!fileUploadInputRef.value.files) {
        return;
      }

      state.isShowingUploadProgressDialog = true;
      state.uploadFiles = [] as FileUploadItem[];
      state.uploadSize = 0;
      state.uploadedSize = 0;
      state.isUploading = true;

      try {
        state.messages += '[INFO] Preparing for upload...' + '\n';
        const promises = [];
        for (const file of fileUploadInputRef.value.files) {
          state.messages += '[INFO] Uploading /' + state.node.key + file.name + '\n';
          const blockBlobClient = containerClient.getBlockBlobClient(state.node.key + file.name);
          const fileUploadItem: FileUploadItem = reactive({
            key: state.node.key + file.name,
            name: file.name,
            size: file.size,
            uploaded: 0,
          });
          state.uploadSize += file.size;
          state.uploadFiles.push(fileUploadItem);
          promises.push(
            blockBlobClient.uploadData(file, {
              onProgress: (progress: TransferProgressEvent) => {
                fileUploadItem.uploaded = progress.loadedBytes;
              },
            })
          );
        }
        await Promise.all(promises);
        state.messages += '[INFO] Done.' + '\n';
      } catch (error) {
        state.messages += '[ERROR] ' + error.message + '\n';
      }
      scrollMessage();
      await listBlobs(state.node, true);
      state.isUploading = false;
      fileUploadInputRef.value.value = '';
    };

    /**
     * Event handler when the zip file upload input is changed.
     */
    const onChangeZipFileUploadInput = async () => {
      if (!zipFileUploadInputRef.value) {
        return;
      }

      if (!zipFileUploadInputRef.value.files) {
        return;
      }

      const file = zipFileUploadInputRef.value.files[0];

      try {
        const decoder = new TextDecoder(t('setting.zipFilenameDecoding'));
        const zip = await JSZip.loadAsync(file, {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          decodeFileName: (fileNameBinary) => decoder.decode(fileNameBinary),
        });
        await loadZip(zip);
      } catch (error) {
        state.messages += '[ERROR] ' + error.message + '\n';
        scrollMessage();
      }
    };

    /**
     * Event handler when the folder upload input is changed.
     */
    const onChangeFolderUploadInput = async () => {
      if (!folderUploadInputRef.value) {
        return;
      }

      if (!folderUploadInputRef.value.files) {
        return;
      }

      state.isShowingUploadProgressDialog = true;
      state.uploadFiles = [] as FileUploadItem[];
      state.uploadSize = 0;
      state.uploadedSize = 0;
      state.isUploading = true;

      try {
        state.messages += '[INFO] Preparing for upload...' + '\n';
        const promises = [];
        for (const file of folderUploadInputRef.value.files) {
          const webkitFile = file as WebkitFile;
          state.messages += '[INFO] Uploading /' + state.node.key + webkitFile.webkitRelativePath + '\n';
          const blockBlobClient = containerClient.getBlockBlobClient(state.node.key + webkitFile.webkitRelativePath);
          const fileUploadItem: FileUploadItem = reactive({
            key: state.node.key + webkitFile.webkitRelativePath,
            name: file.name,
            size: file.size,
            uploaded: 0,
          });
          state.uploadSize += file.size;
          state.uploadFiles.push(fileUploadItem);
          promises.push(
            blockBlobClient.uploadData(file, {
              onProgress: (progress: TransferProgressEvent) => {
                fileUploadItem.uploaded = progress.loadedBytes;
              },
            })
          );
        }
        await Promise.all(promises);
        state.messages += '[INFO] Done.' + '\n';
      } catch (error) {
        state.messages += '[ERROR] ' + error.message + '\n';
      }
      scrollMessage();
      await refreshNode(state.node.key);
      state.isUploading = false;
      folderUploadInputRef.value.value = '';
    };

    /**
     * Event handler when a blob item has been uploaded.
     */
    const onCompeleteUpload = (key: string, size: number) => {
      state.uploadedSize += size;
    };

    /**
     * Event handler when a blob item has been closed.
     */
    const onCloseUploadProgress = (key: string) => {
      if (!state.uploadFiles) {
        return;
      }

      let index = -1;
      for (let i = 0; i < state.uploadFiles.length; i++) {
        if (state.uploadFiles[i].key === key) {
          index = i;
          break;
        }
      }
      if (index >= 0) {
        state.uploadFiles.splice(index, 1);
      }
    };

    /**
     * Event handler when a node is selected or expanded.
     */
    const onNodeSelect = async (node: TreeNode) => {
      await listBlobs(node, false);
      state.node = node;
      setBreadcrumb(node);
      if (node.children && node.children.length > 0) {
        expandNode(node.key);
      } else {
        node.leaf = true;
      }
    };

    /**
     * Vue Lifecycle Hooks onMounted
     */
    onMounted(async () => {
      if (route.query && route.query.sas) {
        blobSasUrl = route.query.sas.toString();
      }

      if (blobSasUrl.startsWith('{') && blobSasUrl.endsWith('}')) {
        state.isShowingInputSasUrlDialog = true;
      } else {
        try {
          await initBlobServiceClient();
        } catch (error) {
          console.log(error);
          state.isShowingInputSasUrlDialog = true;
        }
      }
    });

    return {
      ...toRefs(state),
      messageRef,
      fileUploadInputRef,
      zipFileUploadInputRef,
      folderUploadInputRef,
      convertToISO8601,
      convertToISO8601Local,
      formatBytes,
      getFileName,
      getFileIcon,
      getUploadProgress,
      listBlobs,
      onChangeFileUploadInput,
      onChangeZipFileUploadInput,
      onChangeFolderUploadInput,
      onClickDialogCreateFolder,
      onClickDialogSubmitSasUrl,
      onCloseUploadProgress,
      onCompeleteUpload,
      onNodeSelect,
      t,
    };
  },
});
</script>
