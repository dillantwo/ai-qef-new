import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";

const BUCKET_NAME = "learningMaterials";

/**
 * Resolve a GridFSBucket bound to the shared mongoose connection.
 * GridFS is used (instead of storing binaries inline in a document) so that
 * learning materials are not constrained by MongoDB's 16MB document limit.
 */
export async function getMaterialsBucket(): Promise<mongoose.mongo.GridFSBucket> {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection is not ready");
  }
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
}

/** Upload a buffer to GridFS and resolve with the stored file's ObjectId. */
export async function uploadMaterialFile(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<mongoose.Types.ObjectId> {
  const bucket = await getMaterialsBucket();
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, { metadata: { contentType } });
    uploadStream.on("error", reject);
    uploadStream.on("finish", () => resolve(uploadStream.id as mongoose.Types.ObjectId));
    uploadStream.end(buffer);
  });
}

/** Delete a stored file from GridFS. Missing files are ignored. */
export async function deleteMaterialFile(fileId: mongoose.Types.ObjectId): Promise<void> {
  const bucket = await getMaterialsBucket();
  try {
    await bucket.delete(fileId);
  } catch {
    // File may already be gone — deleting metadata is what matters.
  }
}

/** Open a readable download stream for a stored file. */
export async function openMaterialDownloadStream(
  fileId: mongoose.Types.ObjectId
): Promise<mongoose.mongo.GridFSBucketReadStream> {
  const bucket = await getMaterialsBucket();
  return bucket.openDownloadStream(fileId);
}
