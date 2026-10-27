const multer = require("multer");
const mammoth = require("mammoth");

const storage = multer.memoryStorage();

const PDF_MIME_TYPE = "application/pdf";
const DOCX_MIME_TYPE =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const allowedMimeTypes = [PDF_MIME_TYPE, DOCX_MIME_TYPE];

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF and DOCX resume files are allowed."), false);
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    },
    fileFilter
});

const getZipEntryNames = (buffer) => {
    if (!Buffer.isBuffer(buffer) || buffer.length < 22) {
        return null;
    }

    const minimumOffset = Math.max(0, buffer.length - 22 - 0xffff);
    let endRecordOffset = -1;

    for (
        let offset = buffer.length - 22;
        offset >= minimumOffset;
        offset -= 1
    ) {
        if (
            buffer.readUInt32LE(offset) === 0x06054b50 &&
            offset + 22 + buffer.readUInt16LE(offset + 20) === buffer.length
        ) {
            endRecordOffset = offset;
            break;
        }
    }

    if (endRecordOffset < 0) {
        return null;
    }

    const diskNumber = buffer.readUInt16LE(endRecordOffset + 4);
    const centralDirectoryDisk = buffer.readUInt16LE(endRecordOffset + 6);
    const entriesOnDisk = buffer.readUInt16LE(endRecordOffset + 8);
    const totalEntries = buffer.readUInt16LE(endRecordOffset + 10);
    const centralDirectorySize = buffer.readUInt32LE(endRecordOffset + 12);
    const centralDirectoryOffset = buffer.readUInt32LE(endRecordOffset + 16);
    const centralDirectoryEnd =
        centralDirectoryOffset + centralDirectorySize;

    if (
        diskNumber !== 0 ||
        centralDirectoryDisk !== 0 ||
        entriesOnDisk !== totalEntries ||
        totalEntries === 0xffff ||
        centralDirectorySize === 0xffffffff ||
        centralDirectoryOffset === 0xffffffff ||
        centralDirectoryOffset < 0 ||
        centralDirectoryEnd > endRecordOffset
    ) {
        return null;
    }

    const entryNames = new Set();
    let cursor = centralDirectoryOffset;

    for (let index = 0; index < totalEntries; index += 1) {
        if (
            cursor + 46 > centralDirectoryEnd ||
            buffer.readUInt32LE(cursor) !== 0x02014b50
        ) {
            return null;
        }

        const fileNameLength = buffer.readUInt16LE(cursor + 28);
        const extraLength = buffer.readUInt16LE(cursor + 30);
        const commentLength = buffer.readUInt16LE(cursor + 32);
        const entryEnd =
            cursor + 46 + fileNameLength + extraLength + commentLength;

        if (entryEnd > centralDirectoryEnd) {
            return null;
        }

        const fileName = buffer.toString(
            "utf8",
            cursor + 46,
            cursor + 46 + fileNameLength
        );

        entryNames.add(fileName);
        cursor = entryEnd;
    }

    if (cursor !== centralDirectoryEnd) {
        return null;
    }

    return entryNames;
};

const hasValidPdfSignature = (buffer) => {
    if (!Buffer.isBuffer(buffer)) {
        return false;
    }

    const header = buffer.subarray(0, Math.min(buffer.length, 1024));
    return header.includes(Buffer.from("%PDF-", "ascii"));
};

const isValidDocx = async (buffer) => {
    const entries = getZipEntryNames(buffer);

    if (
        !entries ||
        !entries.has("[Content_Types].xml") ||
        !entries.has("_rels/.rels") ||
        !entries.has("word/document.xml")
    ) {
        return false;
    }

    try {
        // Mammoth parses the DOCX package and its main document XML. The
        // extracted text is intentionally discarded here; analysis performs
        // its normal extraction after this validation succeeds.
        await mammoth.extractRawText({ buffer });
        return true;
    } catch {
        return false;
    }
};

const rejectUpload = (res, message) =>
    res.status(400).json({
        success: false,
        message
    });

// Accept only the expected field and let Multer reject a second file before
// it is buffered. This middleware preserves the controller's req.file API.
const uploadResume = (req, res, next) => {
    upload.array("resume", 1)(req, res, async (error) => {
        if (error) {
            if (error instanceof multer.MulterError) {
                if (
                    error.code === "LIMIT_UNEXPECTED_FILE" &&
                    error.field !== "resume"
                ) {
                    return rejectUpload(
                        res,
                        "Only the resume file field is allowed"
                    );
                }

                if (
                    error.code === "LIMIT_UNEXPECTED_FILE" ||
                    error.code === "LIMIT_FILE_COUNT"
                ) {
                    return rejectUpload(
                        res,
                        "Only one resume file is allowed"
                    );
                }

                if (error.code === "LIMIT_FILE_SIZE") {
                    return rejectUpload(
                        res,
                        "Resume file must be 5 MiB or smaller"
                    );
                }

                return rejectUpload(res, "Invalid resume upload");
            }

            // fileFilter errors are expected client input errors. Do not log
            // or return the uploaded filename or any file contents.
            if (error.message === "Only PDF and DOCX resume files are allowed.") {
                return rejectUpload(res, error.message);
            }

            return next(error);
        }

        if (!req.files || req.files.length === 0) {
            return rejectUpload(res, "Resume file is required");
        }

        const file = req.files[0];

        if (file.mimetype === PDF_MIME_TYPE) {
            if (!hasValidPdfSignature(file.buffer)) {
                return rejectUpload(
                    res,
                    "Invalid or unsupported resume file. Upload a valid PDF or DOCX."
                );
            }
        } else if (file.mimetype === DOCX_MIME_TYPE) {
            if (!(await isValidDocx(file.buffer))) {
                return rejectUpload(
                    res,
                    "Invalid or unsupported resume file. Upload a valid PDF or DOCX."
                );
            }
        } else {
            return rejectUpload(res, "Only PDF and DOCX resume files are allowed.");
        }

        req.file = file;
        next();
    });
};

module.exports = uploadResume;
