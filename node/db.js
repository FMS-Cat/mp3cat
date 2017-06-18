let assert = require( "assert" );
let MongoClient = require( "mongodb" ).MongoClient;

let scanFolder = require( "./scan" );

let mongoUrl = "mongodb://localhost:27017/mp3cat";

let queryParser = require( "./query" );

let filenameSanitizer = require( "./filename" );
let fs = require( "fs" );
let pathlib = require( "path" );

let tagman = require( "./tagman" );

let db;
let coll;

let start = ( callback ) => {
  MongoClient.connect( mongoUrl, ( error, _db ) => {
    assert.equal( error, null );
    db = _db;
    coll = db.collection( "music" );

    if ( typeof callback === "function" ) { callback(); }
  } );
};

let drop = () => {
  coll.drop();
};

let scan = ( path, callback ) => {
  console.log( "Scanning..." );

  scanFolder( {
    libPath: path,
    inserter: ( mp3s, images, insCallback ) => {
      let count = mp3s.length;
      let done = () => {
        count --;
        if ( count === 0 ) { insCallback(); }
      };
      if ( count === 0 ) { count = 1; done(); }

      mp3s.map( ( mp3 ) => {
        console.log( "MP3 found: " + mp3.path );

        coll.update(
          { path: mp3.path },
          { $set: mp3 },
          { upsert: true },
          ( error ) => {
            console.log( "Scanned: " + mp3.path );
            done();
          }
        );
      } );

      images.map( ( image ) => {
        console.log( "Image found: " + image );
      } );
    },
    callback: callback
  } );
};

let genDirname = ( file ) => {
  let dirarray = [];

  if ( file.albumartist ) { dirarray.push( file.albumartist ); }
  if ( file.album ) { dirarray.push( file.album ); }
  if ( file.composer ) { dirarray.push( file.composer ); }

  let dirname = filenameSanitizer( dirarray.join( " - " ) );

  return dirname;
};

let genFilename = ( file ) => {
  let filearray = [];

  if ( file.disc && file.track ) {
    filearray.push( parseInt( file.disc ) + "-" + parseInt( file.track ) )
  } else if ( file.track ) {
    filearray.push( parseInt( file.track ) );
  }

  if ( file.artist ) { filearray.push( file.artist ); }
  if ( file.title ) { filearray.push( file.title ); }
  if ( file.album ) { filearray.push( file.album ); }

  let filename = filenameSanitizer( filearray.join( " - " ) );
  filename = ( filename ? filename + ".mp3" : file.file );

  return filename;
};

let renameScan = ( oldPath, newPath, callback ) => {
  console.log( "Renaming..." );
  console.log( "New path: " + newPath );

  if( !fs.existsSync( newPath ) ) {
    fs.mkdirSync( newPath );
  }

  scanFolder( {
    libPath: oldPath,
    inserter: ( mp3s, images, insCallback ) => {
      if ( mp3s.length === 0 ) {
        insCallback(); return;
      }

      let valid = mp3s.every( ( mp3 ) => {
        return (
          mp3s[ 0 ].albumartist === mp3.albumartist &&
          mp3s[ 0 ].album === mp3.album &&
          mp3s[ 0 ].composer === mp3.composer
        );
      } );
      if ( !valid ) {
        console.log( "Aborted, different albums in same dir: " + mp3s[ 0 ].dir );
        insCallback(); return;
      }

      let dirname = genDirname( mp3s[ 0 ] );
      if ( dirname ) {
        if ( !fs.existsSync( pathlib.join( newPath, dirname ) ) ) {
          fs.mkdirSync( pathlib.join( newPath, dirname ) );
        } else {
          console.log( "Aborted, dir already existed: " + pathlib.join( newPath, dirname ) );
          insCallback(); return;
        }
      }
      console.log( "Created: " + pathlib.join( newPath, dirname ) );

      let count = mp3s.length + images.length;
      let done = () => {
        count --;
        if ( count === 0 ) { insCallback(); }
      };

      mp3s.map( ( mp3 ) => {
        let filename = genFilename( mp3 );
        if ( !fs.existsSync( pathlib.join( newPath, dirname, filename ) ) ) {
          fs.renameSync(
            pathlib.join( oldPath, mp3.path ),
            pathlib.join( newPath, dirname, filename )
          );
          console.log( "Renamed: " + pathlib.join( newPath, dirname, filename ) );

          mp3.path = pathlib.join( dirname, filename );
          mp3.dir = dirname;
          mp3.file = filename;
          coll.update(
            { path: mp3.path },
            { $set: mp3 },
            { upsert: true },
            () => { done(); }
          )
        } else {
          console.log( "Aborted, file already existed: " + pathlib.join( newPath, dirname, filename ) );
          done();
        }
      } );

      images.map( ( image ) => {
        if ( !fs.existsSync( pathlib.join( newPath, dirname, pathlib.basename( image ) ) ) ) {
          fs.renameSync(
            pathlib.join( oldPath, image ),
            pathlib.join( newPath, dirname, pathlib.basename( image ) )
          );
          console.log( "Renamed: " + pathlib.join( newPath, dirname, pathlib.basename( image ) ) );
          done();
        } else {
          console.log( "Aborted, file already existed: " + pathlib.join( newPath, dirname, pathlib.basename( image ) ) );
          done();
        }
      } );
    },
    callback: () => {
      callback();
    }
  } );
};

