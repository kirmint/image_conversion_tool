const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const app = express();

const UPLOAD_FOLDER = path.join(__dirname, "public", "uploads");
const PROCESSED_FOLDER = path.join(__dirname, "public", "processed");

// Ensure the upload and processed directories exist
fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
fs.mkdirSync(PROCESSED_FOLDER, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_FOLDER);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, "public")));

app.post("/upload", upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }

    const filepath = req.file.path;
    const filename = path.parse(req.file.filename).name;

    try {
        await processImage(filepath, filename);
        res.send("Image successfully uploaded and processed");
    } catch (error) {
        console.error("Error processing image:", error);
        res.status(500).send("Error processing image");
    }
});

async function processImage(filepath, filename) {
    const formats = ["jpg", "avif", "webp"];
    const sizes = [
        [800, 600],
        [400, 300],
        [200, 150],
    ];

    for (const format of formats) {
        await sharp(filepath)
            .toFormat(format)
            .toFile(path.join(PROCESSED_FOLDER, `${filename}.${format}`));
    }

    for (const [width, height] of sizes) {
        await sharp(filepath)
            .resize(width, height)
            .toFile(
                path.join(
                    PROCESSED_FOLDER,
                    `${filename}_${width}x${height}.jpg`
                )
            );
    }
}

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
