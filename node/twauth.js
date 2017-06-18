const OAuth = require( "oauth" );

module.exports = ( options ) => {
  if ( !options ) { throw "twauth: You must set options"; }
  
  if ( !options.consumerKey ) { throw "twauth: you must set options.consumerKey"; }
  if ( !options.consumerSecret ) { throw "twauth: you must set options.consumerSecret"; }
  if ( !options.callbackURL ) { throw "twauth: you must set options.callbackURL"; }
  if ( !options.users ) { throw "twauth: you must set options.users"; }

  let oauth = new OAuth.OAuth(
    "https://api.twitter.com/oauth/request_token",
    "https://api.twitter.com/oauth/access_token",
    options.consumerKey,
    options.consumerSecret,
    "1.0A",
    options.callbackURL,
    "HMAC-SHA1"
  );

  let users = options.users;
  let localPermission = options.localPermission ? options.localPermission : {};

  return {
    check: ( key ) => {
      return ( req, res, next ) => {
        let name = req.session.twauthName;

        let isLocalAccess = req.ip === "::1" || req.ip.substring( 0, 16 ) === "::ffff:192.168.0";
        if ( isLocalAccess ) {
          if ( !localPermission[ key ] ) {
            res.send( "You are not mighty enough to do this", 400 );
            return;
          }
        } else {
          if ( !name ) {
            console.log( "Warning: suspective access from " + req.ip );
            res.redirect( options.meme || "http://example.com/" );
            return;
          }

          let user = twitterUsers[ name ];
          if ( !user[ key ] ) {
            res.send( "You are not mighty enough to do this", 400 );
            return;
          }
        }
          
        next();
      };
    },

    login: ( req, res, next ) => {
      if ( !oauth ) { throw "You must do initOAuth at first"; }

      if ( req.session.twauthName ) {
        next();
        return;
      }

      oauth.getOAuthRequestToken( ( _error, _token, _secret, _results ) => {
        if ( _error ) {
          console.error( _error );
          res.send( "Error: Could not retreive Twitter OAuth request token", 500 );
          return;
        }

        req.session.twauthReqToken = _token;
        req.session.twauthReqSecret = _secret;
        res.redirect( "https://twitter.com/oauth/authorize?oauth_token=" + _token );
      } );
    },

    callback: ( req, res, next ) => {
      if ( !oauth ) { throw "You must do initOAuth at first"; }

      oauth.getOAuthAccessToken(
        req.session.twauthReqToken,
        req.session.twauthReqSecret,
        req.query.oauth_verifier,
        ( _error, _token, _secret, results ) => {
          if ( _error ) {
            console.error( _error );
            res.send( "Error: Could not retreive Twitter OAuth access token", 500 );
            return;
          }
          
          req.session.twauthToken = _token;
          req.session.twauthSecret = _secret;

          oauth.get(
            "https://api.twitter.com/1.1/account/verify_credentials.json",
            req.session.twauthToken,
            req.session.twauthSecret,
            ( _error, _data, _res ) => {
              if ( _error ) {
                console.error( _error );
                res.send( "Error: Something went wrong while verifying Twitter OAuth", 500 );
                return;
              }

              let data = JSON.parse( _data );
              req.session.twauthName = ( data.screen_name ).toLowerCase();
              next();
            }
          ); 
        }
      );
    }
  };
};