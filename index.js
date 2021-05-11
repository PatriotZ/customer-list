require('dotenv').config()

// Add required packages
const multer = require("multer");
const upload = multer();
const express = require("express");
const app = express();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Set up EJS
app.set("view engine", "ejs");


app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});


// Add middleware to parse default urlencoded form
app.use(express.urlencoded({ extended: false }));

// Start listener
app.listen(process.env.PORT || 3000, () => {
    console.log("Server started (http://localhost:3000/) !");
});

// Setup routes

app.get("/", (req, res) => {    
    res.render("index");
});

app.get("/customers", (req, res) => {
    const sql = "SELECT * FROM CUSTOMER ORDER BY cusId";
    pool.query(sql, [], (err, result) => {
        var message = "";
        var model = {};
        if(err) {
            message = `Error - ${err.message}`;
        } else {
            message = "success";
            model = result.rows;
        };
        res.render("customer/index", {
            message: message,
            model : model
        });
    });
});

app.post("/customers", (req, res) => {
    const searchParams = req.body;
    let haveSearchParams = false;
    let searchArray = [];

    let query = "select * from customer "
    if(searchParams.ID != ''){
        haveSearchParams = true
        searchArray.push("cusId = " + searchParams.Id);
    }
    if(searchParams.firstName != ''){
        haveSearchParams = true
        searchArray.push("lower(cusFname) like '" + searchParams.firstName.toLowerCase() + "%'");
    }
    if(searchParams.lastName != ''){
        haveSearchParams = true
        searchArray.push("lower(cusLname) like '" + searchParams.lastName.toLowerCase() + "%'");
    }
    
    if(searchParams.state != ''){
        haveSearchParams = true
        searchArray.push("lower(cusState) = '" + searchParams.state.toLowerCase()+ "'");
    }
    if(searchParams.salesYTD != ''){
        haveSearchParams = true
        searchArray.push("cusSalesYTD = " + searchParams.salesYTD + "::float8::numeric::money");
    }

    if(searchParams.salesPrev != ''){
        haveSearchParams = true
        searchArray.push("cusSalesPrev = " + searchParams.salesPrev + "::float8::numeric::money");
    }

    if(haveSearchParams){
        let conditions = searchArray.toString();
        conditions = conditions.replace(/,/g, " and ")
        query += " where ";
        query += conditions;
        console.log(query);
    }

    pool.query(query, [], (err, result) => {
        var message = "";
        var model = {};
        if(err) {
            message = `Error - ${err.message}`;
        } else {
            message = "success";
            model = result.rows;
        };
        res.render("customer/index", {
            message: message,
            model : model,
            searchParams:searchParams
        });
    });
});


app.get("/customer/create", (req, res) => {
    const message = "";
    const customer = {}
    res.render("customer/create", {
        model : customer,
        message : message
    });
});

app.post("/customer/create", (req,res) => {   
    const customer = req.body;
    const customerArray = Object.values(customer);
    const sql = "INSERT INTO customer (cusId, cusFname, cusLname, cusState, cusSalesYTD, cusSalesPrev) VALUES ($1, $2, $3, $4, $5, $6)";
    pool.query(sql, customerArray, (err, result) => {
        var message = "New Customer Created!";
        var errorMessage = "";
        if (err) {
            message = "Error creating new customer.";
            errorMessage = `Error - ${err.message}`;
        } 
        res.render("customer/create", {
            model : customer,
            message:message,
            errorMessage:errorMessage
        });
   });   
});


app.get("/customer/edit/:id", (req, res) => {
    const id = [req.params.id];
    const sql = "SELECT * FROM CUSTOMER where cusId  = $1";
    pool.query(sql, id, (err, result) => {
        var message = "";
        var errorMessage = ""
        var customer = {};
        if(err) {
            message = "error";
            errorMessage = `Error - ${err.message}`;
        } else {
            customer = result.rows;
        };
        res.render("customer/edit", {
            message: message,
            errorMessage: errorMessage,
            model : customer
        });
    });
});

