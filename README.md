# Azure Blob Filer

This application is a filer for Blob containers created with Vue.js.  
Only Blob items inside a Blob container can be updated.  
You need to have a SAS URL for the Azure Blob Container.  
Before your web application can access blob storage from the client, you must configure your account to enable cross-origin resource sharing, or CORS.  

### Demo
https://watertrans.github.io/AzureBlobFiler/

### Screenshot
![CAPTURE.PNG](assets/img/capture.png)

## Features

- Uploading files directly to the Azure Blob Container to be fast and efficient.
- Not possible to add or remove the default Blob container.
- Displays the contents of the Blob container in an explorer-like tree view.
- Specify a folder to upload all files.
- Specify multiple files to upload.
- Unzip the specified ZIP file and upload it.

## Limitations

- There is no function to display the contents of the file.
- There is no function to move files.
- To create that folder, we will generate a hidden file called ".keep".
- It has been tested with the latest versions of Chrome, FireFox, and Edge.

## Prerequisites

- Node.js
- Vue CLI
- Visual Studio Code
- Visual Studio Code Extensions
  - Prettier - Prettier
  - ESLint - Dirk Baeumer
  - Sass - Syler
  - Vetur - Pine Wu
  - stylelint - stylelint

## Setup SAS URL

1. Create a Blob container of any name in Azure Portal.
2. Generate SAS URL.
   ![SAS_URL.PNG](assets/img/sas_url.png)
3. Set the SAS URL to VUE_APP_SAS_URL in the following file. (Option)
    - ``\src\azure-blob-filer\.env.local``
      ```
      VUE_APP_SAS_URL={ENTER_THE_BLOB_SAS_URL_HERE}
      ```
    - Attention! Do not commit ``.env.local`` to Github.
    - If VUE_APP_SAS_URL is not set, an input dialog will be displayed at startup.

## Setup CORS

1. Open the CORS configuration screen of the storage account where you created the Blob container.
2. Set this according to the execution environment of the application. For more information, check out this [article](https://docs.microsoft.com/en-us/azure/storage/blobs/quickstart-blobs-javascript-browser#create-a-cors-rule).
   ![CORS.PNG](assets/img/cors.png)

