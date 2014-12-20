var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var redis = require('redis'),
    client = redis.createClient();
var Q = require("q");

client.on("error", function (err) {
    console.log("Error " + err);
});

var routes = require('./routes/index');
var users = require('./routes/users');
var settings = require('./settings/settings');
var artists = require('./routes/artists');
var tracks = require('./routes/tracks');
var albums = require('./routes/albums');

var app = express();


var spotify = settings.Spotify;
var LastFM = settings.LastFM;

/*spotify.artist.search("Muse", function(result){
 console.log(result);
 });*/
/*spotify.search("Muse", "artist", function(result){
 console.log(result);
 });*/

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.post('/search', function (req, res) {
    //Q.longStackSupport = true;
    Q.all([Q.ninvoke(client, "get", "artist:" + req.body.query1), Q.ninvoke(client, "get", "artist:" + req.body.query2)])
        .then(function (data) {
            if (data) {
                return [data, Q.all([LastFM.artist.get_info(req.body.query1),
                    LastFM.artist.get_info(req.body.query2)])];
            } else {
                return [data, Q.all([spotify.artist.search(req.body.query1),
                    spotify.artist.search(req.body.query2),
                    LastFM.artist.get_info(req.body.query1),
                    LastFM.artist.get_info(req.body.query2)])];
            }
        }).spread(function (data, data1) {
            console.log("This is my other data:", data);
            console.log("Or maybe this:", data1);
            res.render("result", {
                data1: JSON.parse(data[0] || data1[0]),
                data2: JSON.parse(data[1] || data1[1]),
                data3: data1[2],
                data4: data1[3]
            });
        }).fail(function (error) {
            throw new Error(error);
        }).done();
    /*client.get("artist:" + req.body.query1, function (err, result) {
     if (result) {
     client.get("artist:" + req.body.query2, function (err2, result2) {

     if (result2) {
     res.render("result", {data1: result, data2: result2});
     } else {
     spotify.artist.search(req.body.query2, function (body) {
     body = JSON.parse(body);
     spotify.artist.get_details(body.artist.items[0].id, function(body){
     othersomething = body;
     console.log(req.body);
     console.log(somethingother, result2);
     res.render("result", {data1: somethingother, data2: othersomething});
     });

     });
     }

     });
     }*/// else {
    /*spotify.artist.search(req.body.query1, function (artists) {
     artists = JSON.parse(artists);
     console.log(artists);
     somethingother = artists.artists.items[0];
     //client.get("artist:" + req.body.query2, function (err2, result2) {

     //if (result2) {
     //    res.render("result", {data1: result, data2: result2});
     //} else {
     spotify.artist.search(req.body.query2, function (artistsearch) {
     console.log(artistsearch);
     body1 = JSON.parse(artistsearch);
     spotify.artist.get_details(body1.artists.items[0].id, function (details) {
     console.log("Details: ", details);
     LastFM.artist.get_info(JSON.parse(details).name, function (error, response, body) {
     othersomething = JSON.parse(details);
     console.log(req.body);
     console.log(somethingother);
     res.render("result", {data1: somethingother, data2: othersomething, othersomething_data: body});
     });
     });

     });
     //}
     /*if (!result2) {
     spotify.artist.search(req.body.query2, function (body) {
     body = JSON.parse(body);
     othersomething = body.artists.items[0];
     console.log(req.body);
     console.log(somethingother, result2);
     res.render("result", {data1: somethingother, data2: othersomething});
     });
     }*/

    //});
    //});
    /*}
     });*/

});

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
