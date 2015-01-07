/**
 * Created by Chrille on 2014-12-18.
 */
var lastfm = {
    api_key: "88608a3b670729c1f85fe44b231aff72",
    secret: "7aaaaacbca08df267e30c33a9a0f2a75"
};
var spotify = {
    // https://api.spotify.com/v1/search Search for an album, track, artist or playlist
    // This generates stuff that we can cache
    // https://developer.spotify.com/web-api/artist-endpoints/
    // https://developer.spotify.com/web-api/album-endpoints/
    // https://developer.spotify.com/web-api/playlist-endpoints/
    // https://developer.spotify.com/web-api/track-endpoints/
    // Endpoints that we can use to get more information about things, such as
    client_id: "d879c5ab042e48b48e903324096473ae",
    client_secret: "49e4ca0a2eaf4b7d861406e5295354d5"
};

module.exports.api_keys = {
    lastfm: lastfm,
    spotify: spotify
};