import { logger } from "../configs/logger.config.mjs";
import Perspective from "perspective-api-client";

const perspective = new Perspective({
  apiKey: process.env.PERSPECTIVE_API_KEY,
});

export const toxicCommentDetectorUtil = async (comment) => {
  if (comment === null) {
    throw new Error("Parameter 'comment' must have a value. (CANNOT BE NULL)");
  }

  if (typeof comment !== "string") {
    throw new TypeError(
      "Parameter 'comment' must have a value of type 'string'."
    );
  }

  try {
    const result = await perspective.analyze(comment, {
      attributes: ["toxicity", "spam"],
      languages: ["en"],
    });

    const { TOXICITY, SPAM } = result.attributeScores;

    if (TOXICITY.summaryScore.value > 0.5) {
      return "This comment can not be posted because it may contain words that can be harmful to the reader.";
    }

    if (SPAM.summaryScore.value > 0.5) {
      return "This comment can not be posted because it has been flagged as a spam.";
    }

    return false;
  } catch (error) {
    logger.log({
      level: "error",
      message: error.message,
      additional: "Internal server error.",
    });

    if (
      error.message.includes(
        "Attribute SPAM does not support request languages:"
      ) ||
      error.message.includes(
        "Attribute TOXICITY does not support request languages:"
      )
    ) {
      return "This comment cannot be posted because it may violate our community guidelines.";
    }

    return "Internal server error.";
  }
};
