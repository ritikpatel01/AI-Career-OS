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

        console.error(
            "Get Interview History Error:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch interview history",

            error:
                error.message

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

        console.error(
            "Submit Interview Answer Error:",
            error.message
        );


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
                error.message

        });
    }
};



// =========================================================
// EXPORT
// =========================================================

module.exports = {

    getQuestions,

    submitAnswer

};