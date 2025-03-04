// import required modules
import * as Minio from "minio"
import fs from "fs"

/*
{
      endPoint: process.env["S3_CLIENT_ENDPOINT"] as string  || "",
      port: Number(process.env["S3_CLIENT_PORT"]) || 0,
      useSSL: Boolean(process.env["S3_CLIENT_USESSL"]) || false,
      accessKey: process.env["S3_CLIENT_ACCESSKEY"] as string || "",
      secretKey: process.env["S3_CLIENT_SECRETKEY"] as string || "",
    }

*/

export interface ClientOptions extends Minio.ClientOptions { }

// export minio class
export default class MinIO {
  // define minio client
  minioClient: any;

  // class constructor
  constructor(options: Minio.ClientOptions) {
    this.minioClient = new Minio.Client(options)
  }

  /**
   * Checks if a bucket exists.
   * @param {string} bucketName Name of the bucket.
   */
  async bucketExists(bucketName: string) {
    const exists = await this.minioClient.bucketExists(bucketName);
    return exists;
  }

  /**
   * Gets metadata of an object.
   * @param {string} bucketName Name of the bucket.
   * @param {string} objectName Name of the object.
   */
  async objectExists(bucketName: string, objectName: string) {
    const stat = await this.minioClient.statObject(bucketName, objectName);
    return stat;
  }

  /**
   * Downloads and saves the object as a file in the local filesystem.
   * @param {string} bucketName Name of the bucket.
   * @param {string} objectName Name of the object.
   * @param {string} filePath Path on the local filesystem to which the object data will be written.
   */
  async getObject(bucketName: string, objectName: string, filePath: any) {
    await this.minioClient.fGetObject(bucketName, objectName, filePath);
    return fs.existsSync(filePath);
  }

  /**
   * Downloads an object as a stream.
   * @param {string} bucketName Name of the bucket.
   * @param {string} objectName Name of the object.
   */
  async getObjectStream(bucketName: string, objectName: string) {
    const dataStream = await this.minioClient.getObject(
      bucketName,
      objectName
    );

    return dataStream;
  }

  /**
   * Downloads and saves the object as a file in the local filesystem.
   * @param {string} bucketName Name of the bucket.
   * @param {string} objectName Name of the object.
   * @param {string} filePath Path of the file to be uploaded.
   */
  async putObject(bucketName: string, objectName: string, filePath: string) {
    const objInfo = await this.minioClient.fPutObject(
      bucketName,
      objectName,
      filePath
    );

    return objInfo;
  }

  /**
   * Uploads an object from a stream/Buffer.
   * @param {string} bucketName Name of the bucket.
   * @param {string} objectName Name of the object.
   * @param {string} fileStream stream of the file to be uploaded.
   */
  async putObjectStream(bucketName: string, objectName: string, fileStream: string) {
    const objInfo = await this.minioClient.putObject(
      bucketName,
      objectName,
      fileStream
    );

    return objInfo;
  }

  /**
   * Copy a source object into a new object in the specified bucket.
   * @param {string} bucketName Name of the bucket.
   * @param {string} objectName Name of the object.
   * @param {string} sourceObject Path of the file to be copied.
   */
  async copyObject(bucketName: string, objectName: string, sourceObject: string) {
    const objInfo = await this.minioClient.copyObject(
      bucketName,
      objectName,
      sourceObject
    );

    return objInfo;
  }

  /**
   * Uploads an object from a stream/Buffer.
   * @param {string} bucketName Name of the bucket.
   * @param {string} objectName Name of the object.
   */
  async deleteObject(bucketName: string, objectName: string) {
    const objInfo = await this.minioClient.removeObject(
      bucketName,
      objectName
    );

    return objInfo;
  }
}