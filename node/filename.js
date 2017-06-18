let sanitize = require( "sanitize-filename" );

let filename = ( str ) => {
  return sanitize( str, { replacement: "_" } )
    .replace( /#/g, "_" )
    .replace( /'/g, "_" )
    .replace( /%/g, "_" )
    .replace( /\s/g, "_" )
    .replace( /\./g, "_" );
};

module.exports = filename;