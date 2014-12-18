/**
 * Created by Chrille on 2014-12-18.
 */
var express = require('express');
var router = express.Router();
var spotify = require('../settings/settings').Spotify;

/* GET users listing. */

router.get('/:trackname', function(req, res, next){
   if(req.params.trackname){
        spotify.search(req.params.artistname, "track", function(result){
            var stringresult = result;
            result = JSON.parse(result);
            res.render("track", {result: result, stringresult: stringresult});
        });
   }
    else {
       next();
   }
});
router.get('/', function(req, res) {
    res.render('track', {});
});

module.exports = router;
