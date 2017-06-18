// ref: http://stackoverflow.com/questions/24976123/streaming-a-video-file-to-an-html5-video-player-with-node-js-so-that-the-video-c

let fs = require( "fs" );
let pathlib = require( "path" );

let libraryPath;

let setup = ( path ) => {
  libraryPath = path;
};

let use = ( req, res ) => {
  let path = decodeURI( req.path );
  path = pathlib.join( libraryPath, path );

  if ( !( /\.mp3/.test( path ) ) ) {
    return res.status( 400 ).send( "The file is not mp3" );
  }

  fs.stat( path, ( _error, _stat ) => {
    if ( _error ) {
      if ( _error.code === "ENOENT" ) {
        return res.status( 404 ).send( "No such file or directory" );
      } else {
        console.error( _error );
        return res.status( 500 ).send( "Something went wrong" );
      }
    }

    if ( _stat.isDirectory() ) {
      return res.status( 400 ).send( "Given path is not file" );
    }

    let range = req.headers.range;
    if ( !range ) {
      return res.status( 416 ).send( "Range is not defined" );
    }

    let positions = range.replace( /bytes=/, "" ).split( "-" );
    let start = parseInt( positions[ 0 ] );
    let total = _stat.size;
    let end = positions[ 1 ] ? parseInt( positions[ 1 ] ) : total - 1;
    let size = ( end - start ) + 1;

    res.status( 206 ).set( {
      "Content-Range": "bytes " + start + "-" + end + "/" + total,
      "Accept-Ranges": "bytes",
      "Content-Length": size,
      "Content-Type": "audio/mpeg"
    } );

    let stream = fs.createReadStream( path, { start: start, end: end } )
    .on( "open", () => {
      stream.pipe( res );
    } )
    .on( "error", ( _error ) => {
      res.status( 500 ).send( "Something went wrong" );
    } );

  } );
};

module.exports = {
  setup: setup,
  use: use
};