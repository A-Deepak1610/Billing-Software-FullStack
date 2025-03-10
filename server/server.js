const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const pool = require("./src/config/db");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("uploads"));// Serve uploaded files
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// Ensure `uploads` folder exists
const fs = require("fs");
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save inside 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});
const upload = multer({ storage });
// Upload route
app.post("/upload", upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const { invoiceno, invoicedate, customername } = req.body;
  const filepath = `/${req.file.filename}`;
  try {
    const sql =
      "INSERT INTO bills (invoiceno, invoicedate, customername, filepath) VALUES (?, ?, ?, ?)";
    const [result] = await pool
      .promise()
      .query(sql, [invoiceno, invoicedate, customername, filepath]);

    res.json({
      message: "File uploaded successfully",
      filename: req.file.filename,
      insertId: result.insertId,
    });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "Database error" });
  }
});
// Fetch bills
app.get("/fetch-details", (req, res) => {
  const query = `SELECT * FROM bills order by invoiceno`;
  pool.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ err: "Failed to data marks" });
    }
    res.status(200).json({ details: result });
  });
});
// Delete PDF Route
app.delete("/delete-datas/:filepath", (req, res) => {
    const filepath = decodeURIComponent(req.params.filepath);  // ✅ Decode safely
    console.log("Received Filepath for Deletion:", filepath); // Debugging

    const query = `DELETE FROM bills WHERE filepath=?`;
    
    pool.query(query, [filepath], (err, result) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ error: "Failed to delete data" });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "No record found with this filepath" });
      }

      res.status(200).json({ message: "Data deleted successfully" });
    });
});
//Download
app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);
  res.download(filePath, filename, (err) => {
      if (err) {
          console.error("Download Error:", err);
          res.status(500).send("Error downloading the file");
      }
  });
});
// Add data production
//Add data
app.post("/add-data-production", (req, res) => {
  const { m,d, r, c, s,i,t } = req.body;
  const query = `INSERT INTO production (meters,invoicedate,rate,cgst,sgst,igst,toatl_amt) VALUES (?, ?, ?, ?,?,?,?)`;
  pool.query(query, [ m,d, r, c, s,i,t ], (err) => {
    if (err) {
      console.log("Database Error:", err);
      return res.status(500).json({ error: "Failed to add marks" });
    }
    res.status(200).json({ msg: "Data added successfully" });
  });
});
// Fetch data production
app.get("/fetch-data-production", (req, res) => {
  const query = `SELECT * FROM production`;
  pool.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ err: "Failed to data marks" });
    }
    res.status(200).json({ production: result });
  });
});