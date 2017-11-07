<template>
<div class="app"
  v-on:dragenter.stop.prevent="onDragEnter"
  v-on:dragover.stop.prevent
  v-on:dragleave.stop.prevent="onDragLeave"
  v-on:drop.stop.prevent="onDrop"
>
  <div class="head">
    <input class="searchBox"
      v-model="searchValue"
      v-on:input="onSearchBoxInput"
      v-on:keydown.stop
    />
  </div>

  <div class="foot">
    <audio class="player"
      ref="player"
      v-bind:src="playingFile && playingFile.path ? './stream/' + playingFile.path : ''"
      v-on:ended="playerEnded"
      v-on:canplay="playerCanPlay"
      controls
    ></audio>
    <template
      v-if="playingFile !== null"
    >
      <cover class="cover"
        v-bind:src="'cover/' + playingFile.path"
      />
      <img class="button prev"
        src="images/prev.svg"
        v-on:click="playNext( -1 )"
      />
      <img class="button next"
        src="images/next.svg"
        v-on:click="playNext( 1 )"
      />
      <img class="button shuffle"
        src="images/shuffle.svg"
        v-bind:class="{ active: playlist.random }"
        v-on:click="playlist.random = !playlist.random"
      />
      <div class="info">
        {{ playingFile.artist }} - {{ playingFile.title }}
      </div>
    </template>
  </div>

  <div class="filelist">
    <div class="filelistInside">
      <div class="file"
        v-for="( file, index ) in files"
        v-bind:key="index"
        v-bind:class="{ odd: index % 2 === 1 }"
        v-on:mousedown.left="flickerMusic( file, index )"
      >
        <cover class="cover"
          v-bind:src="'thumb/' + file.thumb"
        />
        <div class="attrs">
          <div class="attr"
            v-for="( attr, index ) in filelistAttrs"
            v-bind:key="index"
            v-bind:style="{ width: ( attr.width - 10 ) + 'px' }"
          >{{ file[ attr.field ] || ( file.json ? file.json[ attr.field ] : null ) }}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="filelistHead"
  >
    <img class="menuButton"
      src="images/attrmenu.svg"
      v-on:click="filelistMenu.show = !filelistMenu.show"
    />
    <div class="attrs"
    >
      <div class="attr"
        v-for="( attr, index ) in filelistAttrs"
        v-bind:key="index"
        v-bind:style="{ width: ( attr.width - 10 ) + 'px' }"
        v-on:mousedown.stop="grabFilelistAttr( attr )"
      >
        <div class="name">{{ attr.field }}</div>
        <div class="resizer"
          v-on:mousedown.stop="grabFilelistResizer( attr )"
        ></div>
      </div>
    </div>
  </div>

  <div class="filelistMenu"
    v-show="filelistMenu.show"
  >
    <input class="addBox"
      placeholder="Add..."
      v-on:keydown.enter="addFilelistAttr"
    />
    <div class="option"
      v-for="( attr, index ) in filelistAttrs"
      v-bind:key="index"
      v-on:click="removeFilelistAttr( attr )"
    >{{ attr.field }}</div>
  </div>

  <div class="editor"
    v-show="editing"
  >
    <template
      v-if="editingFile"
    >
      <div class="editorItem">
        Artist <input v-model="editingFile.artist" v-on:keydown.stop="onEditorKeyDown" />
      </div>
      <div class="editorItem">
        Title <input v-model="editingFile.title" v-on:keydown.stop="onEditorKeyDown" />
      </div>
      <div class="editorItem">
        Track No. <input class="num" v-model="editingFile.track" v-on:keydown.stop="onEditorKeyDown" />
      </div>
      <div class="editorItem">
        Disc No. <input class="num" v-model="editingFile.disc" v-on:keydown.stop="onEditorKeyDown" />
      </div>
      <div class="editorItem">
        BPM <input class="num" v-model="editingFile.bpm" v-on:keydown.stop="onEditorKeyDownBPM" />
      </div>
      <div class="editorItem comment">
        Comment <textarea class="editorComment" v-model="editingFile.comment" v-on:keydown.stop="onEditorKeyDown" />
      </div>
      <div class="editorItem">
        Album <input v-model="editingFile.album" v-on:keydown.stop="onEditorKeyDown" />
      </div>
      <div class="editorItem">
        Album Artist <input v-model="editingFile.albumartist" v-on:keydown.stop="onEditorKeyDown" />
      </div>
      <div class="editorItem">
        Composer <input v-model="editingFile.composer" v-on:keydown.stop="onEditorKeyDown" />
      </div>
      <div class="editorItem">
        Year <input class="num" v-model="editingFile.year" v-on:keydown.stop="onEditorKeyDown" />
      </div>
      <div class="editorItem cover">
        Cover <div class="editorCover"
          v-on:dragenter.stop.prevent="onCoverDragEnter"
          v-on:dragover.stop.prevent
          v-on:dragleave.stop.prevent="onCoverDragLeave"
          v-on:drop.stop.prevent="onCoverDrop"
        ><cover
          v-bind:src="editingCoverURL"
        /></div>
      </div>
      <div class="editorItem">
        Bulk update <input type="checkbox" v-model="editingBulk" v-on:change="toggleBulk" />
      </div>
      <div class="editorItem buttons">
        <input class="button" type="button" value="OK"
          v-on:click="editFileOK"
        />
        <input class="button" type="button" value="Cancel"
          v-on:click="editFileCancel"
        />
      </div>
    </template>
  </div>

  <balloon
    ref="balloon"
  />

  <flicker
    v-bind:active="flicker.active"
    v-bind:imageSrcCenter="flicker.image.center"
    v-bind:imageSrcLeft="flicker.image.left"
    v-bind:imageSrcRight="flicker.image.right"
    v-bind:imageSrcUp="flicker.image.up"
    v-bind:imageSrcDown="flicker.image.down"
    v-bind:onCenter="flicker.func.center"
    v-bind:onLeft="flicker.func.left"
    v-bind:onRight="flicker.func.right"
    v-bind:onUp="flicker.func.up"
    v-bind:onDown="flicker.func.down"
    v-on:done="flickerDone"
  />
