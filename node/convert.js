let ffmpeg = require( "fluent-ffmpeg" );

let convertMp3 = ( path, callback ) => {
  let command = ffmpeg( path )
    .audioCodec( "libmp3lame" )
    .audioBitrate( 320 )
    .on( "end", () => {
      callback( null );
    } )
    .on( "error", ( error ) => {
      callback( error );
    } )
    .save( path + ".mp3" );
};

let convertJpg = ( path, callback ) => {
  let command = ffmpeg( path )
    .size( "500x?" )
    .outputOptions( "-q", "1", "-pix_fmt", "yuvj420p" )
    .on( "end", () => {
      callback( null );
    } )
    .on( "error", ( error ) => {
      callback( error );
    } )
    .save( path + ".jpg" );
};

module.exports = {
  mp3: convertMp3,
  jpg: convertJpg
};