let find = ( query, sort, limit, skip, callback ) => {
  let q = queryParser( query );
  sort = sort || "artist,title,album";
  sort = sort.split( "," );

  let sortObj = {};
  sort.map( ( attr ) => {
    let dir = 1;
    if ( attr[ 0 ] === "-" ) {
      attr = attr.substring( 1 );
      dir = -1;
    }
    sortObj[ attr ] = dir;
    sortObj[ "json." + attr ] = dir;
  } );

  limit = parseInt( limit );
  if ( isNaN( limit ) ) { limit = 100; }

  skip = parseInt( skip );
  if ( isNaN( skip ) ) { skip = 0; }

  coll.find( q, {} ).sort( sortObj ).skip( skip ).limit( limit ).toArray( ( error, items ) => {
    assert.equal( error, null );
    callback( items );
  } );
};

let count = ( query, limit, skip, callback ) => {
  let q = queryParser( query );

  limit = parseInt( limit );
  if ( isNaN( limit ) ) { limit = 0; }
  skip = parseInt( skip );
  if ( isNaN( skip ) ) { skip = 0; }

  coll.count( q, { limit: limit, skip: skip } ).then( ( count ) => {
    callback( count );
  } );
};

let update = ( libPath, file, cover, bulk, callback ) => {
  delete file._id;

  if ( bulk !== "" ) {
    let q = queryParser( bulk );
    coll.find( q ).toArray( ( error, items ) => {
      let count = items.length;
      let done = ( error ) => {
        if ( error && 0 < count ) {
          count = 0;
          callback( error );
        } else {
          count --;
          if ( count === 0 ) {
            callback( null );
          }
        }
      };
      
      assert.equal( error, null );
      items.map( ( f ) => {
        for ( let key in file ) {
          if ( file[ key ].substring( 0, 3 ) !== "***" ) {
            f[ key ] = file[ key ];
          }
        }

        update( libPath, f, cover, "", done );
      } );
    } );

    return;
  }

  let dirname = genDirname( file );
  if ( dirname ) {
    if ( !fs.existsSync( pathlib.join( libPath, dirname ) ) ) {
      fs.mkdirSync( pathlib.join( libPath, dirname ) );
    }
  }

  let filename = genFilename( file );
  let oldpath = file.path;
  let newpath = pathlib.join( dirname, filename );

  if ( oldpath === newpath ) {
    // do nothing
  } else if ( !fs.existsSync( pathlib.join( libPath, newpath ) ) ) {
    fs.renameSync(
      pathlib.join( libPath, oldpath ),
      pathlib.join( libPath, newpath )
    );

    file.path = newpath;
    file.dir = dirname;
    file.file = filename;

    let olddir = pathlib.join( libPath, pathlib.dirname( oldpath ) );
    if ( fs.existsSync( olddir ) ) {
      let files = fs.readdirSync( olddir );
      if ( !files.length ) {
        fs.rmdirSync( olddir );
      }
    }
  } else {
    callback( "Aborted, file already exists: " + newpath );
    return;
  }

  file = tagman.format( file );

  coll.update(
    { path: oldpath },
    { $set: file },
    { upsert: true },
    ( error, result ) => {
      assert.equal( error, null );
      tagman.write( libPath, file );
      if ( cover ) {
        tagman.setCover( libPath, file.path, cover );
      }
      callback( null );
    }
  );
};

let add = ( libPath, path, callback ) => {
  let file = tagman.read( libPath, path );

  update( libPath, file, null, "", ( error ) => {
    callback( error );
  } );
};

let remove = ( libPath, path, callback ) => {
  coll.remove( { path: path } );

  fs.unlinkSync( pathlib.join( libPath, path ) );

  callback( null );
};

let close = () => {
  db.close();
};

module.exports = {
  db: db,
  drop: drop,
  scan: scan,
  renameScan: renameScan,
  coll: coll,
  start: start,
  find: find,
  count: count,
  update: update,
  add: add,
  remove: remove,
  close: close
};