/**
 * Created by Chrille on 2014-12-18.
 */
var request = require("request");

var Spotify = {
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

module.exports.Spotify = Spotify;