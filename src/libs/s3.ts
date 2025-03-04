// import required modules
import MinIO, { ClientOptions } from "./minio";

export interface s3Options extends ClientOptions { }

// export s3 class
export default class S3 {
  // minio client
  minio: any;

  // class constructor
  constructor(options: ClientOptions) {
    // init minio client
    this.minio = new MinIO(options);
  }

  /* region methods */

  /**
   * copy file.
   * @param {string} bucket bucket name.
   * @param {string} destination object name.
   */
  async copyFile(bucket: string, destination: string, callback: any) {
    const bucketExists = await this.minio.bucketExists(bucket);

    try {
      const objectExists = await this.minio.objectExists(bucket, destination);
    } catch (err: any) {
      console.log(err.message)
    }

    callback(bucketExists);
  }

  /**
   * put file.
   * @param {string} bucket bucket name.
   * @param {string} filePath physical file path.
   * @param {string} name object name.   
   */
  async putFile(bucket: string, filePath: string, name: string) {
    try {
      // check bucket exists
      // const bucketExists = await this.minio.bucketExists(bucket);

      try {
        // check object exists
        const objectExists = await this.minio.objectExists(bucket, name);
      } catch (err: any) {
        // if not found
        if (err.message.toLowerCase() == "not found") {
          try {
            // put object
            const info = await this.minio.putObject(bucket, name, filePath);

            // return callback
            return info;
          } catch (err: any) {
            // return error
            return err.message;
          }
        }
      }
    } catch (err: any) {
      // return error
      return err.message;
    }
  }

  /**
   * put file stream.
   * @param {string} bucket bucket name.
   * @param {string} fileStream file stream object.
   * @param {string} name object name.
   */
  async putFileStream(bucket: string, fileStream: string, name: string) {
    try {
      // check bucket exists
      // const bucketExists = await this.minio.bucketExists(bucket);

      try {
        // put object
        const info = await this.minio.putObjectStream(bucket, name, fileStream);

        // return info
        return info;
      } catch (err: any) {
        // return error
        return err.message;
      }
    } catch (err: any) {
      // return error
      return err.message;
    }
  }

  /**
   * get file stream.
   * @param {string} bucket bucket name.
   * @param {string} name object name.
   * @param {string} filePath file path.
   */
  async getFile(bucket: string, name: string, filePath: string) {
    try {
      // check bucket exists
      // const bucketExists = await this.minio.bucketExists(bucket);

      try {
        // get object 
        const exists = await this.minio.getObject(bucket, name, filePath);

        // return exists
        return exists;
      } catch (err: any) {
        // return error
        return err.message;
      }
    } catch (err: any) {
      // return error
      return err.message;
    }
  }

  /**
  * get object stream.
  * @param {any} fileStream buffer to be streamed.
  */
  getObjectStream(fileStream: any) {
    return new Promise((resolve, reject) => {
      if (typeof fileStream === "object") {
        const data: any = [];

        fileStream.on('data', function (obj: any) {
          data.push(obj);
        });

        fileStream.on('end', function () {
          resolve(data.join(""));
        });

        fileStream.on('error', function (err: any) {
          resolve("");
        });
      } else {
        resolve("");
      }
    });
  }

  /**
   * get file stream.
   * @param {string} bucket bucket name.
   * @param {string} name object name.
   */
  async getFileStream(bucket: string, name: string) {
    try {
      // check bucket exists
      // const bucketExists = await this.minio.bucketExists(bucket);

      try {
        // get object stream
        const objectStream = await this.minio.getObjectStream(bucket, name);

        // return object stream
        return await this.getObjectStream(objectStream);
      } catch (err: any) {
        // return error
        return err.message;
      }
    } catch (err: any) {
      // return error
      return err.message;
    }
  }

  /**
   * copy object
   * @param {string} bucket bucket name.
   * @param {string} name object name.
   * @param {string} sourceObject Path of the file to be copied.
   */
  async copyObject(bucket: string, name: string, sourceObject: string) {
    try {
      // check bucket exists
      // const bucketExists = await this.minio.bucketExists(bucket);

      try {
        // get info
        const info = await this.minio.copyObject(bucket, name, sourceObject);

        // return info
        return info;
      } catch (err: any) {
        // return error
        return err.message;
      }
    } catch (err: any) {
      // return error
      return err.message;
    }
  }

  /**
   * get file stream.
   * @param {string} bucket bucket name.
   * @param {string} name object name.
   */
  async deleteFile(bucket: string, name: string) {
    try {
      // check bucket exists
      // const bucketExists = await this.minio.bucketExists(bucket);

      try {
        // get info
        const info = await this.minio.deleteObject(bucket, name);

        // return info
        return info;
      } catch (err: any) {
        // return error
        return err.message;
      }
    } catch (err: any) {
      // return error
      return err.message;
    }
  }

  /* endregion */
}
