let assert = require( "assert" );

let fs = require( "fs" );
let pathlib = require( "path" );
let taglib = require( "taglib2" );

let convert = require( "./convert" );


let black = {
  mime: "image/gif",
  binary: new Buffer( "R0lGODlhAQABAIAAAAAAAAAAACwAAAAAAQABAAACAkQBADs=", "base64" )
};

let read = ( libPath, mp3Path ) => {
  let mp3Fullpath = pathlib.join( libPath, mp3Path );
  assert( fs.existsSync( mp3Fullpath ) );
  assert( !fs.statSync( mp3Fullpath ).isDirectory() );

  let tag = taglib.readTagsSync( mp3Fullpath );

  return format( {
    path: mp3Path,
    dir: pathlib.dirname( mp3Path ),
    file: pathlib.basename( mp3Path ),
    artist: tag.artist,
    title: tag.title,
    album: tag.album,
    albumartist: tag.albumartist,
    composer: tag.composer,
    comment: tag.comment,
    bpm: tag.bpm,
    year: tag.year,
    disc: tag.discnumber,
    track: tag.tracknumber,
    length: tag.length
  } );
};

let format = ( file ) => {
  let json = {};

  try {
    json = JSON.parse( file.comment );
    if ( !json ) { json = {}; }
  } catch ( exception ) {
    // do nothing
  }

  return {
    json: json,
    path: file.path,
    dir: file.dir,
    file: file.file,
    artist: file.artist,
    title: file.title ? file.title : file.file,
    album: file.album,
    albumartist: file.albumartist,
    composer: file.composer,
    comment: file.comment,
    bpm: file.bpm ? parseFloat( file.bpm ) : null,
    year: file.year ? parseInt( file.year ) : null,
    disc: file.disc ? parseInt( file.disc ) : null,
    track: file.track ? parseInt( file.track ) : null,
    length: file.length
  };
};

let write = ( libPath, file ) => {
  taglib.writeTagsSync( pathlib.join( libPath, file.path ), {
    artist: file.artist || "",
    title: file.title || "",
    tracknumber: file.track ? parseInt( file.track ) : "",
    discnumber: file.disc ? parseInt( file.disc ) : "",
    bpm: file.bpm ? parseFloat( file.bpm ) : "",
    comment: file.comment || "",
    album: file.album || "",
    albumartist: file.albumartist || "",
    composer: file.composer || "",
    year: file.year ? parseInt( file.year ) : ""
  } );
};

let getCover = ( libPath, mp3Path ) => {
  let mp3Fullpath = pathlib.join( libPath, mp3Path );
  if (
    !fs.existsSync( mp3Fullpath ) ||
    fs.statSync( mp3Fullpath ).isDirectory()
  ) {
    return black;
  }

  let tag = taglib.readTagsSync( mp3Fullpath );

  if ( tag.pictures && tag.pictures[ 0 ] ) {
    return {
      mime: tag.pictures[ 0 ].mimetype,
      binary: tag.pictures[ 0 ].picture
    }
  } else {
    return black;
  }
};

let setCover = ( libPath, mp3Path, imagePath ) => {
  let mp3Fullpath = pathlib.join( libPath, mp3Path );
  if (
    !fs.existsSync( mp3Fullpath ) ||
    fs.statSync( mp3Fullpath ).isDirectory()
  ) {
    return "setCover: No such mp3: " + mp3Path;
  }

  taglib.writeTagsSync( mp3Fullpath, {
    pictures: [
      {
        "mimetype": "image/jpeg",
        "picture": fs.readFileSync( imagePath )
      }
    ]
  } );
};

module.exports = {
  read: read,
  format: format,
  write: write,
  getCover: getCover,
  setCover: setCover
};