const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const DATA_FILE = path.join(__dirname, "StudentData", "students.csv");

// Ensure the data directory and file exist
if (!fs.existsSync("StudentData")) fs.mkdirSync("StudentData");
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "Name,Class,DOB,Father,Mother,Admission,Fees\n");

app.post("/save", (req, res) => {
    const student = req.body;
    const age = new Date().getFullYear() - new Date(student.dob).getFullYear();
    const data = `\n${student.name},${student.class},${student.dob},${student.father},${student.mother},${student.admission},-`;
    
    fs.appendFile(DATA_FILE, data, (err) => {
        if (err) res.status(500).send("Error saving student record.");
        else res.send("Student saved!");
    });
});

app.get("/getStudents", (req, res) => {
    fs.readFile(DATA_FILE, "utf8", (err, data) => {
        if (err) return res.status(500).send("Error reading data.");
        
        const lines = data.trim().split("\n").slice(1);
        const students = lines.map(line => {
            const [name, studentClass, dob, father, mother, admission] = line.split(",");
            return { name, class: studentClass, dob, father, mother, admission };
        });

        res.json(students);
    });
});

app.post("/addFee/:index", (req, res) => {
    const { month, amount } = req.body;
    let lines = fs.readFileSync(DATA_FILE, "utf8").trim().split("\n");

    if (lines.length <= req.params.index + 1) return res.status(400).send("Invalid student index.");

    lines[req.params.index + 1] += `,${month}:${amount}`;
    fs.writeFileSync(DATA_FILE, lines.join("\n"));

    res.send("Fee added!");
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));
