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

## Setup Azure Blob Storage

### CORS

1. Open the CORS configuration screen of the storage account where you created the Blob container.
2. Set this according to the execution environment of the application. For more information, check out this [article](https://docs.microsoft.com/en-us/azure/storage/blobs/quickstart-blobs-javascript-browser#create-a-cors-rule).
   ![CORS.PNG](assets/img/cors.png)

### SAS URL

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

## Setup Azurite (free local environment for testing)

### Docker Compose

By default, Azurite applies strict mode to block unsupported request headers and parameters.  
Use the Loose mode. (azurite --loose)

```
version: '3.8'
services:
  db:
    image: mcr.microsoft.com/azure-storage/azurite
    container_name: azurite
    restart: always
    volumes: 
      - ./data:/data
    ports:
      - 10000:10000
      - 10001:10001
      - 10002:10002
    command: azurite --blobHost 0.0.0.0 --blobPort 10000 --queueHost 0.0.0.0 --queuePort 10001 --tableHost 0.0.0.0 --tablePort 10002 --loose
```

### CORS

1. Use Microsoft Azure Storage Explorer to connect to Azurite.
2. Right-click on Blob Containers and select "Configure CORS Settings...".
  ![CORS_AZURITE_1.PNG](assets/img/cors_azurite_1.png)
3. Set this according to the execution environment of the application. For more information, check out this [article](https://docs.microsoft.com/en-us/azure/storage/blobs/quickstart-blobs-javascript-browser#create-a-cors-rule).
  ![CORS_AZURITE_2.PNG](assets/img/cors_azurite_2.png)

### SAS URL

1. Create a Blob container of any name.  
2. Right-click on created blob container and select "Get Shared Access  Signature...".
  ![SAS_URL_AZURITE_1.PNG](assets/img/sas_url_azurite_1.png)
3. For permissions, choice Read, Add, Create, Write, Delete, and List.  
  ![SAS_URL_AZURITE_2.PNG](assets/img/sas_url_azurite_2.png)
4. Keep the URL field.  
  ![SAS_URL_AZURITE_3.PNG](assets/img/sas_url_azurite_3.png)
5. Set the SAS URL to VUE_APP_SAS_URL in the following file. (Option)
    - ``\src\azure-blob-filer\.env.local``
      ```
      VUE_APP_SAS_URL={ENTER_THE_BLOB_SAS_URL_HERE}
      ```
    - Attention! Do not commit ``.env.local`` to Github.
    - If VUE_APP_SAS_URL is not set, an input dialog will be displayed at startup.

## Passing SAS URL using URL QueryString

You can quickly access the Blob container by setting up a 'sas' query string.  
Please refer to the following.  

```
<a href="https://watertrans.github.io/AzureBlobFiler/?sas=http%3A//127.0.0.1%3A10000/devstoreaccount1/files%3Fsv%3D2018-03-28%26st%3D2021-01-01T00%253A00%253A00Z%26se%3D2021-12-31T23%253A59%253A00Z%26sr%3Dc%26sp%3Dracwdl%26sig%3DAKGXHmtHoeKOJ9BTQpNeJKpvdfJhGIAqZh2JEN0m0pU%253D">Explore</a>
```

Create a server-side application that dynamically publishes IP-restricted, short-lived SAS URL.  
It can be reused as a tool that can be integrated into a variety of applications.  
