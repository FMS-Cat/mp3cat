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

let convertPng = ( path, callback ) => {
  let command = ffmpeg( path )
    .size( "500x?" )
    .outputOptions( "-pix_fmt", "yuvj420p" )
    .on( "end", () => {
      callback( null );
    } )
    .on( "error", ( error ) => {
      callback( error );
    } )
    .save( path + ".png" );
};

let convertThumb = ( path, out, callback ) => {
  let command = ffmpeg( path )
    .size( "100x?" )
    .outputOptions( "-q", "2", "-pix_fmt", "yuvj420p" )
    .on( "end", () => {
      callback( null );
    } )
    .on( "error", ( error ) => {
      callback( error );
    } )
    .save( out );
};

module.exports = {
  mp3: convertMp3,
  png: convertPng,
  thumb: convertThumb
};