</div>
</template>

<script>
import tap from "./tap.js";

import balloon from "./balloon.vue";
import flicker from "./flicker.vue";
import cover from "./cover.vue";

let get = ( url, callback ) => {
  let xhr = new XMLHttpRequest();
  xhr.open( "GET", url, true );
  xhr.onload = () => {
    callback( xhr.status, xhr.response );
  };
  xhr.send();
};

let post = ( url, obj, callback ) => {
  let fd = new FormData();
  for ( let key in obj ) {
    fd.append( key, obj[ key ] );
  }

  let xhr = new XMLHttpRequest();
  xhr.open( "POST", url, true );
  
  xhr.onload = () => {
    callback( xhr.status, xhr.response );
  };

  xhr.send( fd );
};

let formatTime = ( sec ) => {
  if ( isNaN( sec ) ) { return "00:00"; }
  let s = ( "0" + Math.floor( sec ) % 60 ).slice( -2 );
  let m = ( "0" + Math.floor( sec / 60 ) % 60 ).slice( -2 );
  let h = ( "0" + Math.floor( sec / 60 / 60 ) % 60 ).slice( -2 );
  if ( h === "00" ) {
    return m + ":" + s;
  } else {
    return h + ":" + m + ":" + s;
  }
}

export default {
  mounted() {
    window.addEventListener( "resize", this.onResize );
    window.addEventListener( "keydown", this.onKeyDown );
    
    this.loadStorage();
    this.list();
    this.updateTitle();
  },

  beforeDestroy() {
    window.removeEventListener( "resize", this.onResize );
    window.removeEventListener( "keydown", this.onKeyDown );
  },

  data() {
    return {
      playingFile: null,
      playlist: {
        search: "",
        sort: "artist,title,album",
        random: false,
        current: 0,
        count: 0
      },

      storageObj: {},

      editing: false,
      editingFile: null,
      editingCover: null,
      editingCoverURL: "",
      editingBulk: false,

      files: [],
      sortValue: "artist,title,album",
      searchValue: "",
      searchBoxInputId: 0,

      filelistAttrs: [
        { field: "artist", width: 100 },
        { field: "title", width: 120 },
        { field: "album", width: 100 }
      ],

      filelistMenu: {
        show: false
      },

      flicker: {
        active: false,
        image: { center: "", left: "", right: "", up: "", down: "" },
        func: { center: () => {}, left: () => {}, right: () => {}, up: () => {}, down: () => {} }
      }
    }
  },

  watch: {
    filelistAttrs( value ) {
      this.saveStorage( "filelistAttrs", value );
    },

    sortValue( value ) {
      this.saveStorage( "sortValue", value );
    },

    searchValue( value ) {
      this.saveStorage( "searchValue", value );
    }
  },

  methods: {
    saveStorage( key, value ) {
      this.storageObj[ key ] = value;
      localStorage.setItem( "mp3cat", JSON.stringify( this.storageObj ) );
    },

    loadStorage() {
      if ( localStorage[ "mp3cat" ] ) {
        let json = null;

        try {
          json = JSON.parse( localStorage[ "mp3cat" ] );
        } catch ( exception ) {
          // do nothing
        }

        if ( json ) {
          if ( json.sortValue ) { this.sortValue = json.sortValue; }
          if ( json.searchValue ) { this.searchValue = json.searchValue; }
          if ( json.filelistAttrs ) { this.filelistAttrs = json.filelistAttrs; }
        }
      }
    },

    play() {
      this.$refs.player.play();
    },

    pause() {
      this.$refs.player.pause();
    },

    getArtistTitleString( file ) {
      let queryArray = [];
      if ( file.artist ) { queryArray.push( file.artist ); }
      if ( file.title ) { queryArray.push( file.title ); }
      return queryArray.join( " - " );
    },

    updateTitle() {
      if ( !this.$refs.player.paused && this.playingFile ) {
        document.title = this.getArtistTitleString( this.playingFile ) + " - MP3Cat";
      } else {
        document.title = "MP3Cat";
      }

      setTimeout( this.updateTitle, 1000 );
    },

    loadMusic( file, index ) {
      this.pause();

      this.playlist = {
        search: this.searchValue,
        sort: this.sortValue,
        current: index,
        random: true,
        count: 0
      };
      this.getPlaylistCount();
      this.playMusic( file );
    },

    playMusic( file ) {
      if ( this.playingFile && file.path === this.playingFile.path ) {
        this.$refs.player.currentTime = 0;
        this.play();
      } else {
        this.playingFile = file;
      }
    },

    playerCanPlay() {
      this.play();
    },

    playerEnded() {
      this.playNext( 1 );
    },

    playNext( dir ) {
      this.pause();

      if ( 5 < this.$refs.player.currentTime && dir < 0 ) {
        dir += 1;
      }

      if ( this.playlist.random && dir !== 0 ) {
        this.playlist.current = parseInt( Math.random() * this.playlist.count );
      } else {
        this.playlist.current += dir;
        this.playlist.current = this.playlist.current - Math.floor( this.playlist.current / this.playlist.count ) * this.playlist.current;
      }

      let url = "./list";
      let sort = this.playlist.sort;
      url += "?sort=" + sort;
      let search = this.playlist.search;
      url += "&search=" + search;
      url += "&limit=1";
      url += "&skip=" + this.playlist.current;

      get( url, ( status, res ) => {
        if ( status !== 200 ) {
          console.error( "Status: " + status );
          return;
        }

        let list = JSON.parse( res );
        if ( list.length !== 0 ) {
          this.playMusic( list[ 0 ] );
        }
      } );
    },

    getPlaylistCount( callback ) {
      let url = "./count";
      let search = this.playlist.search;
      url += "?search=" + search;

      get( url, ( status, res ) => {
        if ( status !== 200 ) {
          console.error( "Status: " + status );
          return;
        }

        let count = parseInt( res );
        this.playlist.count = count;
      } );
    },

    downloadMusic( file ) {
      let a = document.createElement( "a" );
      a.href = "./library/" + file.path;
      a.download = file.file;
      a.click();
      a = null;
    },

    editFile( file ) {
      this.editing = true;
      this.editingFile = Object.assign( {}, file );
      this.editingCover = null;
      this.editingCoverURL = "./cover/" + this.editingFile.path;
      this.editingBulk = false;
    },

    toggleBulk() {
      if ( this.editingBulk ) {
        for ( let key in this.editingFile ) {
          this.editingFile[ key ] = "***" + this.editingFile[ key ];
        }
      } else {
        for ( let key in this.editingFile ) {
          if ( this.editingFile[ key ].substring( 0, 3 ) === "***" );
          this.editingFile[ key ] = this.editingFile[ key ].substring( 3 );
        }
      }
    },

    editFileOK() {
      this.editing = false;

      let balloon = this.$refs.balloon.addBalloon( {
        header: "Updating song tags...",
        closable: false
      } );

      post( "./update", {
        image: this.editingCover,
        json: JSON.stringify( this.editingFile ),
        bulk: this.editingBulk ? this.searchValue : ""
      }, ( status, res ) => {
        if ( status !== 200 ) {
          console.error( "Status: " + status );

          balloon.bgcolor = "#d15";
          balloon.header = "Update song tags failed";
          balloon.text += "\nStatus: " + status
          balloon.closable = true;

          return;
        }

        balloon.header = "Song tags updated";
        balloon.bgcolor = "#1b4";
        balloon.timeout = +new Date() + 1000;

        this.list();
      } );
    },

    editFileCancel() {
      this.editing = false;
    },

    removeFile( file ) {
      if ( !confirm( "Remove " + file.path + " : Really?" ) ) {
        return;
      }

      let balloon = this.$refs.balloon.addBalloon( {
        header: "Removing song...",
        text: file.path,
        closable: false
      } );

      post( "./remove", {
        path: file.path
      }, ( status, res ) => {
        if ( status !== 200 ) {
          console.error( "Status: " + status );

          balloon.bgcolor = "#d15";
          balloon.header = "Remove song failed";
          balloon.text += "\nStatus: " + status
          balloon.closable = true;

          return;
        }

        balloon.header = "Song removed";
        balloon.bgcolor = "#1b4";
        balloon.timeout = +new Date() + 1000;

        this.list();
      } );
    },

    searchFile( file ) {
      let query = this.getArtistTitleString( file );

      let a = document.createElement( "a" );
      a.href = "https://www.google.com/search?q=" + encodeURIComponent( query );
      a.target = "_blank";
      a.click();
    },

    list() {
      let url = "./list";
      let sort = this.sortValue;
      url += "?sort=" + sort;
      let search = this.searchValue;
      url += "&search=" + search;

      let balloon = this.$refs.balloon.addBalloon( {
        header: "Retrieving song list...",
        text: search + " [" + sort + "]",
        closable: false
      } );

      get( url, ( status, res ) => {
        if ( status !== 200 ) {
          balloon.bgcolor = "#d15";
          balloon.header = "Retrieve song list failed";
          balloon.text += "\nStatus: " + status
          balloon.closable = true;
          return;
        }

        if (
          ( sort === this.sortValue ) &&
          ( search === this.searchValue )
        ) {
          this.files = JSON.parse( res );
        }

        balloon.closetime = +new Date();
      } );
    },

    onSearchBoxInput() {
      this.searchBoxInputId ++;
      let id = this.searchBoxInputId;
      setTimeout( () => {
        if ( id === this.searchBoxInputId ) { this.list(); }
      }, 250 );
    },

    flickerMusic( file, index ) {
      this.flicker = {
        active: true,
        image: {
          center: "images/play.svg",
          left: "images/remove.svg",
          right: "images/tag.svg",
          up: "images/search.svg",
          down: "images/download.svg"
        },
        func: {
          center: () => { this.loadMusic( file, index ) },
          left: () => { this.removeFile( file ) },
          right: () => { this.editFile( file ) },
          up: () => { this.searchFile( file ) },
          down: () => { this.downloadMusic( file ) }
        }
      }
    },

    flickerDone() {
      this.flicker.active = false;
    },

    onResize() {
    },

    onKeyDown( event ) {
      if ( this.playingFile ) {
        if ( event.which === 27 ) {
          event.preventDefault();
          this.pause();
        } else if ( event.which === 32 ) {
          event.preventDefault();
          this.$refs.player.paused ? this.play() : this.pause();
        }
        
        if ( !this.$refs.player.paused ) {
          if ( event.which === 37 ) {
            if ( event.shiftKey ) {
              this.playNext( -1 );
            } else {
              if ( this.$refs.player.currentTime < 10 ) {
                this.$refs.player.currentTime = 0;
              } else {
                this.$refs.player.currentTime -= 10;
              }
            }
          } else if ( event.which === 39 ) {
            if ( event.shiftKey ) {
              this.playNext( 1 );
            } else {
              if ( this.$refs.player.duration < this.$refs.player.currentTime + 10 ) {
                this.$refs.player.currentTime = this.$refs.player.duration - 0.01;
              } else {
                this.$refs.player.currentTime += 10;
              }
            }
          }
        }
      }
    },

    onEditorKeyDown( event ) {
      if ( event.which === 13 ) {
        event.preventDefault();
        this.editFileOK();
      } else if ( event.which === 27 ) {
        event.preventDefault();
        this.editFileCancel();
      }
    },

    onEditorKeyDownBPM( event ) {
      if ( event.which === 32 ) {
        event.preventDefault();
        this.editingFile.bpm = Math.floor( tap() * 100 ) / 100;
      } else {
        this.onEditorKeyDown( event );
      }
    },

    onDragEnter() {
    },

    onDragLeave() {
    },

    onDrop( event ) {
      let files = event.dataTransfer.files;
      let index = -1;

      let balloonCue;
      if ( 1 < files.length ) {
        balloonCue = this.$refs.balloon.addBalloon( {
          header: "Upload cue: " + files.length,
          closable: false
        } );
      }

      let go = () => {
        index ++;
        if ( files.length === index ) {
          if ( balloonCue ) { balloonCue.closetime = +new Date(); }
          this.list();
          return;
        }

        let file = files[ index ];

        let balloon = this.$refs.balloon.addBalloon( {
          header: "Uploading...",
          text: file.name,
          closable: false
        } );

        post( "./add", {
          file: file
        }, ( status, res ) => {
          balloon.closable = true;

          if ( status !== 200 ) {
            balloon.header = "Upload failed";
            balloon.bgcolor = "#d15";
            balloon.text += "\nStatus: " + status;
            go();
            return;
          }

          balloon.header = "Uploaded!";
          balloon.bgcolor = "#1b4";
          balloon.timeout = +new Date() + 1000;

          go();
        } );
      };

      go();
    },

    onCoverDragEnter() {
    },

    onCoverDragLeave() {
    },

    onCoverDrop( event ) {
      let files = event.dataTransfer.files;
      if ( files && files[ 0 ] ) {
        this.editingCover = files[ 0 ];

        let reader = new FileReader();
        reader.onload = () => {
          this.editingCoverURL = reader.result;
        };
        reader.readAsDataURL( files[ 0 ] );
      }
    },

    grabFilelistAttr( attr ) {
      let notmoved = true;
      let deltaX = 0;

      let move = ( event ) => {
        event.preventDefault();

        notmoved = false;
        deltaX += event.movementX;

        let index = this.filelistAttrs.indexOf( attr );
        if ( deltaX < -10 && index !== 0 ) {
          this.filelistAttrs.splice(
            index - 1,
            2,
            attr,
            this.filelistAttrs[ index - 1 ]
          );
          deltaX = 0;
        }
        if ( 10 < deltaX && index !== this.filelistAttrs.length - 1 ) {
          this.filelistAttrs.splice(
            index,
            2,
            this.filelistAttrs[ index + 1 ],
            attr
          );
          deltaX = 0;
        }
      };

      let up = () => {
        if ( notmoved ) {
          let sortArray = this.sortValue.split( "," );

          let existed = sortArray.indexOf( attr.field );
          let iexisted = sortArray.indexOf( "-" + attr.field );

          if ( existed === -1 && iexisted === -1 ) {
            sortArray.unshift( attr.field );
          } else if ( existed === 0 ) {
            sortArray[ 0 ] = "-" + attr.field;
          } else if ( iexisted === 0 ) {
            sortArray[ 0 ] = attr.field;
          } else {
            let i = existed;
            if ( i === -1 ) { i = iexisted };
            sortArray.splice( i, 1 );
            sortArray.unshift( attr.field );
          }

          if ( sortArray.length === 6 ) {
            sortArray.pop();
          }
          this.sortValue = sortArray.join( "," );

          this.list();
        }

        window.removeEventListener( "mousemove", move );
        window.removeEventListener( "mouseup", up );
      };

      window.addEventListener( "mousemove", move );
      window.addEventListener( "mouseup", up );
    },

    addFilelistAttr( event ) {
      this.filelistAttrs.push( {
        field: event.target.value,
        width: 100
      } );
      event.target.value = "";

      this.filelistMenu.show = false;
    },

    removeFilelistAttr( attr ) {
      let index = this.filelistAttrs.indexOf( attr );
      this.filelistAttrs.splice( index, 1 );

      this.filelistMenu.show = false;
    },

    grabFilelistResizer( attr ) {
      let move = ( event ) => {
        event.preventDefault();

        attr.width += event.movementX;
        attr.width = Math.max( attr.width, 20 );
      };

      let up = () => {
        // call watcher
        let temp = this.filelistAttrs;
        this.filelistAttrs = {};
        this.filelistAttrs = temp;

        window.removeEventListener( "mousemove", move );
        window.removeEventListener( "mouseup", up );
      };

      window.addEventListener( "mousemove", move );
      window.addEventListener( "mouseup", up );
    }
  },

  components: {
    balloon,
    flicker,
    cover
  }
}
</script>

