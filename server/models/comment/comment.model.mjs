import mongoose from "mongoose";

const commentPerUserSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true, ref: "User" },
    userComment: { type: String, required: true },
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "posts" },
    comments: [commentPerUserSchema],
    totalComments: { type: Number },
  },
  { timestamps: true }
);

export const CommentModel = mongoose.model("Comment", commentSchema);
