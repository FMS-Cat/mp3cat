let assert = require( "assert" );
let fs = require( "fs" );
let pathlib = require( "path" );

let tagman = require( "./tagman" );

let scanFolder = ( options ) => {
  assert( options.libPath );
  let libPath = options.libPath;
  let relPath = options.relPath || "";
  let inserter = options.inserter || null;
  let imageFunc = options.imageFunc || ( () => {} );
  let callback = options.callback || ( () => {} );

  let path = pathlib.join( libPath, relPath );

  let ents = fs.readdirSync( path );

  let mp3s = [];
  let images = [];

  let iEnt = -1;
  let scanEnt = () => {
    iEnt ++;

    if ( ents.length === iEnt ) {
      let inserterMp3s = mp3s.map( ( mp3Path ) => {
        return tagman.read( libPath, mp3Path );
      } );

      if ( inserter ) {
        inserter( inserterMp3s, images, () => {
          callback();
        } );
      } else {
        callback();
      }

      return;
    }

    let ent = ents[ iEnt ];

    let entPath = pathlib.join( path, ent );
    let entRelPath = pathlib.join( relPath, ent );
    let isDir = fs.statSync( entPath ).isDirectory();

    if ( pathlib.basename( entRelPath )[ 0 ] === "." ) {
      console.log( "🔞 Ignored: " + entRelPath );
      scanEnt();
    } else if ( isDir ) {
      scanFolder( {
        libPath: libPath,
        relPath: entRelPath,
        inserter: inserter,
        callback: () => scanEnt()
      } );
    } else if ( pathlib.extname( ent ) === ".mp3" ) {
      mp3s.push( entRelPath );
      scanEnt();
    } else if (
      pathlib.extname( ent ) === ".jpg" ||
      pathlib.extname( ent ) === ".png" ||
      pathlib.extname( ent ) === ".gif" ||
      pathlib.extname( ent ) === ".bmp"
    ) {
      images.push( entRelPath );
      scanEnt();
    } else {
      console.log( "🌴 Warning: " + entRelPath );
      scanEnt();
    }
  };

  scanEnt();
};

module.exports = scanFolder;
