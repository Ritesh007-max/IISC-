const express = require('express');
const cors = require('cors');
const multer  = require('multer');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage });

function decodeAscii85(input) {
    const bytes = [];
    let group = [];

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (/\s/.test(char)) {
            continue;
        }

        if (char === '~') {
            break;
        }

        if (char === 'z' && group.length === 0) {
            bytes.push(0, 0, 0, 0);
            continue;
        }

        const code = input.charCodeAt(i);
        if (code < 33 || code > 117) {
            continue;
        }

        group.push(code - 33);

        if (group.length === 5) {
            let value = 0;
            for (const item of group) {
                value = (value * 85) + item;
            }

            bytes.push((value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255);
            group = [];
        }
    }

    if (group.length > 0) {
        const padding = 5 - group.length;
        while (group.length < 5) {
            group.push(84);
        }

        let value = 0;
        for (const item of group) {
            value = (value * 85) + item;
        }

        const chunk = [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
        bytes.push(...chunk.slice(0, 4 - padding));
    }

    return Buffer.from(bytes);
}

function decodePdfString(value) {
    return value
        .replace(/\\\\/g, '\\')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\b/g, '\b')
        .replace(/\\f/g, '\f');
}

function extractTextFromDecodedPdfContent(content) {
    const tokens = [];
    const segments = content.match(/(?:\[(?:.|\r?\n)*?\]\s*TJ|\((?:\\.|[^\\)])*\)\s*Tj|T\*)/g) || [];

    for (const segment of segments) {
        if (segment === 'T*') {
            tokens.push('\n');
            continue;
        }

        if (segment.endsWith('Tj')) {
            const match = segment.match(/\(([\s\S]*)\)\s*Tj$/);
            if (match) {
                tokens.push(decodePdfString(match[1]));
            }
            continue;
        }

        if (segment.endsWith('TJ')) {
            const match = segment.match(/\[(.*)\]\s*TJ$/s);
            if (!match) {
                continue;
            }

            const textParts = [...match[1].matchAll(/\((?:\\.|[^\\)])*\)/g)].map((item) =>
                decodePdfString(item[0].slice(1, -1))
            );
            if (textParts.length > 0) {
                tokens.push(textParts.join(''));
            }
        }
    }

    return tokens
        .join('')
        .replace(/\r/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function extractTextFromPdfFallback(filePath) {
    const pdfSource = fs.readFileSync(filePath, 'latin1');
    const streamPattern = /<<[\s\S]*?>>\s*stream\r?\n([\s\S]*?)endstream/g;
    let match;
    const decodedChunks = [];

    while ((match = streamPattern.exec(pdfSource)) !== null) {
        const dictionary = match[0];
        const streamData = match[1];
        let buffer = Buffer.from(streamData, 'latin1');

        try {
            if (/ASCII85Decode/.test(dictionary)) {
                buffer = decodeAscii85(streamData);
            }

            if (/FlateDecode/.test(dictionary)) {
                buffer = zlib.inflateSync(buffer);
            }

            decodedChunks.push(buffer.toString('latin1'));
        } catch (fallbackError) {
            continue;
        }
    }

    const text = extractTextFromDecodedPdfContent(decodedChunks.join('\n'));
    if (!text) {
        throw new Error('Could not extract text from this PDF. It may be image-based or encoded in an unsupported way.');
    }

    return text;
}

async function extractTextFromFile(file) {
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!fs.existsSync(file.path)) {
        throw new Error("File not found.");
    }

    try {
        if (ext === '.pdf') {
            const dataBuffer = fs.readFileSync(file.path);
            try {
                const data = await pdf(dataBuffer);
                return data.text;
            } catch (err) {
                if (err.message && err.message.includes("bad XRef entry")) {
                    return extractTextFromPdfFallback(file.path);
                }
                throw err;
            }
        } else if (ext === '.docx' || ext === '.doc') {
            const result = await mammoth.extractRawText({ path: file.path });
            return result.value;
        } else {
            throw new Error(`Unsupported file type: ${ext}`);
        }
    } catch (err) {
        throw new Error(`Error extracting text: ${err.message}`);
    }
}

app.get('/', (req, res) => {
  res.send('AI Adaptive Onboarding Engine API is running');
});

const cpUpload = upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'jobDescription', maxCount: 1 }]);

app.post('/upload', (req, res) => {
  cpUpload(req, res, async (uploadError) => {
    console.log("--- Received Upload Request ---");

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return res.status(400).json({ error: uploadError.message || "File upload failed." });
    }

    try {
        if (!req.files || !req.files['resume'] || !req.files['resume'][0]) {
            return res.status(400).json({ error: "Resume file is missing." });
        }

        const resumeFile = req.files['resume'][0];
        let resumeText = '';
        let jobDescriptionText = '';

        // Extract Resume Text
        resumeText = await extractTextFromFile(resumeFile);
        if (!resumeText || resumeText.trim() === '') {
            return res.status(400).json({ error: "Could not extract text from Resume. The file might be empty or unreadable." });
        }

        // Handle Job Description
        if (req.body.jobDescriptionText && req.body.jobDescriptionText.trim() !== '') {
            jobDescriptionText = req.body.jobDescriptionText;
        } else if (req.files['jobDescription'] && req.files['jobDescription'][0]) {
            jobDescriptionText = await extractTextFromFile(req.files['jobDescription'][0]);
            if (!jobDescriptionText || jobDescriptionText.trim() === '') {
                return res.status(400).json({ error: "Could not extract text from Job Description file." });
            }
        } else {
            return res.status(400).json({ error: "Job Description is missing (provide either text or file)." });
        }

        res.json({
            message: "Files processed successfully",
            resumeText: resumeText,
            jobDescriptionText: jobDescriptionText
        });

    } catch (error) {
        console.error("Extraction error:", error);
        res.status(500).json({ error: error.message });
    }
  });
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
