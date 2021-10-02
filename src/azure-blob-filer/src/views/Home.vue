<template>
  <div class="home">
    <Splitter class="layout" stateKey="directorySplitter" stateStorage="local">
      <SplitterPanel class="layout-left" :size="20">
        <Tree class="layout-left__tree" :value="nodes" v-model:expandedKeys="expandedKeys" v-model:selectionKeys="selectionKeys" @node-select="onNodeSelect" @node-expand="onNodeSelect" selectionMode="single"></Tree>
      </SplitterPanel>
      <SplitterPanel class="layout-right" :size="80">
        <Menubar class="layout-right__menu" :model="menuItems" />
        <Breadcrumb class="layout-right__breadcrumb" :home="breadcrumbHome" :model="breadcrumbItems" />
        <DataTable class="layout-right__table" :loading="loading" :scrollable="true" scrollHeight="calc(100vh - 250px)" :value="blobItems" :resizableColumns="true" columnResizeMode="fit" scrollDirection="both">
          <template #empty>&nbsp;</template>
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
          <Column field="properties.etag" header="ETag" style="flex-grow: 1"></Column>
        </DataTable>
        <textarea ref="messageRef" class="layout-right__message" v-model="messages" style="width: 100%" readonly></textarea>
        <input ref="fileUploadInputRef" type="file" name="file" id="fileUploadInput" @change="onChangeFileUploadInput" hidden multiple />
      </SplitterPanel>
    </Splitter>
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
        <Button :label="t('general.createFolder')" icon="pi pi-check" @click="onClickDialogCreateFolder" autofocus />
      </template>
    </Dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, toRefs, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { BlobItem, BlobPrefix, BlobServiceClient } from '@azure/storage-blob';
import { TreeNode, MenuItem, StringKeyDictionary } from '@/modules/models';
import { formatBytes, getFileIcon, getFileName, convertToISO8601, convertToISO8601Local, setFocus } from '@/modules/utils';

export default defineComponent({
  name: 'Home',
  components: {},
  setup() {
    const { t } = useI18n();
    const blobSasUrl = process.env.VUE_APP_SAS_URL as string;
    const blobServiceClient = new BlobServiceClient(blobSasUrl);
    const containerName = '.';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const messageRef = ref<HTMLTextAreaElement>();
    const fileUploadInputRef = ref<HTMLInputElement>();
    const rootNode: TreeNode = {
      key: '',
      label: containerClient.containerName,
      icon: 'pi pi-fw pi-inbox',
      children: [] as TreeNode[],
      data: [] as BlobItem[],
      loaded: false,
    };

    const items = ref([
      {
        label: t('general.refresh'),
        icon: 'pi pi-fw pi-refresh',
        command: async () => {
          await onClickRefresh();
        },
      },
      {
        label: t('general.createFolder'),
        icon: 'pi pi-fw pi-folder',
        command: async () => {
          await onClickCreateFolder();
        },
      },
      {
        label: t('general.folderUpload'),
        icon: 'pi pi-fw pi-folder-open',
      },
      {
        label: t('general.fileUpload'),
        icon: 'pi pi-fw pi-upload',
        command: async () => {
          await onClickFileUpload();
        },
      },
      {
        label: t('general.folderDelete'),
        icon: 'pi pi-fw pi-trash',
        command: async () => {
          await onClickFolderDelete();
        },
      },
    ]);

    /**
     * Declaring reactive state.
     */
    const state = reactive({
      loading: false,
      expandedKeys: {} as StringKeyDictionary<boolean>,
      selectionKeys: {} as StringKeyDictionary<boolean>,
      breadcrumbHome: {
        label: containerClient.containerName,
        command: () => selectNode(''),
      } as MenuItem,
      breadcrumbItems: [] as MenuItem[],
      nodes: [] as TreeNode[],
      node: rootNode,
      flattenedNodes: {} as StringKeyDictionary<TreeNode>,
      blobItems: [] as BlobItem[],
      messages: '',
      menuItems: items,
      folderName: '',
      folderNameErrorMessage: '',
      isShowingCreateFolderDialog: false,
    });

    state.flattenedNodes[rootNode.key] = rootNode;

    /**
     * Build the tree and list the blob items.
     */
    const listBlobs = async (parentNode: TreeNode, reload: boolean) => {
      if (!parentNode.children) {
        return;
      }

      const prefix = parentNode.key;
      state.blobItems.splice(0);

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
     * Event handler when the folder delete button is clicked.
     */
    const onClickFolderDelete = async () => {
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
     * Event handler when the file upload input is changed.
     */
    const onChangeFileUploadInput = async () => {
      if (!fileUploadInputRef.value) {
        return;
      }

      if (!fileUploadInputRef.value.files) {
        return;
      }
      try {
        state.messages += '[INFO] Preparing for upload...' + '\n';
        const promises = [];
        for (const file of fileUploadInputRef.value.files) {
          state.messages += '[INFO] Uploading /' + state.node.key + file.name + '\n';
          const blockBlobClient = containerClient.getBlockBlobClient(state.node.key + file.name);
          promises.push(blockBlobClient.uploadBrowserData(file));
        }
        await Promise.all(promises);
        state.messages += '[INFO] Done.' + '\n';
      } catch (error) {
        state.messages += '[ERROR] ' + error.message + '\n';
      }
      scrollMessage();
      await listBlobs(state.node, true);
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
      await listBlobs(rootNode, false);
      state.nodes.push(rootNode);
      if (rootNode.children && rootNode.children.length > 0) {
        expandNode(rootNode.key);
      }
    });

    return {
      ...toRefs(state),
      messageRef,
      fileUploadInputRef,
      convertToISO8601,
      convertToISO8601Local,
      formatBytes,
      getFileName,
      getFileIcon,
      listBlobs,
      onChangeFileUploadInput,
      onClickDialogCreateFolder,
      onNodeSelect,
      t,
    };
  },
});
</script>
