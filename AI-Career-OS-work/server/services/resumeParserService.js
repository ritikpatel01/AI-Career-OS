const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

const extractResumeText = async (file) => {

    // ==========================================
    // CHECK FILE
    // ==========================================

    if (!file) {
        throw new Error("Resume file is required");
    }

    const {
        mimetype,
        buffer
    } = file;

    try {

        // ==========================================
        // PDF RESUME
        // ==========================================

        if (mimetype === "application/pdf") {

            const parser = new PDFParse({
                data: buffer
            });

            const result = await parser.getText();

            await parser.destroy();

            const text = result.text.trim();

            if (!text) {
                throw new Error(
                    "No readable text found in the PDF resume."
                );
            }

            return text;
        }


        // ==========================================
        // DOCX RESUME
        // ==========================================

        if (
            mimetype ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {

            const result =
                await mammoth.extractRawText({
                    buffer
                });

            const text = result.value.trim();

            if (!text) {
                throw new Error(
                    "No readable text found in the DOCX resume."
                );
            }

            return text;
        }


        // ==========================================
        // UNSUPPORTED FILE
        // ==========================================

        throw new Error(
            "Unsupported resume format. Please upload PDF or DOCX."
        );

    } catch (error) {

        throw new Error(
            `Failed to extract resume text: ${error.message}`
        );
    }
};


module.exports = {
    extractResumeText
};