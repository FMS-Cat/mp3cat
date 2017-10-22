let TIMEOUT = 2;

let count = 0;
let begin = 0;
let last = 0;

let tap = () => {
  let now = +new Date() * 0.001;

  if ( TIMEOUT < now - last ) {
    console.log( "hi" );
    begin = now;
    last = now;
    count = 0;

    return 40;
  } else {
    last = now;
    count ++;

    return 60 / ( ( now - begin ) / count );
  }
};

export default tap;