const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

class ResumeDocumentError extends Error {
    constructor(message) {
        super(message);
        this.name = "ResumeDocumentError";
    }
}

const unreadableMessage = "Readable text could not be extracted from this resume. Scanned or image-only documents may require OCR. Upload a text-based PDF or DOCX.";
const invalidMessage = "The resume document is invalid, damaged, or unsupported. Upload a valid, unencrypted PDF or DOCX.";

const meaningfulText = (value) => {
    const text = String(value || "").trim();
    if (!/[\p{L}\p{N}]/u.test(text)) throw new ResumeDocumentError(unreadableMessage);
    return text;
};

const extractResumeText = async (file) => {
    if (!file) throw new ResumeDocumentError("Resume file is required");
    const { mimetype, buffer } = file;
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new ResumeDocumentError(invalidMessage);
    if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(mimetype)) {
        throw new ResumeDocumentError("Unsupported resume format. Please upload PDF or DOCX.");
    }
    try {
        if (mimetype === "application/pdf") {
            const parser = new PDFParse({ data: buffer });
            let extractionError;
            try {
                const result = await parser.getText();
                // pdf-parse inserts page labels even on pages with no text.
                // Remove only complete marker lines, preserving document prose.
                return meaningfulText(String(result.text || "").replace(/^[ \t]*--[ \t]*\d+[ \t]+of[ \t]+\d+[ \t]*--[ \t\r]*$/gm, ""));
            } catch (error) {
                extractionError = error;
                throw error;
            } finally {
                try {
                    await parser.destroy();
                } catch (error) {
                    // Preserve the original failure if cleanup also fails.
                    if (!extractionError) throw error;
                }
            }
        }
        const result = await mammoth.extractRawText({ buffer });
        return meaningfulText(result.value);
    } catch (error) {
        if (error instanceof ResumeDocumentError) throw error;
        const invalidPdf = ["InvalidPDFException", "PasswordException", "FormatError"].includes(error?.name);
        const invalidDocx = mimetype !== "application/pdf" && /end of central directory|corrupted zip|invalid (?:zip|signature)|not a zip|could not find main document|can't find.*(?:zip|document)|unexpected close tag|unclosed root tag|non-whitespace before first tag/i.test(error?.message || "");
        if (invalidPdf || invalidDocx) throw new ResumeDocumentError(invalidMessage);
        // Unexpected failures remain server errors; the controller sanitizes them.
        throw error;
    }
};

module.exports = { extractResumeText, ResumeDocumentError };
