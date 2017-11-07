<template>
<div class="balloons">
  <div
    v-for="( balloon, index ) in balloons"
    :key="index"
    class="balloon"
    :class="{
      opening: +new Date() - balloon.date < 1000,
      closing: ~~( balloon.closetime )
    }"
    :style="{
      background: balloon.bgcolor,
      color: balloon.fgcolor
    }"
    @click="onclick( index )"
  >
    <div class="header">{{balloon.header}}</div>
    <div class="text">{{balloon.text}}</div>
    <div class="timestring">{{balloon.timestring}}</div>
  </div>
</div>
</template>

<script>
let def = ( a, b ) => {
  let ret = {};
  for ( let key in a ) { ret[ key ] = a[ key ]; }
  for ( let key in b ) { ret[ key ] = b[ key ]; }
  return ret;
};

export default {
  mounted() {
    let update = () => {
      this.update();
      setTimeout( update, 100 );
    };
    update();
  },

  beforeDestroy() {},

  data() {
    return {
      balloons: []
    };
  },

  methods: {
    addBalloon( params, time ) {
      let p = def( {
        date: +new Date(),
        timestring: "Just now",
        header: "",
        text: "",
        bgcolor: "#456",
        fgcolor: "#fff",
        timeout: time ? +new Date() + time : null,
        closable: true,
        closetime: false
      }, params );

      this.balloons.push( p );
      return p;
    },

    timeformat( date ) {
      let now = new Date();
      let delta = now - date;

      if ( delta < 1000.0 ) { return "Just now"; }
      else if ( delta < 60000.0 ) { return Math.floor( delta / 1000.0 ) + "s"; }
      else if ( delta < 3600000.0 ) { return Math.floor( delta / 60000.0 ) + "min"; }
      else { return now.toLocaleTimeString(); }
    },

    onclick( index ) {
      let balloon = this.balloons[ index ];

      if ( balloon.onclick && typeof balloon.onclick === "function" ) {
        balloon.onclick();
      }

      if ( balloon.closable ) {
        balloon.closetime = +new Date();
      }
    },

    update() {
      for ( let i = 0; i < this.balloons.length; i ++ ) {
        let balloon = this.balloons[ i ];

        balloon.timestring = this.timeformat( balloon.date );

        let now = +new Date();
        if ( !balloon.closetime && balloon.timeout && balloon.timeout < now ) {
          balloon.closetime = now;
        }

        if ( balloon.closetime && ( balloon.closetime < now - 200 ) ) {
          this.balloons.splice( i, 1 );
          i --;
        }
      }
    }
  }
};
</script>

<style lang="scss">
.balloons {
  position: absolute;
  right: 8px;
  top: 8px;

  .balloon {
    position: relative;

    width: 240px;
    padding: 8px;
    margin-bottom: 8px;

    border-radius: 4px;

    cursor: pointer;

    &.opening {
      animation-name: balloonStart;
      animation-duration: 0.2s;
      animation-timing-function: ease;

      @keyframes balloonStart {
        0% {
          transform: scale( 0.8 );
          opacity: 0.0;
        }

        100% {
          transform: scale( 1.0 );
          opacity: 1.0;
        }
      }
    }

    &.closing {
      opacity: 0.0;

      animation-name: balloonEnd;
      animation-duration: 0.2s;
      animation-timing-function: ease;

      @keyframes balloonEnd {
        0% {
          transform: translateX( 0px );
          opacity: 1.0;
        }

        100% {
          transform: translateX( 10px );
          opacity: 0.0;
        }
      }
    }

    .header {
      font-size: 1.3em;
      font-weight: bold;
      padding-bottom: 4px;
    }

    .text {
      white-space: pre-wrap;
    }

    .timestring {
      position: absolute;
      right: 8px;
      top: 8px;
      font-size: 0.8em;
      opacity: 0.6;
    }
  }
}
</style>