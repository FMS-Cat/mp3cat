let fs = require( "fs" );

let recursiveUnlink = ( _path, _empty ) => {
  if ( fs.existsSync( _path ) ) {
    fs.readdirSync( _path ).map( ( _file ) => {
      let filePath = _path + '/' + _file;
      if ( fs.lstatSync( filePath ).isDirectory() ) {
        recursiveUnlink( filePath, false );
      } else {
        fs.unlinkSync( filePath );
      }
    } );

    if ( !_empty ) {
      fs.rmdirSync( _path );
    }
  }
};

module.exports = recursiveUnlink;