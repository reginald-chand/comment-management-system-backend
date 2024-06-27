import { CommentModel } from "../../models/comment/comment.model.mjs";
import { commentControllerValidator } from "../../validators/comment/comment.controller.validator.mjs";
import { logger } from "../../configs/logger.config.mjs";
import mongoose from "mongoose";
import { toxicCommentDetectorUtil } from "../../utils/toxic.comment.detector.util.mjs";

export const commentController = async (request, response) => {
  const { error, value } = commentControllerValidator.validate(request.body);

  if (error) {
    return response.status(400).json({ responseMessage: error.message });
  }

  const { userName, userComment, postId } = value;

  try {
    const database = mongoose.connection.db;

    const existingUser = await database
      .collection("users")
      .findOne({ userName: { $eq: userName } });

    if (existingUser === null || !existingUser) {
      return response.status(404).json({ responseMessage: "User not found." });
    }

    const existingPosts = await database.collection("posts").find({}).toArray();

    if (existingPosts === null || existingPosts.length === 0) {
      return response.status(404).json({ responseMessage: "Post not found." });
    }

    for (const post of existingPosts) {
      const existingCommentDocument = await CommentModel.findOne({
        _id: { $eq: post._id },
      });

      if (!existingCommentDocument) {
        await CommentModel.create({ _id: post._id });
      }
    }

    const existingCommentingUser = await CommentModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(postId) } },
      { $unwind: "$comments" },
      { $match: { "comments.userName": userName } },
      { $project: { userName: userName } },
    ]);

    const foundCommentingUser = existingCommentingUser.some(
      (commentingUser) => userName === commentingUser.userName
    );

    if (foundCommentingUser) {
      await CommentModel.findOneAndUpdate(
        { _id: { $eq: new mongoose.Types.ObjectId(postId) } },
        {
          $pull: { comments: { userName: userName } },
          $inc: { totalComments: -1 },
        },
        { new: true, upsert: true }
      );

      return response.status(200).json({
        responseMessage: "Your comment has been successfully deleted.",
      });
    }

    const userCommentIsFlaggedToxicOrSpam = await toxicCommentDetectorUtil(
      userComment
    );

    if (userCommentIsFlaggedToxicOrSpam) {
      return response
        .status(400)
        .json({ responseMessage: userCommentIsFlaggedToxicOrSpam });
    }

    await CommentModel.findOneAndUpdate(
      { _id: { $eq: new mongoose.Types.ObjectId(postId) } },
      {
        $push: { comments: { userName: userName, userComment: userComment } },
        $inc: { totalComments: 1 },
      },
      { new: true, upsert: true }
    );

    return response
      .status(200)
      .json({ responseMessage: "Your comment has been successfully posted." });
  } catch (error) {
    logger.log({
      level: "error",
      message: error,
      additional: "Internal server error.",
    });

    return response.status(500).json({
      responseMessage: "Internal server error.",
    });
  }
};