app.post("/customer/edit/:id", (req,res) => {   
    const customer = req.body;
    const customerArray = Object.values(customer);
    const sql = "update customer set cusId = $1, cusFname = $2, cusLname = $3, cusState = $4, cusSalesYTD = $5, cusSalesPrev = $6 where cusid = $1";
    pool.query(sql, customerArray, (err, result) => {
        var message = "Customer Updated Successfully!";
        var errorMessage = "";
        if (err) {
            message = "Error updating customer.";
            errorMessage = `Error - ${err.message}`;
        } 
        res.render("customer/edit", {
            model : [customer],
            message:message,
            errorMessage:errorMessage
        });
   });   
});

app.get("/customer/delete/:id", (req, res) => {
    const id = [req.params.id];
    const sql = "SELECT * FROM CUSTOMER where cusId  = $1";
    pool.query(sql, id, (err, result) => {
        var message = "";
        var errorMessage = ""
        var customer = {};
        if(err) {
            message = "error";
            errorMessage = `Error - ${err.message}`;
        } else {
            customer = result.rows;
        };
        res.render("customer/delete", {
            message: message,
            errorMessage: errorMessage,
            model : customer
        });
    });
});

app.post("/customer/delete/:id", (req,res) => {   
    const id = [req.params.id];
    const customer = req.body;
    const sql = "delete from  customer where cusId  = $1";
    pool.query(sql, id, (err, result) => {
        var message = "";
        var errorMessage = ""
        if(err) {
            message = "Error deleting customer.";
            errorMessage = `Error - ${err.message}`;
        } else {
            message = "Customer deleted successfully.";
        };
        res.render("customer/delete", {
            message: message,
            errorMessage: errorMessage,
            model : [customer]
        });
    });   
});


app.get("/import", (req, res) => {
    const sql = "select count(*) numberofcustomers from customer";
    pool.query(sql, (err, result) => {
        var message = "";
        var errorMessage = ""
        var totalRows = "";
        if(err) {
            message = "Error counting the number of customers.";
            errorMessage = `Error - ${err.message}`;
        } else {
            totalRows = result.rows[0].numberofcustomers;
        };
        res.render("import", {
            message: message,
            errorMessage: errorMessage,
            totalRows : totalRows
        });
    });   
 });



 app.post('/import',  upload.single('importFile'), async (req, res) => {
    if(!req.file || Object.keys(req.file).length === 0) {
        message = "Error: Import file not uploaded";
        return res.send(message);
    };
    const buffer = req.file.buffer; 
    const lines = buffer.toString().split(/\r?\n/);
    console.log(lines);
    var numberOfRecordsProcessed = 0;
    var numberOfRecordsInserted = 0;
    var numberOfRecordsNotInsterted = 0;
    var errors = [];

   
    for(line of lines){
        console.log(line);
        customer = line.split(",");
        console.log(customer);           
        const result = await insertCustomer(customer);        
        console.log(result);
        numberOfRecordsProcessed++;
        if(result.trans == "success"){
            numberOfRecordsInserted++;
        }else{
            numberOfRecordsNotInsterted++;
            errors.push(result.msg);
        }
    }

    res.send({
        numberOfRecordsProcessed : numberOfRecordsProcessed , 
        numberOfRecordsInserted : numberOfRecordsInserted,
        numberOfRecordsNotInsterted : numberOfRecordsInserted, errors:errors
    });
    
});


const insertCustomer = (customer) => {
    const sql = "INSERT INTO customer (cusId, cusFname, cusLname, cusState, cusSalesYTD, cusSalesPrev) VALUES ($1, $2, $3, $4, $5, $6)";
    return pool.query(sql, customer)
        .then(res => {
            return {
                trans: "success"
            };
        })
        .catch(err => {
            return {
                trans: "fail", 
                msg: `Customer ID: ${customer[0]} - Error:  ${err.message}`
            };
        });
}