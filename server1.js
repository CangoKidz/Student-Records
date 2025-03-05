const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const csv = require("csv-parser");

const app = express();
app.use(express.json());
app.use(cors());

const DATA_DIR = path.join(__dirname, "StudentData");
const DATA_FILE = path.join(DATA_DIR, "students.csv");
const FEES_FILE = path.join(DATA_DIR, "fees.json");

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "Name,Class,DOB,Father,Mother,Admission\n");
if (!fs.existsSync(FEES_FILE)) fs.writeFileSync(FEES_FILE, "{}");

// Function to sanitize CSV input (prevent CSV injection)
function sanitizeCSVField(value) {
    if (typeof value === "string" && /^[=+\-@]/.test(value)) {
        return `'${value}`;
    }
    return value;
}

// Route to save a new student
app.post("/save", (req, res) => {
    const student = req.body;
    const sanitizedData = [
        sanitizeCSVField(student.name),
        sanitizeCSVField(student.class),
        sanitizeCSVField(student.dob),
        sanitizeCSVField(student.father),
        sanitizeCSVField(student.mother),
        sanitizeCSVField(student.admission)
    ].join(",");

    fs.appendFile(DATA_FILE, `\n${sanitizedData}`, (err) => {
        if (err) return res.status(500).send("Error saving student record.");
        res.send("Student saved!");
    });
});

// Route to get all students
app.get("/getStudents", (req, res) => {
    const students = [];

    fs.createReadStream(DATA_FILE)
        .pipe(csv())
        .on("data", (row) => students.push(row))
        .on("end", () => res.json(students))
        .on("error", () => res.status(500).send("Error reading student data."));
});

// Route to add a fee payment for a student
app.post("/addFee/:index", (req, res) => {
    const index = parseInt(req.params.index);
    const { month, amount } = req.body;

    if (isNaN(index) || index < 0) {
        return res.status(400).send("Invalid student index.");
    }

    fs.readFile(FEES_FILE, "utf8", (err, data) => {
        if (err) return res.status(500).send("Error reading fee data.");

        const fees = JSON.parse(data || "{}");

        // Ensure student entry exists
        if (!fees[index]) {
            fees[index] = {};
        }

        // Store the fee under the respective month
        fees[index][month] = amount;

        fs.writeFile(FEES_FILE, JSON.stringify(fees, null, 2), (writeErr) => {
            if (writeErr) return res.status(500).send("Error saving fee data.");
            res.send("Fee added!");
        });
    });
});

// Route to get all fee records
app.get("/getFees", (req, res) => {
    fs.readFile(FEES_FILE, "utf8", (err, data) => {
        if (err) return res.status(500).send("Error reading fee data.");
        res.json(JSON.parse(data || "{}"));
    });
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));
