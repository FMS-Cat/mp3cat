let assert = require( "assert" );

let SETTINGS = require( "../mp3cat.json" );
assert( SETTINGS, "mp3cat.json (setting file) not found" );

let argv = require( "argv" );
let argvOptions = [ 
  { name: "scan", type: "boolean" },
  { name: "drop", type: "boolean" },
  { name: "rename", type: "string" },
  { name: "library", short: "l", type: "path" },
  { name: "port", short: "p", type: "int" }
];
let args = argv.option( argvOptions ).run();

let express = require( "express" );
let app = express();

let session = require( "express-session" );
app.use( session( {
  secret: SETTINGS.sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: {}
} ) );

let TwAuth = require( "./twauth" );
let twauth = TwAuth( SETTINGS.twauth );
app.use( SETTINGS.loginPath, twauth.login );
app.use( "/twauthCallback", twauth.callback, ( req, res ) => {
  res.redirect( "/" );
} );
app.use( twauth.check( "approved" ) );

let pathlib = require( "path" );
let fs = require( "fs" );
let recursiveUnlink = require( "./recursiveunlink" );

let libPath = args.options.library;
let dotMp3catPath = pathlib.join( libPath, ".mp3cat" );
let tempPath = pathlib.join( dotMp3catPath, "temp" );

if ( fs.existsSync( tempPath ) ) {
  recursiveUnlink( tempPath, true );
} else {
  if ( fs.existsSync( dotMp3catPath ) ) {
    fs.mkdirSync( tempPath );
  } else {
    fs.mkdirSync( dotMp3catPath );
    fs.mkdirSync( tempPath );
  }
}

let multer = require( "multer" );
let upload = multer( { storage: multer.diskStorage( {
  destination: ( req, file, cb ) => { cb( null, tempPath ); },
  filename: ( req, file, cb ) => { cb( null, file.originalname ); }
} ) } );

let convert = require( "./convert" );
let thumb = require( "./thumb" );
let db = require( "./db" );
let stream = require( "./stream" );
let tagman = require( "./tagman" );

let onDeath = require( "death" );

// ------

let exit = () => {
  console.log( "Exiting..." );
  db.close();
  process.exit();
};

onDeath( ( signal, error ) => {
  exit();
} );

// ------

stream.setup( libPath );

db.start( () => {
  if ( args.options.drop ) {
    thumb.empty( libPath );
    db.drop();
  }

  if ( args.options.scan ) {
    db.scan( libPath, () => {
      console.log( "Scan complete!" );
    } );
  }

  if ( args.options.rename ) {
    db.renameScan( args.options.rename, libPath, () => {
      console.log( "Renamed!" );
    } );
  }
} );

app.get( "/list", ( req, res ) => {
  db.find(
    req.query.search,
    req.query.sort,
    parseInt( req.query.limit ), 
    parseInt( req.query.skip ),
    ( items ) => {
      res.send( JSON.stringify( items ) );
    }
  );
} );

app.get( "/count", ( req, res ) => {
  db.count(
    req.query.search,
    parseInt( req.query.limit ), 
    parseInt( req.query.skip ),
    ( count ) => {
      res.send( count.toString() );
    }
  );
} );

app.use( "/cover", ( req, res ) => {
  let cover = tagman.getCover( libPath, decodeURI( req.path ) );
  res.writeHead( 200, {
    "Content-Type": cover.mime,
    "Content-Length": cover.binary.length,
    "Last-Modified": new Date().toUTCString()
  } );
  res.end( cover.binary );
} );

app.use( "/thumb", ( req, res ) => {
  let path = pathlib.join( libPath, ".mp3cat", "thumb", decodeURI( req.path ) + ".jpg" );
  if ( fs.existsSync( path ) ) { res.sendFile( path ); }
  else { res.redirect( "/images/black.png" ); }
} );

app.post( "/update", twauth.check( "mighty" ), upload.single( "image" ), ( req, res ) => {
  db.update(
    libPath,
    JSON.parse( req.body.json ),
    req.file ? req.file.path : null,
    req.body.bulk,
    ( error ) => {
      if ( error ) {
        console.error( error );
        res.status( 500 ).send( error );
      } else {
        res.send();
      }
    }
  );
} );

app.post( "/add", twauth.check( "mighty" ), upload.single( "file" ), ( req, res ) => {
  let go = ( path ) => {
    db.add( libPath, path, ( error ) => {
      assert.equal( error, null );
      res.send();
    } );
  };

  if ( req.file.mimetype !== "audio/mp3" ) {
    convert.mp3( req.file.path, ( error ) => {
      if ( error ) {
        fs.unlinkSync( req.file.path );
        res.status( 500 ).send( error );
        return;
      }

      fs.unlinkSync( req.file.path );
      go( pathlib.relative( libPath, req.file.path + ".mp3" ) );
    } );
  } else {
    go( pathlib.relative( libPath, req.file.path ) );
  }
} );

app.post( "/remove", twauth.check( "mighty" ), upload.array(), ( req, res ) => {
  let path = req.body.path;
  db.remove( libPath, path, ( error ) => {
    assert.equal( error, null );
    res.send();
  } );
} );

app.use( "/stream", stream.use );
app.use( "/library", express.static( libPath ) );
app.use( express.static( pathlib.join( __dirname, "../dist" ) ) );

// ------

let port = process.env.PORT || args.options.port || 4077;

app.listen( port, () => {
  console.log( "MP3Cat is running..." );
  console.log( "Library path: " + libPath );
  console.log( "Listening port: " + port );
} );