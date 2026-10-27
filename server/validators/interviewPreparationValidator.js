const Joi = require("joi");
const { categories } = require("../services/interviewPreparationCatalog");

const preparationQuery = Joi.object({
    search: Joi.string().trim().max(120).allow("").default(""),
    category: Joi.string().valid("all", ...categories).default("all"),
    difficulty: Joi.string().valid("all", "Easy", "Medium", "Hard").default("all"),
    status: Joi.string().valid("all", "practiced", "unpracticed", "bookmarked", "revision").default("all"),
    sort: Joi.string().valid("category", "name", "difficulty", "recent").default("category"),
    page: Joi.number().integer().min(1).max(10000).default(1),
    limit: Joi.number().integer().min(1).max(50).default(12)
}).unknown(false);

const preparationPatch = Joi.object({
    answer: Joi.string().max(10000).allow(""),
    notes: Joi.string().max(5000).allow(""),
    practiced: Joi.boolean().strict(),
    bookmarked: Joi.boolean().strict(),
    revisionStatus: Joi.string().valid("not-needed", "needs-revision", "revised")
}).min(1).unknown(false).required();

module.exports = { preparationQuery, preparationPatch };
