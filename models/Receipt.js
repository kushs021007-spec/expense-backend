import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: Number,
  description: String,
  date: String,
  status: {
    type: String,
    enum: [
      "draft",
      "submitted",
      "manager_approved",
      "approved",
      "rejected"
    ],
    default: "submitted"
  }
}, { timestamps: true });

export default mongoose.model("Receipt", receiptSchema);