<style lang="scss">
.app {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;

  background: #222;
  color: #ddd;

  font: 400 12px/1.0 "Helvetica Neue", sans-serif;

  $head-height: 30px;
  .head {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: $head-height;

    background: #eee;

    .searchBox {
      position: absolute;
      width: calc( 30% - 16px );
      height: $head-height - 8px;
      padding: 0 4px;
      border: none;
      left: 4px;
      top: 4px;

      border-radius: 4px;
      background: #555;
      color: #fff;
    }
  }

  $foot-height: 60px;
  .foot {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: $foot-height;
    color: #222;
    background: #fafafa;

    .player {
      position: absolute;
      left: $foot-height;
      width: calc( 100% - #{ $foot-height + 10px } );
      bottom: 5px;
    }

    .cover {
      position: absolute;
      left: 5px;
      top: 5px;
      width: $foot-height - 10px;
      height: $foot-height - 10px;

      background-size: cover;
      background-color: #222;
    }

    .button {
      position: absolute;
      top: 2px;
      width: 24px;
      height: 24px;

      opacity: 0.72;

      cursor: pointer;

      &.prev {
        left: $foot-height + 4px;
      }

      &.next {
        left: $foot-height + 34px;
      }

      &.shuffle {
        left: $foot-height + 64px;

        &.active { opacity: 0.72; }
        &:not(.active) { opacity: 0.28; }
      }
    }

    .info {
      position: absolute;
      left: $foot-height + 100px;
      top: 7px;
    }
  }

  .editor {
    position: absolute;
    left: calc( 50% - 150px );
    top: 40px;
    width: calc( 300px - 20px );
    padding: 10px;

    background: #ddd;
    color: #222;
    border-radius: 2px;

    .editorItem {
      position: relative;
      width: 100%;
      height: 20px;

      &.comment {
        height: 50px;
      }

      &.cover {
        height: 80px;
      }

      &.buttons {
        text-align: center;
      }

      input {
        &:not(.button) {
          position: absolute;
          left: 90px;
          border: none;
          width: calc( 100% - 100px );
          height: 14px;
          padding: 0 5px;
          margin-top: -1px;

          border-radius: 2px;
          background: #eee;
        }

        &.button {
          position: relative;
          width: 80px;
        }
      }

      .editorComment {
        display: inline-block;
        position: absolute;
        left: 90px;
        width: calc( 100% - 100px );
        padding: 0 5px;
        height: 40px;
        border: none;

        resize: none;
        border-radius: 2px;
        background: #eee;
      }

      .editorCover {
        display: inline-block;
        position: absolute;
        left: 90px;
        width: 72px;
        height: 72px;

        background-size: cover;
        background-color: #222;
      }
    }
  }

  $flhead-height: 20px;
  .filelistHead {
    position: absolute;
    left: 0px;
    top: $head-height;
    width: 100%;
    height: $flhead-height;

    background: #444;

    white-space: nowrap;
    overflow: hidden;

    .menuButton {
      position: absolute;
      left: 2px;
      top: 2px;
      width: $flhead-height - 4px;
      height: $flhead-height - 4px;

      background: #777;
      border-radius: 2px;

      cursor: pointer;

      &:hover {
        background: #789;
      }

      &:active {
        background: #567;
      }
    }

    .attrs {
      position: absolute;
      left: 70px;
      height: 100%;

      .attr {
        position: relative;
        display: inline-block;
        height: 100%;
        padding-right: 10px;

        cursor: pointer;

        &:hover {
          background: #456;
        }

        .name {
          position: absolute;
          width: calc( 100% - 10px );
          top: 5px;

          text-overflow: ellipsis;
          overflow: hidden;
        }

        .resizer {
          position: absolute;
          right: 0;
          top: 0;
          width: 4px;
          height: 100%;

          cursor: col-resize;

          &:hover {
            background: #678;
          }
        }
      }
    }
  }

  .filelistMenu {
    position: absolute;
    left: 0px;
    top: $head-height + $flhead-height;
    width: 120px;

    background: #eee;
    color: #111;

    .addBox {
      width: calc( 100% - 16px );
      height: 16px;
      margin: 4px;
      padding: 0 4px;
      border: none;

      border-radius: 4px;
      background: #ccc;
      color: #000;
    }

    .option {
      margin: 2px;
      padding: 2px;
      
      cursor: pointer;

      &:hover {
        background: #bcd;
      }

      &:active {
        background: #89a;
      }
    }
  }

  .filelist {
    position: absolute;
    left: 0px;
    top: $head-height + $flhead-height;
    width: 100%;
    height: calc( 100% - #{ $head-height + $flhead-height + $foot-height } );
    overflow-x: hidden;
    overflow-y: scroll;

    .filelistInside {
      .file {
        position: relative;
        padding: 2px;
        height: 16px;

        white-space: nowrap;
        background: #222;

        cursor: pointer;

        &.odd {
          background: #2b2b2b;
        }

        &:hover {
          background: #345;
        }

        .cover {
          position: absolute;
          left: 2px;
          top: 2px;
          width: 60px;
          height: 100%;
          overflow: hidden;
          margin: -2px 10px -2px -2px;

          background-size: cover;
          background-color: #222;
        }

        .attrs {
          position: absolute;
          left: 70px;

          .attr {
            display: inline-block;
            text-overflow: ellipsis;
            overflow: hidden;
            padding-bottom: 2px;
            margin-top: 2px;
            margin-right: 10px;
          }
        }
      }
    }
  }
}
</style>