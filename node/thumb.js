let pathlib = require( "path" );
let fs = require( "fs" );
let recursiveUnlink = require( "./recursiveunlink" );

let crypto = require( "crypto" );

let convert = require( "./convert" );

let empty = ( libPath ) => {
  let dotMp3catPath = pathlib.join( libPath, ".mp3cat" );
  let thumbPath = pathlib.join( libPath, ".mp3cat", "thumb" );

  if ( fs.existsSync( thumbPath ) ) {
    recursiveUnlink( thumbPath, true );
  } else {
    if ( fs.existsSync( dotMp3catPath ) ) {
      fs.mkdirSync( thumbPath );
    } else {
      fs.mkdirSync( dotMp3catPath );
      fs.mkdirSync( thumbPath );
    }
  }
};

let add = ( libPath, mp3Path, coverPath, callback ) => {
  let thumbPath = pathlib.join( libPath, ".mp3cat", "thumb" );
  
  let hasher = crypto.createHash( "sha512" );
  hasher.update( fs.readFileSync( coverPath ) );
  let hash = hasher.digest( "hex" );

  let outPath = pathlib.join( thumbPath, hash ) + ".jpg";

  convert.thumb( coverPath, outPath, ( error ) => {
    if ( error ) {
      fs.unlinkSync( outPath );
      callback( error );
      console.log( error );
    }
    
    callback( null, hash );
  } );
};

module.exports = {
  empty: empty,
  add: add
};