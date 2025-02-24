
<a><img src='https://i.imgur.com/LyHic3i.gif'/></a>
<h1 align="center"> MEGAJS CDN</h1>

A lightweight and serverless CDN utilizing MEGA for file storage and delivery... 

Base by **[IRON-M4N](https://github.com/IRON-M4N/MegaCDN)**

Front End Use [HERE](https://cdn.giftedtech.web.id)

<a><img src='https://i.imgur.com/LyHic3i.gif'/></a>
 
<details>
<summary>INSTALLATION</summary>

### Clone the Repository  
```js
git clone https://github.com/mouricedevs/mega-cdn.git
cd mega-cdn
npm install
```

<a><img src='https://i.imgur.com/LyHic3i.gif'/></a>

## Configuration  

Modify `config.js` or use environment variables. Example `.env` file:  

```
EMAIL=giftedtech.ironman@onlyfans.com
PASS=Katarenai nemurenai toroimerai
DOMAIN=https://yourdomain.com
TEMP=memory
```

<a><img src='https://i.imgur.com/LyHic3i.gif'/></a>

## Running the Server  

Using PM2 for process management:  
```js
npm start
```  
To stop or restart:  
```sh
npm stop  
npm restart  
```

</details>

<a><img src='https://i.imgur.com/LyHic3i.gif'/></a>


<details>
<summary>UPLOADING FILES</summary>

Send a `POST` request to `/api/upload.php` with a multipart form containing a file and file name.  

Example using `curl`:  
```sh
curl -X POST -F "file=@image.jpg" https://yourdomain.com/api/upload.php
```

<a><img src='https://i.imgur.com/LyHic3i.gif'/></a>

### Response Example  
```json
{
  status: 200,
  success: true,
  creator: 'GiftedTech',
  files: [
    {
      file_name: 'filename.ext',
      stream_url: 'https://yourdomain.com/file/filename.ext',
      download_url: 'https://yourdomain.com/file/download/filename.ext',
      delete_url: 'https://yourdomain.com/file/delete/filename.ext',    
      name: 'filename.ext',
      size: 835579
    }
  ]
}
```

OR

```json
{
  status: 200,
  success: true,
  creator: 'GiftedTech',
  message: 'File Already Exists in Database',
  file: [
    {
      file_name: 'filename.ext',
      stream_url: 'https://yourdomain.com/file/filename.ext',
      download_url: 'https://yourdomain.com/file/download/filename.ext',
      delete_url: 'https://yourdomain.com/file/delete/filename.ext',    
      name: 'filename.ext',
      size: 835579
    }
  ]
}
```

</details>

<a><img src='https://i.imgur.com/LyHic3i.gif'/></a>

<details>
<summary>SIMPLE DOCUMENTATION</summary>

```js
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

async function giftedCdn(path) {
  if (!fs.existsSync(path)) {
    throw new Error(File not found: ${path});
  }

  const form = new FormData();
  const fileStream = fs.createReadStream(path);
  form.append("file", fileStream);
  const originalFileName = path.split("/").pop(); 
  form.append("originalFileName", originalFileName);

  try {
    const response = await axios.post("https://cdn.giftedtech.web.id/api/upload.php", form, {
      headers: {
        ...form.getHeaders(), 
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(API Error: ${error.response.status} - ${JSON.stringify(error.response.data)});
    } else if (error.request) {
      throw new Error("No response received from the server.");
    } else {
      throw new Error(Request Error: ${error.message});
    }
  }
}

//USAGE CASE

/* (async () => {
    try {
      const result = await giftedCdn("./gifted.png");
      console.log("Upload successful:", result);
    } catch (error) {
      console.error("Upload failed:", error.message);
    }
  })(); */

module.exports = { giftedCdn };
```

<a><img src='https://i.imgur.com/LyHic3i.gif'/></a>

### Example Usage in Whatsapp Bot 

```js
// GIFTED-MD

const { gmd, makeId, giftedCdn } = require('../gift');
const fs = require("fs");
const path = require("path");

gmd(
  {
    pattern: 'upload',
    alias: ['url', 'tourl', 'geturl'],
    desc: 'Upload Files to get Urls.',
    category: 'tools',
    react: '📡',
    filename: __filename,
  },
  async (Gifted, mek, m, { from, quoted, reply, pushname }) => {
    try {
      if (!quoted) {
        return reply(`Reply to an image, video, audio, or document to upload.\nUse *${prefix}url*`);
      }
      const mediaBuffer = await quoted.download();
      if (!mediaBuffer) {
        return reply('Failed to download media. Please try again.');
      }
      const { fileTypeFromBuffer } = await import('file-type'); // Import file-type npm package
      const fileType = await fileTypeFromBuffer(mediaBuffer);
      if (!fileType) {
        return reply('Unable to determine the file type of the media.');
      }

      // Generate a random filename using makeId function
      const filename = `${makeId(5)}.${fileType.ext}`;

      // Save the media to a temporary file
      const tempFilePath = path.join(__dirname, filename);
      fs.writeFileSync(tempFilePath, mediaBuffer);
      const uploadResult = await giftedCdn(tempFilePath);
      if (!uploadResult.success) {
        return reply(`Upload failed: ${uploadResult.error || uploadResult.message}`);
      }
      const downloadUrl = uploadResult.files[0].download_url;
      const deleteUrl = uploadResult.files[0].delete_url;
      const stats = fs.statSync(tempFilePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      const message = `*Hey ${pushname}, Here Are Your Media URLs:*\n\nStream Url:${streamUrl}\nDownload Url:${downloadUrl}\n*File Size:* ${fileSizeMB.toFixed(
        2
      )} MB\n*File Type:* ${fileType.ext.toUpperCase()}\n*File Expiration:* No Expiry`;
      if (fileType.mime.startsWith('image/') || fileType.mime.startsWith('video/')) {
        await Gifted.sendMessage(
          from,
          {
            [fileType.mime.startsWith('image/') ? 'image' : 'video']: { url: tempFilePath },
            caption: message,
          },
          { quoted: mek }
        );
      } else if (fileType.mime.startsWith('audio/')) {
        await Gifted.sendMessage(from, { text: message }, { quoted: mek });
      }
      await m.react('✅');
      fs.unlinkSync(tempFilePath);
    } catch (error) {
      console.error(error);
      reply(`An error occurred while uploading the file: ${error.message}`);
    }
  }
);
```
![GiftedTech](https://github.com/user-attachments/assets/ab5595e4-2865-4ee4-9881-eeec55c9ada2)


</details>

<a><img src='https://i.imgur.com/LyHic3i.gif'/></a>

 
<details>
<summary>TO DO</summary>
- [ ] Add multiple accounts support

## Contributing  
1. Fork the repository  
2. Create a new branch (`feature-web`)  
3. Commit your changes  
4. Open a pull request  

**[BASE BY IRON-M4N](https://github.com/IRON-M4N)**

</details>

<a><img src='https://i.imgur.com/LyHic3i.gif'/></a>
