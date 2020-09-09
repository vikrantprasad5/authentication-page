//jshint esversion:6
//require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose"); 
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
})); 

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false 
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-vikrant:test123@cluster0.lkfg4.mongodb.net/userDataDB", {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

// (everytime new object is created from mongoose schema object)
const userSchema= new mongoose.Schema({
  email:String,
  password:String,
  secret:String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
  res.render("home");
});


app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
});

app.post("/submit",function(req,res){
  const submittedSecret = req.body.secret;
  console.log(req.user.id);
  User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    }else{
      foundUser.secret = submittedSecret;
      foundUser.save(function(){
        res.redirect("/secrets");
      });
    }
  })
});

app.get("/login",function(req,res){
  res.render("login");
});

app.post("/login",function(req,res){
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });

    req.login(user, function(err){
      if(err){
        console.log(err);
        
      }
      else{
        passport.authenticate("local")(req,res,function(){
          res.redirect("/secrets");
        });
      }
    })
    res.redirect("/secrets");
  });


app.get("/register",function(req,res){
  res.render("register");
});

app.get("/secrets",function(req,res){

  if(req.isAuthenticated()){
    User.find({"secret":{$ne:null}}, function(err, foundUsers){
      if(err){
        console.log(err);
      }
      else{
        if(foundUsers){
          res.render("secrets",{usersWithSecrets:foundUsers});
        }
      }
    })
  }else{
    res.redirect("/login");
  } 
});

app.post("/register",function(req,res){
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) { 
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect('/');
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
} 
app.listen(port, function() {
    console.log("Server has started at port 3000");
  });