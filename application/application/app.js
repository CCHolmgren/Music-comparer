var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var redis = require('redis'),
    client = redis.createClient();
var Q = require("q");
var swig = require("swig");
var app = express();
var crypto = require("crypto");
var compress = require('compression')();
var session = require("express-session");
var RedisStore = require("connect-redis")(session);

var routes = require('./routes/index');
var users = require('./routes/users');
var settings = require('./settings/settings');
var artists = require('./routes/artists');
var tracks = require('./routes/tracks');
var albums = require('./routes/albums');
var api = require('./routes/api');

var spotify = settings.Spotify;
var LastFM = settings.LastFM;
var _spotify = settings._Spotify;

// view engine setup
app.engine('html', swig.renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.set("view cache", false);

swig.setDefaults({cache: true});

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.use(compress);

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.get("/cache.manifest", function (req, res) {
    res.header("Content-type", "text/cache-manifest");
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.join(__dirname, "public", "cache.manifest"));
});
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({
    secret: "this_is_my_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 3600000000
    },
    store: new RedisStore({client: client, host: "127.0.0.1", port: 6379})
}));
app.use(express.static(path.join(__dirname, 'public')));

app.get("/logout", function (req, res) {
    delete req.session.loggedin;
    res.redirect("/");
});
app.get("/login", function (req, res) {
    if (req.session.token && req.session.username) {
        req.session.loggedin = true;
        return res.redirect("/application");
    } else {
        return res.render("login", {title: "Music Comparer"});
    }
});
app.get('/callback', function (req, res) {
    var token = req.query.token || "";
    if (!token) {
        res.status("400");
        res.render("error", {
            title: "Music Comparer",
            error: "400 Bad Request",
            message: "The request did not contain a token and as such cannot be handled."
        });
    }
    console.log("Going to get the token");
    LastFM.auth.getSession(token).then(function (result) {
        console.log(arguments);
        var key = JSON.parse(result);
        console.log(key);
        client.set(key.session.name, JSON.stringify(key), redis.print);
        req.session.regenerate(function () {
            req.session.loggedin = true;
            req.session.username = key.session.name;
            req.session.token = key.session.key;
            res.redirect("/application");
        });
    });
});
app.use('/application', routes);
app.use('/api', api);

app.use("/", function (req, res) {
    console.log(req.session);
    res.render("layout", {
        title: "Music Comparer",
        authenticated: req.session.loggedin,
        username: req.session.username
    });
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
