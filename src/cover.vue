<template>
<div class="cover-cover"
  v-bind:style="{ backgroundImage: 'url(' + escapeShit( src ) + ')' }"
></div>
</template>

<script>
export default {
  props: [ "src" ],
  methods: {
    escapeShit( str ) {
      str = str.replace( /\(/g, "\\(" );
      str = str.replace( /\)/g, "\\)" );
      str = str.replace( /\'/g, "\\)" );
      return str;
    }
  }
}
</script>

<style lang="scss">
.cover-cover {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;

  background-size: cover;
  background-color: #222;
}
</style>