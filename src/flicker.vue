<template>
<div class="flicker"
  v-bind:class="{ active: active }"
  v-on:mousemove.stop="onMouseMove"
  v-on:mouseup.stop="onMouseUp"
>
  <div class="bg"></div>
  <div class="imageContainer">
    <img class="image imageCenter"
      v-bind:class="{ selected: dir === 'center' }"
      v-bind:src="imageSrcCenter"
    />
    <img class="image imageLeft"
      v-bind:class="{ selected: dir === 'left' }"
      v-bind:src="imageSrcLeft"
    />
    <img class="image imageRight"
      v-bind:class="{ selected: dir === 'right' }"
      v-bind:src="imageSrcRight"
    />
    <img class="image imageUp"
      v-bind:class="{ selected: dir === 'up' }"
      v-bind:src="imageSrcUp"
    />
    <img class="image imageDown"
      v-bind:class="{ selected: dir === 'down' }"
      v-bind:src="imageSrcDown"
    />
  </div>
</div>
</template>

<script>
export default {
  props: [
    "active",
    "imageSrcCenter",
    "imageSrcLeft",
    "imageSrcRight",
    "imageSrcDown",
    "imageSrcUp",
    "onCenter",
    "onLeft",
    "onRight",
    "onUp",
    "onDown"
  ],

  data() {
    return {
      moveX: 0,
      moveY: 0,
      moved: false,
      dir: "center"
    }
  },

  mounted() {
  },

  beforeDestroy() {
  },

  methods: {
    onMouseMove( event ) {
      if ( !this.moved ) {
        this.moved = true;
        this.moveDecay();
      }

      this.moveX += event.movementX;
      this.moveY += event.movementY;
    },

    onMouseUp( event ) {
      this.$emit( "done" );
      if ( this.dir === "center" && typeof this.onCenter === "function" ) { this.onCenter(); }
      else if ( this.dir === "left" && typeof this.onLeft === "function" ) { this.onLeft(); }
      else if ( this.dir === "right" && typeof this.onRight === "function" ) { this.onRight(); }
      else if ( this.dir === "up" && typeof this.onUp === "function" ) { this.onUp(); }
      else if ( this.dir === "down" && typeof this.onDown === "function" ) { this.onDown(); }

      this.moveX = 0;
      this.moveY = 0;
      this.moved = false;
      this.dir = "center";
    },

    moveDecay() {
      let deltaTime = 1.0 / 60.0;
      this.moveX *= Math.exp( -deltaTime * 3.0 );
      this.moveY *= Math.exp( -deltaTime * 3.0 );

      let r = Math.sqrt( this.moveX * this.moveX + this.moveY * this.moveY );
      this.dir = "center";
      if ( 10 < r ) {
        if ( Math.abs( this.moveX ) < Math.abs( this.moveY ) ) {
          if ( 0 < this.moveY ) { this.dir = "down"; }
          else { this.dir = "up"; }
        } else {
          if ( 0 < this.moveX ) { this.dir = "right"; }
          else { this.dir = "left"; }
        }
      }

      if ( this.active ) { requestAnimationFrame( this.moveDecay ); }
    }
  }
}
</script>

<style lang="scss">
.flicker {
  display: none;
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;

  cursor: pointer;

  &.active {
    display: block;
  }

  * {
    user-select: none;
    pointer-events: none;
  }

  .bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;

    background: #000;
    opacity: 0.7;
  }

  .imageContainer {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;

    animation-name: imageContainerStart;
    animation-duration: 0.1s;
    animation-timing-function: ease;

    @keyframes imageContainerStart {
      0% {
        transform: scale( 0.8 );
        opacity: 0.0;
      }

      100% {
        transform: scale( 1.0 );
        opacity: 1.0;
      }
    }

    $image-size: 80px;
    .image {
      position: absolute;
      width: $image-size;
      height: $image-size;

      animation-name: start;
      animation-duration: 0.1s;
      animation-timing-function: ease;

      &.selected {
        transform: scale( 1.0 );
        opacity: 1.0;

        animation-name: selectedAni;
        animation-duration: 0.1s;
        animation-timing-function: ease;

        @keyframes selectedAni {
          0% {
            transform: scale( 0.8 );
            opacity: 0.7;
          }

          100% {
            transform: scale( 1.0 );
            opacity: 1.0;
          }
        }
      }

      &:not(.selected) {
        transform: scale( 0.8 );
        opacity: 0.7;

        animation-name: unselectedAni;
        animation-duration: 0.1s;
        animation-timing-function: ease;

        @keyframes unselectedAni {
          0% {
            transform: scale( 1.0 );
            opacity: 1.0;
          }

          100% {
            transform: scale( 0.8 );
            opacity: 0.7;
          }
        }
      }

      &.imageCenter {
        left: calc( 50% - #{ $image-size / 2 } );
        top: calc( 50% - #{ $image-size / 2 } );
      }

      &.imageLeft {
        left: calc( 50% - #{ $image-size / 2 * 3 } );
        top: calc( 50% - #{ $image-size / 2 } );
      }

      &.imageRight {
        left: calc( 50% + #{ $image-size / 2 } );
        top: calc( 50% - #{ $image-size / 2 } );
      }

      &.imageUp {
        left: calc( 50% - #{ $image-size / 2 } );
        top: calc( 50% - #{ $image-size / 2 * 3 } );
      }

      &.imageDown {
        left: calc( 50% - #{ $image-size / 2 } );
        top: calc( 50% + #{ $image-size / 2 } );
      }
    }
  }
}
</style>