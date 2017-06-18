let SETTINGS = require( "../mp3cat.json" );

let assert = require( "assert" );

let express = require( "express" );
let app = express();

let session = require( "express-session" );
app.use( session( {
  secret: "loud_nigra_is_gay IIDX",
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

let multer = require( "multer" );
let upload = multer( { storage: multer.diskStorage( {
  destination: ( req, file, cb ) => { cb( null, libraryPath ); },
  filename: ( req, file, cb ) => { cb( null, file.originalname ); }
} ) } );

let pathlib = require( "path" );
let fs = require( "fs" );

let convert = require( "./convert" );
let db = require( "./db" );
let stream = require( "./stream" );
let tagman = require( "./tagman" );

let onDeath = require( "death" );

let argv = require( "argv" );
let argvOptions = [ 
  { name: "scan", type: "boolean" },
  { name: "drop", type: "boolean" },
  { name: "rename", type: "string" },
  { name: "library", short: "l", type: "path" },
  { name: "port", short: "p", type: "int" }
];
let args = argv.option( argvOptions ).run();

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

let libraryPath = args.options.library || "library";
stream.setup( libraryPath );

db.start( () => {
  if ( args.options.drop ) { db.drop(); }

  if ( args.options.scan ) {
    db.scan( libraryPath, () => {
      console.log( "Scan complete!" );
    } );
  }

  if ( args.options.rename ) {
    db.renameScan( args.options.rename, libraryPath, () => {
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
  let cover = tagman.getCover( libraryPath, decodeURI( req.path ) );
  res.writeHead( 200, {
    "Content-Type": cover.mime,
    "Content-Length": cover.binary.length,
    "Last-Modified": new Date().toUTCString()
  } );
  res.end( cover.binary );
} );

app.post( "/update", twauth.check( "mighty" ), upload.single( "image" ), ( req, res ) => {
  let go = ( coverPath ) => {
    db.update(
      libraryPath,
      JSON.parse( req.body.json ),
      coverPath,
      req.body.bulk,
      ( error ) => {
        if ( error ) {
          res.status( 500 ).send( error );
        } else {
          res.send();

          if ( coverPath ) {
            fs.unlinkSync( coverPath );
          }
        }
      }
    );
  };

  if ( req.file ) {
    convert.jpg( req.file.path, ( error ) => {
      if ( error ) {
        fs.unlinkSync( req.file.path );
        res.status( 500 ).send( error );
        return;
      }
      
      fs.unlinkSync( req.file.path );
      go( req.file.path + ".jpg" );
    } );
  } else {
    go( null );
  }
} );

app.post( "/add", twauth.check( "mighty" ), upload.single( "file" ), ( req, res ) => {
  let go = ( path ) => {
    db.add( libraryPath, path, ( error ) => {
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
      go( req.file.originalname + ".mp3" );
    } );
  } else {
    go( req.file.originalname );
  }
} );

app.post( "/remove", twauth.check( "mighty" ), upload.array(), ( req, res ) => {
  let path = req.body.path;
  db.remove( libraryPath, path, ( error ) => {
    assert.equal( error, null );
    res.send();
  } );
} );

app.use( "/stream", stream.use );
app.use( "/library", express.static( libraryPath ) );
app.use( express.static( pathlib.join( __dirname, "../dist" ) ) );

// ------

let port = process.env.PORT || args.options.port || 4077;

app.listen( port, () => {
  console.log( "MP3Cat is running..." );
  console.log( "Library path: " + libraryPath );
  console.log( "Listening port: " + port );
} );