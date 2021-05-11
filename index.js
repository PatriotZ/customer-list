// Add required packages
const express = require("express");
const app = express();

// Set up EJS
app.set("view engine", "ejs");


// Start listener
app.listen(process.env.PORT || 3000, () => {
    console.log("Server started (http://localhost:3000/) !");
});

// Setup routes
app.get("/", (req, res) => {
    res.send ("Hello world...");
   // res.render("index");
});