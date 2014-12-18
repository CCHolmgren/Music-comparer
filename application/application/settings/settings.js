/**
 * Created by Chrille on 2014-12-18.
 */
var request = require("request");


var Spotify = {
    client_id: "d879c5ab042e48b48e903324096473ae",
    client_secret: "c843dada051648dfae377df0f453e464",
    artist: {
        search: function(query, callback){
            request("https://api.spotify.com/v1/search?q=" + query + "&type=artist", function(error, response, body){
                callback(body);
            });
        }
    },
    track: {
        search: function(query, callback){
            request("https://api.spotify.com/v1/search?q=" + query + "&type=track", function(error, response, body){
                callback(body);
            });
        }
    },
    album: {
        search: function(query, callback){
            request("https://api.spotify.com/v1/search?q=" + query + "&type=album", function(error, response, body){
                callback(body);
            });
        }
    },
    playlist: {
        search: function(query, callback){
            request("https://api.spotify.com/v1/search?q=" + query + "&type=playlist", function(error, response, body){
                callback(body);
            });
        }
    },
    search: function(query, type, callback){
        request("https://api.spotify.com/v1/search?q=" + query + "&type="+type, function(error, response, body){
            callback(body);
        });
    }
};

module.exports.api_keys = {
    lastfm: lastfm,
    spotify: spotify
};
module.exports.Spotify = Spotify;