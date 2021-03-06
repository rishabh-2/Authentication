require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');

const googleStrategy = require("passport-google-oauth20");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "Long Secret String.",
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
    useUnifiedTopology: true,
    useNewUrlParser: true
});

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://www.example.com/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.route("/")
    .get(function (req, res) {
        res.render("home");
    });

app.route("/login")
    .get(function (req, res) {
        res.render("login");
    })
    .post(function (req, res) {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        req.login(user, function (err) {
            if (err) {
                console.log(err);

            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                });
            }
        });

    });


app.route("/register")
    .get(function (req, res) {
        res.render("register");
    })

    .post(function (req, res) {
        User.register({
            username: req.body.username
        }, req.body.password, function (err) {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                })
            }
        });

    });

app.route("/secrets")
    .get(function (req, res) {
        if (req.isAuthenticated()) {
            res.render("secrets");
        } else {
            res.render("login");
        }
    });

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});


app.listen(3000, function (req, res) {
    console.log("Server started on port 3000");

});