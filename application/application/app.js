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
app.engine('html', swig.renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.post('/search', function (req, res) {
    Q.longStackSupport = true;
    Q.all([Q.ninvoke(client, "get", "artist:" + req.body.query1), Q.ninvoke(client, "get", "artist:" + req.body.query2)])
        .then(function (cached_data) {
            console.log(cached_data);
            return [cached_data, Q.all([spotify.artist.search(req.body.query1),
                spotify.artist.search(req.body.query2)])];
        }).spread(function(cached_data, spotify_search_results){

            console.log(spotify_search_results);
            spotify_search_results = [JSON.parse(spotify_search_results[0]),JSON.parse(spotify_search_results[1])];
            console.log(spotify_search_results);
            console.log("Do we get here?");

            return [cached_data, Q.all([spotify.artist.get_details(spotify_search_results[0].artists.items[0].id),
                spotify.artist.get_details(spotify_search_results[1].artists.items[0].id),
                LastFM.artist.get_info(req.body.query1),
                LastFM.artist.get_info(req.body.query2)])]
        }).spread(function (cached_data, data1) {
            spotify_details1 = JSON.parse(data1[0]);
            spotify_details2 = JSON.parse(data1[1]);
            lastfminfo1 = JSON.parse(data1[2]);
            lastfminfo2 = JSON.parse(data1[3]);
            console.log(arguments);
            console.log("This is my other data:", cached_data);
            console.log("Or maybe this:", data1);
            res.render("result", {
                data1: cached_data[0] || spotify_details1,
                data2: cached_data[1] || spotify_details2,
                data3: lastfminfo1,
                data4: lastfminfo2
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
