import Joi from "joi";

export const commentControllerValidator = Joi.object({
  csrfToken: Joi.string().required(),

  userName: Joi.string().pattern(new RegExp("^[a-z]+$")).required(),
  userComment: Joi.string().required(),

  postId: Joi.string()
    .pattern(new RegExp("^(?:[0-9a-fA-F]{24}|(?:[0-9]{1,19}))$"))
    .required(),

  userData: Joi.object().required(),
});
