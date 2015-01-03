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

var routes = require('./routes/index');
var users = require('./routes/users');
var settings = require('./settings/settings');
var artists = require('./routes/artists');
var tracks = require('./routes/tracks');
var albums = require('./routes/albums');

var app = express();

var spotify = settings.Spotify;
var LastFM = settings.LastFM;

client.on("error", function (err) {
    console.log("Error " + err);
});
client.on("connect", function () {
    console.log("Connected!");
});

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
var render_json_data = function (res, data) {
    data = data.map(JSON.parse);
    res.render("result2", {data: data});
};
var send_bad_request_response = function(res, message){
    res.status(400).send({
        error: "400 Bad Request",
        message: message
    });
}
app.post('/search2', function (req, res) {
    var data_expiry_time = 10000;
    var query_string = req.body.query.toLowerCase().trim();

    if(query_string == ""){
        send_bad_request_response("The query must contain something, it can't be empty");
        return;
    }

    console.log("Going into the search2 function");

    Q.longStackSupport = true;

    console.log("body:", query_string);

    setTimeout(function(){
        client.lpush("latestsearches", req.body.query, redis.print);
    },0);

    Q.ninvoke(client, "get", "artist:" + query_string).
        then(function (data) {
            console.log(data);

            if (data && data.length) {
                console.log("Retrieved data from the cache");

                return [data, []];
            } else {
                console.log("Doing the promiserinos");
                return [[], Q.allSettled([spotify.artist.get_details_without_artist_before(query_string), LastFM.artist.get_info(query_string)])]
            }
        }, function (error) {
            console.log("Well shit: ", error);
        }).
        spread(function (cached_data, retrieved_data) {
            console.log("Inside the next step");
            if (cached_data.length) {
                console.log("Rendering the cached data");

                res.render("result2", {data: JSON.parse(cached_data)});
            } else {
                console.log(typeof retrieved_data);
                console.log(retrieved_data);

                //The values in the fulfilled or rejected promises are stringified
                //so we need to parse them to get usable values

                if(retrieved_data[0].state === "fulfilled"){
                    console.log("Did it throw here?");
                    retrieved_data[0].value = JSON.parse(retrieved_data[0].value);
                }
                if(retrieved_data[1].state === "fulfilled"){
                    console.log("Or here?");
                    retrieved_data[1].value = JSON.parse(retrieved_data[1].value);
                }

                console.log("Sending new data");
                res.render("result2", {data: retrieved_data});

                console.log("Saving the data to the cache");

                //JSON.stringify will block, so we timeout to get better percieved performance
                setTimeout(function () {
                    client.set("artist:" + query_string, JSON.stringify(retrieved_data), redis.print);
                    client.expire("artist:" + query_string, data_expiry_time, redis.print);
                }, 0);
            }
        }, function (error) {
            console.log("Error", error);
        }).
        catch(function (error) {
            console.log("An error was thrown.");
            console.log(error);
            console.log(error.stack());
        });
});
app.post('/search', function (req, res) {
    Q.longStackSupport = true;
    if (req.body.query1 == "" || req.body.query2 == "") {
        res.status(400).send({
            error: "400 Bad Request",
            message: "You provided only 1 or even 0 of the required 2 names. As such we can't go on with the query."
        });
        return;
    }
    Q.spread([Q.ninvoke(client, "get", "artist:" + req.body.query1), Q.ninvoke(client, "get", "artist:" + req.body.query2)], function (query1, query2) {
        //console.log(query1, query2);
        return [[query1, query2], Q.all([spotify.artist.search(req.body.query1),
            spotify.artist.search(req.body.query2)])];
    }).spread(function (cached_data, spotify_search_results) {

        //console.log(spotify_search_results);
        spotify_search_results = [JSON.parse(spotify_search_results[0]), JSON.parse(spotify_search_results[1])];
        //console.log(spotify_search_results);
        //console.log("Do we get here?");

        return [cached_data, Q.all([spotify.artist.get_details(spotify_search_results[0].artists.items[0].id),
            spotify.artist.get_details(spotify_search_results[1].artists.items[0].id),
            LastFM.artist.get_info(req.body.query1),
            LastFM.artist.get_info(req.body.query2)])]
    }).spread(function (cached_data, data1) {
        spotify_details1 = JSON.parse(data1[0]);
        spotify_details2 = JSON.parse(data1[1]);
        lastfminfo1 = JSON.parse(data1[2]);
        lastfminfo2 = JSON.parse(data1[3]);
        //console.log(arguments);
        //console.log("This is my other data:", cached_data);
        //console.log("Or maybe this:", data1);
        console.log("Is this where it fails?");
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
