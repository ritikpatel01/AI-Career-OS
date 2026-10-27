const multer = require("multer");
const mammoth = require("mammoth");
const path = require("path");

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".txt", ".doc", ".docx"]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_DOCUMENT_SIZE,
        files: 1
    },
    fileFilter(req, file, callback) {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(extension)) {
            return callback(new Error("Only PDF, TXT, DOC, and DOCX files are allowed."));
        }
        callback(null, true);
    }
});

const hasPdfSignature = (buffer) =>
    Buffer.isBuffer(buffer) &&
    buffer.subarray(0, Math.min(buffer.length, 1024)).includes(Buffer.from("%PDF-", "ascii"));

const hasLegacyWordSignature = (buffer) =>
    Buffer.isBuffer(buffer) &&
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));

const isUtf8Text = (buffer) => {
    if (!Buffer.isBuffer(buffer) || buffer.includes(0)) return false;
    try {
        new TextDecoder("utf-8", { fatal: true }).decode(buffer);
        return true;
    } catch {
        return false;
    }
};

const isValidDocx = async (buffer) => {
    if (!Buffer.isBuffer(buffer) || buffer.length < 22) {
        return false;
    }

    const minOffset = Math.max(0, buffer.length - 22 - 0xffff);
    let endOffset = -1;
    for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
        if (
            buffer.readUInt32LE(offset) === 0x06054b50 &&
            offset + 22 + buffer.readUInt16LE(offset + 20) === buffer.length
        ) {
            endOffset = offset;
            break;
        }
    }
    if (endOffset < 0) return false;

    const disk = buffer.readUInt16LE(endOffset + 4);
    const directoryDisk = buffer.readUInt16LE(endOffset + 6);
    const entriesOnDisk = buffer.readUInt16LE(endOffset + 8);
    const entryCount = buffer.readUInt16LE(endOffset + 10);
    const directorySize = buffer.readUInt32LE(endOffset + 12);
    const directoryOffset = buffer.readUInt32LE(endOffset + 16);
    const directoryEnd = directoryOffset + directorySize;
    if (
        disk !== 0 || directoryDisk !== 0 || entriesOnDisk !== entryCount ||
        entryCount === 0 || entryCount > 2000 || entryCount === 0xffff ||
        directorySize === 0xffffffff || directoryOffset === 0xffffffff ||
        directoryEnd > endOffset
    ) return false;

    const expectedEntries = new Set([
        "[Content_Types].xml",
        "_rels/.rels",
        "word/document.xml"
    ]);
    let cursor = directoryOffset;
    let expandedSize = 0;
    for (let index = 0; index < entryCount; index += 1) {
        if (cursor + 46 > directoryEnd || buffer.readUInt32LE(cursor) !== 0x02014b50) {
            return false;
        }
        const flags = buffer.readUInt16LE(cursor + 8);
        const compression = buffer.readUInt16LE(cursor + 10);
        const uncompressedSize = buffer.readUInt32LE(cursor + 24);
        const nameLength = buffer.readUInt16LE(cursor + 28);
        const extraLength = buffer.readUInt16LE(cursor + 30);
        const commentLength = buffer.readUInt16LE(cursor + 32);
        const entryEnd = cursor + 46 + nameLength + extraLength + commentLength;
        if (entryEnd > directoryEnd || (flags & 0x1) || ![0, 8].includes(compression)) {
            return false;
        }
        const name = buffer.toString("utf8", cursor + 46, cursor + 46 + nameLength);
        expectedEntries.delete(name);
        expandedSize += uncompressedSize;
        if (expandedSize > 50 * 1024 * 1024) return false;
        cursor = entryEnd;
    }
    if (cursor !== directoryEnd || expectedEntries.size > 0) return false;

    try {
        const result = await mammoth.extractRawText({ buffer });
        return typeof result.value === "string";
    } catch {
        return false;
    }
};

const reject = (res, message) =>
    res.status(400).json({ success: false, message });

const uploadDocument = (req, res, next) => {
    upload.single("file")(req, res, async (error) => {
        if (error) {
            if (error instanceof multer.MulterError) {
                const message = error.code === "LIMIT_FILE_SIZE"
                    ? "Document must be 10 MiB or smaller."
                    : "Upload exactly one document using the file field.";
                return reject(res, message);
            }
            if (error.message === "Only PDF, TXT, DOC, and DOCX files are allowed.") {
                return reject(res, error.message);
            }
            return next(error);
        }

        if (!req.file) return reject(res, "A document file is required.");

        const extension = path.extname(req.file.originalname).toLowerCase();
        const buffer = req.file.buffer;
        let valid = false;

        if (extension === ".pdf") valid = hasPdfSignature(buffer);
        if (extension === ".txt") valid = isUtf8Text(buffer);
        if (extension === ".doc") valid = hasLegacyWordSignature(buffer);
        if (extension === ".docx") valid = await isValidDocx(buffer);

        if (!valid) {
            return reject(res, "The file content does not match a supported PDF, TXT, DOC, or DOCX document.");
        }

        req.documentFileType = extension.slice(1).toUpperCase();
        next();
    });
};

module.exports = uploadDocument;
