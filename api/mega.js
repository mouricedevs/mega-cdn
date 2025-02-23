const { Mutex } = require('async-mutex');
const mega = require('megajs');
const fs = require('fs');
const path = require('path');
const config = require('../config.js');

class Client {
  constructor() {
    this.lock = new Mutex();
    this.storage = null;
  }

  async initialize() {
    if (this.storage) return;
    var storagePath = path.resolve(config.mega.storagePath);
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
    try {
      this.storage = await new mega.Storage({
        email: config.mega.email,
        password: config.mega.password,
        autologin: true,
        autoload: true,
        storagePath
      }).ready;
    } catch (e) {
      throw new Error(`Login failed: ${e.message}`);
    }
  }
  
  async uploadFile(filename, stream) {
    if (!this.storage) throw new Error('Storage not setup yet!');
    var release = await this.lock.acquire();
    try {
      var filePath = path.resolve(config.mega.storagePath, filename);
      var writeStream = fs.createWriteStream(filePath);
      stream.pipe(writeStream);
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
      var fileSize = fs.statSync(filePath).size;
      var upstream = this.storage.upload({ name: filename, size: fileSize, allowUploadBuffering: true });
      fs.createReadStream(filePath).pipe(upstream);
      return await new Promise((resolve, reject) => {
        upstream.on('complete', async (file) => {
          file.link((err, url) => {
            if (err) return reject(err);
            resolve({ name: file.name, size: file.size, mime: file.mime, url });
          });
        });
        upstream.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    } finally {
      release();
    }
  }
  async getFile(filePath) {
    if (!this.storage) throw new Error('Storage not setup yet!');
    var file = Object.values(this.storage.files).find(f => f.name === path.basename(filePath));
    if (!file) throw new Error('File not found');
    return file;
  }
}

module.exports = new Client();
