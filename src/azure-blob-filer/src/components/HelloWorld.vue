<template>
  <div class="hello">
    <button ref="createContainerButton" id="create-container-button" @click="createContainer">Create container</button>
    <button ref="deleteContainerButton" id="delete-container-button" @click="deleteContainer">Delete container</button>
    <button ref="selectButton" id="select-button" @click="selectButtonClick">Select and upload files</button>
    <input ref="fileInput" type="file" id="file-input" multiple style="display: none" @change="uploadFiles" />
    <button ref="listButton" id="list-button" @click="listFiles">List files</button>
    <button ref="deleteButton" id="delete-button" @click="deleteFiles">Delete selected files</button>
    <p><b>Status:</b></p>
    <p ref="status" id="status" style="width: 593px; height: 160px; overflow: scroll">{{ messages }}</p>
    <p><b>Files:</b></p>
    <select ref="fileList" id="file-list" multiple style="width: 593px; height: 222px; overflow: scroll" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, toRefs } from 'vue';
import { BlobServiceClient } from '@azure/storage-blob';

export default defineComponent({
  name: 'HelloWorld',
  props: {
    msg: String,
  },
  setup() {
    const state = reactive({
      messages: '',
    });

    const createContainerButton = ref<HTMLElement>();
    const deleteContainerButton = ref<HTMLElement>();
    const selectButton = ref<HTMLElement>();
    const fileInput = ref<HTMLInputElement>();
    const listButton = ref<HTMLElement>();
    const deleteButton = ref<HTMLElement>();
    const status = ref<HTMLElement>();
    const fileList = ref<HTMLSelectElement>();

    const reportStatus = (message: string) => {
      state.messages += `${message}<br/>`;
    };

    const blobSasUrl = process.env.VUE_APP_SAS_URL as string;

    // Create a new BlobServiceClient
    const blobServiceClient = new BlobServiceClient(blobSasUrl);

    // Create a unique name for the container by
    // appending the current time to the file name
    const containerName = '.';

    // Get a container client from the BlobServiceClient
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const createContainer = async () => {
      try {
        reportStatus(`Creating container "${containerName}"...`);
        await containerClient.create();
        reportStatus(`Done.`);
      } catch (error) {
        reportStatus(error.message);
      }
    };

    const deleteContainer = async () => {
      try {
        reportStatus(`Deleting container "${containerName}"...`);
        await containerClient.delete();
        reportStatus(`Done.`);
      } catch (error) {
        reportStatus(error.message);
      }
    };

    const listFiles = async () => {
      if (!fileList.value) {
        return;
      }

      fileList.value.size = 0;
      fileList.value.innerHTML = '';
      try {
        reportStatus('Retrieving file list...');
        let iter = containerClient.listBlobsFlat();
        let blobItem = await iter.next();
        while (!blobItem.done) {
          fileList.value.size += 1;
          fileList.value.innerHTML += `<option>${blobItem.value.name}</option>`;
          blobItem = await iter.next();
        }
        if (fileList.value.size > 0) {
          reportStatus('Done.');
        } else {
          reportStatus('The container does not contain any files.');
        }
      } catch (error) {
        reportStatus(error.message);
      }
    };

    const uploadFiles = async () => {
      if (!fileInput.value) {
        return;
      }

      if (!fileInput.value.files) {
        return;
      }
      try {
        reportStatus('Uploading files...');
        const promises = [];
        for (const file of fileInput.value.files) {
          const blockBlobClient = containerClient.getBlockBlobClient(file.name);
          promises.push(blockBlobClient.uploadBrowserData(file));
        }
        await Promise.all(promises);
        reportStatus('Done.');
        listFiles();
      } catch (error) {
        reportStatus(error.message);
      }
    };

    const selectButtonClick = async () => {
      if (!fileInput.value) {
        return;
      }
      fileInput.value.click();
    };

    const deleteFiles = async () => {
      if (!fileList.value) {
        return;
      }

      try {
        if (fileList.value.selectedOptions.length > 0) {
          reportStatus('Deleting files...');
          for (const option of fileList.value.selectedOptions) {
            await containerClient.deleteBlob(option.text);
          }
          reportStatus('Done.');
          listFiles();
        } else {
          reportStatus('No files selected.');
        }
      } catch (error) {
        reportStatus(error.message);
      }
    };

    return {
      ...toRefs(state),
      createContainerButton,
      deleteContainerButton,
      selectButton,
      fileInput,
      listButton,
      deleteButton,
      status,
      fileList,
      selectButtonClick,
      createContainer,
      deleteContainer,
      uploadFiles,
      deleteFiles,
      listFiles,
    };
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
ul {
  padding: 0;
  list-style-type: none;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
