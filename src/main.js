let vue = require( "vue" );
let App = require( "./app.vue" );

new vue( {
	el: "#vue",
	render: ( createElement ) => {
		return createElement( App );
	}
} );