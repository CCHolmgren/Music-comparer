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

var routes = require('./routes/index');
var users = require('./routes/users');
var settings = require('./settings/settings');
var artists = require('./routes/artists');
var tracks = require('./routes/tracks');
var albums = require('./routes/albums');
var api = require('./routes/api');

var spotify = settings.Spotify;
var LastFM = settings.LastFM;

// view engine setup
app.engine('html', swig.renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.set("view cache", false);

swig.setDefaults({cache: false});
swig.setFilter("eval", function (input) {
    return eval(input);
});
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.get("/manifest.manifest", function (req, res) {
    res.header("Content-type", "text/cache-manifest");
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.join(__dirname, "public", "manifest.manifest"));
});
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.get('/callback', function(req, res){
    var token = req.query.token || "";
    if(!token){
        res.send("Error, did not contain a token");
    }
    console.log("Going to get the token");
    LastFM.auth.getSession(token).then(function(){
        console.log(arguments);
    });
});
app.use('/api', api);
app.use('/users', users);
app.use('/artists', artists);
app.use('/tracks', tracks);
app.use('/albums', albums);

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
