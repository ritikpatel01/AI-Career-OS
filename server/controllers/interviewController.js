const {
    getInterviewQuestions,
    submitInterviewAnswer
} = require("../services/interviewService");


// =========================================================
// GET INTERVIEW HISTORY
// =========================================================

const getQuestions = async (req, res) => {

    try {

        // ---------------------------------------------
        // AUTHENTICATED USER
        // ---------------------------------------------

        const userId = req.user.userId;


        // ---------------------------------------------
        // QUERY FILTERS
        // ---------------------------------------------

        const questions = await getInterviewQuestions(
            userId,
            req.query
        );


        // ---------------------------------------------
        // SUCCESS RESPONSE
        // ---------------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Interview history fetched successfully",

            count:
                questions.length,

            data:
                questions

        });

    } catch (error) {

        console.error("Get Interview History Error:");


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch interview history",

            error:
                "Failed to fetch interview history"

        });
    }
};



// =========================================================
// SUBMIT INTERVIEW ANSWER
// =========================================================

const submitAnswer = async (req, res) => {

    try {

        // ---------------------------------------------
        // AUTHENTICATED USER
        // ---------------------------------------------

        const userId = req.user.userId;


        // ---------------------------------------------
        // SUBMIT ANSWER
        // ---------------------------------------------

        const result =
            await submitInterviewAnswer(
                userId,
                req.body
            );


        // ---------------------------------------------
        // SUCCESS RESPONSE
        // ---------------------------------------------

        return res.status(201).json({

            success: true,

            message:
                "Interview answer evaluated successfully",

            data: {

                interview:
                    result.interview,

                evaluation:
                    result.evaluation

            }

        });

    } catch (error) {

        console.error("Submit Interview Answer Error:");


        // ---------------------------------------------
        // VALIDATION / USER ERROR
        // ---------------------------------------------

        if (
            error.message ===
                "Interview question is required" ||
            error.message ===
                "Interview answer is required"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    error.message

            });
        }


        // ---------------------------------------------
        // AI / SERVER ERROR
        // ---------------------------------------------

        return res.status(500).json({

            success: false,

            message:
                "Failed to evaluate interview answer",

            error:
                "Failed to evaluate interview answer"

        });
    }
};



// =========================================================
// EXPORT
// =========================================================

module.exports = {
    getPreparation: async (req, res) => {
        res.set("Cache-Control", "private, no-store");
        const { preparationQuery } = require("../validators/interviewPreparationValidator");
        const { error, value } = preparationQuery.validate(req.query, { stripUnknown: false });
        if (error) return res.status(400).json({ success: false, message: "Invalid interview preparation filters." });
        try {
            const data = await require("../services/interviewService").getPreparation(req.user.userId, value);
            return res.status(200).json({ success: true, data });
        } catch {
            return res.status(503).json({ success: false, message: "Interview preparation is unavailable. Please retry." });
        }
    },
    savePreparation: async (req, res) => {
        res.set("Cache-Control", "private, no-store");
        if (!/^prep-\d{2}-\d{2}$/.test(req.params.questionId)) return res.status(400).json({ success: false, message: "Invalid question identifier." });
        const { preparationPatch } = require("../validators/interviewPreparationValidator");
        const { error, value } = preparationPatch.validate(req.body, { stripUnknown: false });
        if (error) return res.status(400).json({ success: false, message: "Invalid preparation update. Check field types and answer/notes limits." });
        try {
            const data = await require("../services/interviewService").savePreparation(req.user.userId, req.params.questionId, value);
            if (!data) return res.status(404).json({ success: false, message: "Question not found." });
            return res.status(200).json({ success: true, data });
        } catch {
            return res.status(503).json({ success: false, message: "Could not save interview preparation. Your draft has not been cleared." });
        }
    },

    getQuestions,

    submitAnswer

};
