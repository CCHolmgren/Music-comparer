/**
 * Created by Chrille on 2014-12-18.
 */
var express = require('express');
var router = express.Router();
var spotify = require('../settings/settings').Spotify;
var redis = require('redis'),
    client = redis.createClient();

/* GET users listing. */
client.on("connect", function () {
    console.log("Connected!");
});
client.on("error", function (err) {
    console.log("Error " + err);
});

router.get('/:artistname', function (req, res, next) {
    var artistname = req.params["artistname"];

    if (artistname) {
        client.get("artist:"+artistname, function (err, result) {
            console.log(result);
            if (err) {
                console.log("There was an error: ",err);
            } else {
                console.log("Result: ", result);
                if (result) {
                    client.ttl("artist:"+artistname, redis.print);

                    res.render("artist", {
                        result: JSON.parse(result),
                        stringresult: result
                    });

                } else {
                    spotify.artist.search(artistname, function (result) {
                        console.log(result);
                        var stringresult = result;

                        result = JSON.parse(result);
                        res.render("artist", {result: result, stringresult: stringresult});

                        console.log("Saving that shit to the server");

                        client.set("artist:"+artistname, JSON.stringify(result), redis.print);
                        client.expire("artist:"+artistname, 1000);
                    });
                }
            }
        });
    }
    else {
        next();
    }
});
/* GET users listing. */
router.get('/', function(req, res) {
    res.render('artist', {});
});

module.exports = router;
