const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mysql = require('mysql2');
const alert = require('alert');
const md5 = require("md5");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

let email, name;
const pool = mysql.createConnection({
  host: '121.0.0.1',
  port: 3306,
  user: 'root',
  password: 'SanthoshDB@2',
  database: 'ftb'
});

app.get("/", function(req, res) {
    res.render("login");
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.post("/login", function(req, res) {
    email = req.body.email;
    const password = md5(req.body.password);
    pool.query("select * from users where email = ? and password = ?;", [email, password], function(error, results, fields) {
        if(error) console.log(error);
        console.log(results);
        if(results.length == 0) 
            alert("Check your mail and password");
        else {
            if(results[0].Email == 'admin@gmail.com' && results[0].Name == 'Admin') {
                res.redirect("/admin");
            } else {
                name = results[0].Name;
                res.redirect("/home");
            }
        }
    });
    console.log(req.body.email);
    // console.log(req.body.password);
});

app.get("/signup", function(req, res) {
    res.render("signup");
});

app.post("/signup", function(req, res) {
    email = req.body.email;
    name = req.body.username;
    const password = md5(req.body.password);
    pool.query("insert into users(Email,Name,Password) values ('"+email+"','"+name+"','"+password+"');", function(error, results, fields) {
        if(error) {
            console.log(error);
            alert('This email has already registered.');
        } else {
            res.redirect("/home");
        }
        console.log(results);
    });
});

app.get("/admin", function(req, res) {
    pool.query("select * from flights order by DepatureDate, DepatureTime;", function(error, results, fields) {
        if (error) console.log(error);
        else {
            console.log(results);
            res.render("admin", {flights : results});
        }
    });
});

app.get("/remove/:flightid", function(req, res) {
    const flightid = req.params.flightid;
    pool.query("delete from flights where Flightid = ?", [flightid], function(error, results, fields) {
        if (error) console.log(error);
        else {
            res.redirect("/admin");
        }
    });
});

app.get("/addflight", function(req, res) {
    res.render("addflights");
});

app.post("/addflight", function(req, res) {
    //console.log(req.body);
    pool.query("insert into flights(Flightid,Flightname,Source,Destination,DepatureDate,DepatureTime,ArrivalDate,ArrivalTime,SeatsAvailable,SeatsBooked) values ('"+req.body.flightid+"','"+req.body.flightname+"','"+req.body.from.toUpperCase()+"','"+req.body.to.toUpperCase()+"','"+req.body.ddate+"','"+req.body.dtime+"','"+req.body.adate+"','"+req.body.atime+"','"+req.body.seatsavailable+"','"+req.body.seatsbooked+"');",function(error, results, fields) {
        if (error) alert("Flight with similar id was already there!");
        else res.redirect("/addflight");
    });
});

app.get("/viewbooking", function(req, res) {
    res.render("viewbookings", {content : "", bookings : []});
});

app.post("/viewbooking", function(req, res) {
    console.log(req.body);
    const flightid = req.body.flightid;
    const date = req.body.fdt.split("T")[0];
    const time = req.body.fdt.split("T")[1];
    console.log(flightid + " " + date + " " + time);
    pool.query("select * from bookings where Flightid = ? and BookDate = ? and BookTime >= ?", [flightid,date,time], function(error, results, fields) {
        if (error) console.log(error);
        else {
            console.log(results);
            res.render("viewbookings", {content : "Not Found...", bookings : results});
        }
    });
});

app.get("/home", function(req, res) {
    res.render("home", {Name: name, content: "", flights: []});
});

app.post("/search", function(req, res) {
    const src = req.body.from;
    const dest = req.body.to;
    const date = req.body.date;
    const time = req.body.time;
    // console.log(req.body);
    pool.query("select * from flights where Source = ? and Destination = ? and DepatureDate >= ? and DepatureTime >= ? order by DepatureDate, DepatureTime;",[src,dest,date,time],function(error, results, fields) {
        if (error) console.log(error);
        else {
            console.log(results);
            res.render("home", {Name: name, content: "No flights available for your search!", flights: results});
        }
    });
});

app.get("/mybooking", function(req, res) {
    console.log(email);
    pool.query("select * from flights inner join bookings on bookings.Flightid = flights.Flightid where BookBy = ? order by BookDate, BookTime desc;", [email], function(error, results, fields) {
        if (error) console.log(error);
        else {
            console.log(results);
            res.render("mybooking", {Name: name, content: "You haven't booked any flights!", bookings: results});
        }
    });
});

app.get("/book/:flightid", function(req, res) {
    const flightid = req.params.flightid;
    res.render("booking", {Name: name, flight_id: flightid});
});

app.post("/book", function(req, res) {
    const flightid = req.body.flightid;
    console.log(req.body);
    pool.query("update flights set SeatsAvailable = SeatsAvailable - 1, SeatsBooked = SeatsBooked + 1 where Flightid = ?;", [flightid], function(error, results, fields) {
        if (error) console.log(error);
        else console.log(results);
    });
    const name = req.body.name;
    const gender = req.body.gender;
    const age = req.body.age;
    const d = new Date();
    const date = d.getFullYear()+"-"+d.getMonth()+"-"+d.getDate();
    const time = d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();
    pool.query("insert into bookings(Name,Gender,Age,Flightid,BookDate,BookTime,BookBy) values ('"+name+"','"+gender+"','"+age+"','"+flightid+"','"+date+"','"+time+"','"+email+"');", function(error, results, fields) {
        if (error) console.log(error);
        else res.redirect("/mybooking");
    });
});

app.listen(process.env.PORT || 3000, function() {
    console.log("Server started on port 3000.");
});
