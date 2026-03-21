import { Types } from "mongoose";
import { ApiError } from "@/src/lib/api";
import { saveUploadedFile } from "@/src/lib/uploads";
import { UploadedBillModel } from "@/src/models/uploaded-bill.model";

export const uploadService = {
  async createUploadedBill(sessionId: string, file: File) {
    if (!file) {
      throw new ApiError("FILE_REQUIRED", "A bill file is required", 400);
    }

    const { storagePath, checksum } = await saveUploadedFile(file);

    const upload = await UploadedBillModel.create({
      sessionId: new Types.ObjectId(sessionId),
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      storagePath,
      checksum,
      status: "uploaded",
    });

    return upload;
  },

  async getUploadedBill(uploadedBillId: string) {
    const upload = await UploadedBillModel.findById(uploadedBillId);

    if (!upload) {
      throw new ApiError("UPLOAD_NOT_FOUND", "Uploaded bill not found", 404);
    }

    return upload;
  },

  async updateStatus(
    uploadedBillId: string,
    status: "uploaded" | "processing" | "processed" | "failed",
    extractedText?: string | null,
  ) {
    return UploadedBillModel.findByIdAndUpdate(
      uploadedBillId,
      {
        $set: {
          status,
          ...(extractedText !== undefined ? { extractedText } : {}),
        },
      },
      { new: true },
    );
  },
};
