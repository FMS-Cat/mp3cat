let numFields = [ "bpm", "year", "length", "track", "disc" ];
let strFields = [ "title", "artist", "album", "albumartist", "composer", "file", "dir", "path", "comment" ];

let numFieldsRegexp = numFields.map( ( field ) => {
  return new RegExp( "^" + field + ":(.+)" );
} );
let strFieldsRegexp = strFields.map( ( field ) => {
  return new RegExp( "^" + field + ":(.+)" );
} );

let jsonNumFieldsRegexp = new RegExp( "^n-([^:]+):(.+)" );
let jsonStrFieldsRegexp = new RegExp( "^s-([^:]+):(.+)" );

let floatRegexpStr = "[0-9]+([.][0-9]+)?";
let floatRangeRegexp = new RegExp( "(" + floatRegexpStr + ")-(" + floatRegexpStr + ")" );
let floatSinceRegexp = new RegExp( "(" + floatRegexpStr + ")-" );
let floatUntilRegexp = new RegExp( "-(" + floatRegexpStr + ")" );

let numRangeCond = ( rangestr, exclude ) => {
  let rangeMatch = rangestr.match( floatRangeRegexp );
  if ( rangeMatch ) {
    let value1 = parseFloat( rangeMatch[ 1 ] );
    let value2 = parseFloat( rangeMatch[ 3 ] );
    if ( !isNaN( value1 ) && !isNaN( value2 ) ) {
      let cond = { $gte: value1, $lte: value2 };
      if ( exclude ) { cond = { $not: cond, $nin: [ null, undefined ] }; }
      return cond;
    }
  }

  let sinceMatch = rangestr.match( floatSinceRegexp );
  if ( sinceMatch ) {
    let value = parseFloat( sinceMatch[ 1 ] );
    if ( !isNaN( value ) ) {
      let cond = { $gte: value };
      if ( exclude ) { cond = { $not: cond, $nin: [ null, undefined ] }; }
      return cond;
    }
  }

  let untilMatch = rangestr.match( floatUntilRegexp );
  if ( untilMatch ) {
    let value = parseFloat( untilMatch[ 1 ] );
    if ( !isNaN( value ) ) {
      let cond = { $lte: value };
      if ( exclude ) { cond = { $not: cond, $nin: [ null, undefined ] }; }
      return cond;
    }
  }

  let value = parseFloat( rangestr );
  if ( !isNaN( value ) ) {
    let cond = value;
    if ( exclude ) { cond = { $nin: [ value, null, undefined ] }; }
    return cond;
  } else if ( rangestr === "null" ) {
    let cond = null;
    if ( exclude ) { cond = { $nin: [ null, undefined ] }; }
    return cond;
  }

  return null;
};

let queryParser = ( query ) => {
  if ( typeof query !== "string" ) { return null; }

  let out = { $and: [] };

  query = query.replace( /^\s+/, "" );
  query = query.replace( /\s+$/, "" );

  query = query.replace( /\\"/g, "\0" );
  query = query.replace( /"([^"]*)"/g, ( _, w ) => {
    return w.replace( /\s/g, "\\ " );
  } );
  query = query.replace( /\0/g, "\"" );

  query = query.replace( /\\\s/g, "\0" );
  let words = query.split( /\s+/ );
  words = words.map( ( word ) => {
    word = word.replace( /\0/g, " " );

    let cond = {};
    let cleared = false;

    let exclude = false;
    if ( word[ 0 ] === "-" ) {
      exclude = true;
      word = word.substring( 1 );
    }

    for ( let iField = 0; iField < numFields.length; iField ++ ) {
      let field = numFields[ iField ];
      let match = word.match( numFieldsRegexp[ iField ] );
      if ( match ) {
        let c = numRangeCond( match[ 1 ], exclude );
        if ( c ) {
          cond[ field ] = c;
          cleared = true; break;
        }
      }
    }

    if ( !cleared ) {
      let match = word.match( jsonNumFieldsRegexp );
      if ( match ) {
        let c = numRangeCond( match[ 2 ], exclude );
        if ( c ) {
          cond[ "json." + match[ 1 ] ] = c;
          cleared = true;
        }
      }
    }

    if ( !cleared ) {
      for ( let iField = 0; iField < strFields.length; iField ++ ) {
        let field = strFields[ iField ];
        let match = word.match( strFieldsRegexp[ iField ] );
        if ( match ) {
          cond[ field ] = new RegExp( match[ 1 ], "i" );
          if ( exclude ) { cond[ field ] = { $not: cond[ field ] }; }
          cleared = true; break;
        }
      }
    }

    if ( !cleared ) {
      let match = word.match( jsonStrFieldsRegexp );
      if ( match ) {
        let c = new RegExp( match[ 2 ], "i" );
        if ( exclude ) { c = { $not: c }; }
        cond[ "json." + match[ 1 ] ] = c;
        cleared = true;
      }
    }

    word = word.replace( /\\:/g, ":" );
    word = word.replace( /\\\\/g, "\0" );
    word = word.replace( /\\/g, "" );
    word = word.replace( /\0/g, "\\" );

    if ( word !== "" ) {
      if ( !cleared ) {
        let any = [];
        strFields.map( ( field ) => {
          let o = {};
          o[ field ] = new RegExp( word, "i" );
          if ( exclude ) { o[ field ] = { $not: o[ field ] }; }
          any.push( o );
        } );
        cond.$or = any;
        exclude ? ( cond.$and = any ) : ( cond.$or = any );
      }
    }

    out.$and.push( cond );
  } );

  if ( out.$and.length === 0 ) { return null; }
  return out;
};

// console.log( JSON.stringify( queryParser( '-adfj "d fjk\\\"" title:a\\ nold year:2014-2016' ) ) );

module.exports = queryParser;