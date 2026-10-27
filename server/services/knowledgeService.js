const Document = require("../models/Document");

const getKnowledgeItems = async (userId, filters = {}) => {
    const { query } = filters;

    const searchQuery = {
        user: userId,
        status: "processed"
    };

    if (query) {
        searchQuery.$or = [
            {
                title: {
                    $regex: query,
                    $options: "i"
                }
            },
            {
                extractedText: {
                    $regex: query,
                    $options: "i"
                }
            }
        ];
    }

    return await Document.find(searchQuery).sort({
        createdAt: -1
    });
};

const getKnowledgeItemById = async (userId, documentId) => {
    return await Document.findOne({
        _id: documentId,
        user: userId
    });
};

module.exports = {
    getKnowledgeItems,
    getKnowledgeItemById
};