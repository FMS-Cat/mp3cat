# MP3Cat

Web based mp3 library server fully flavored by my preference

![](https://i.imgur.com/rJ6jNbb.png)

(experimental, wip, not stable, insecure)

## Features

- Can access from anywhere via browser
  - Flicker GUI! click and swipe to do some action
- Can stream / download library
- Can search so fast
  - Serach by title, artist, album...
  - Also you can sort by metadata
  - using mongodb
- Can add any file and convert into mp3
  - from .wav, .ogg, .flac, or even mp4...??
  - using ffmpeg
- Can modify metadata
  - title, artist, comment, bpm...
  - Even cover! Automatically resized in `500x?`
  - Can read comment as json!! (important)
  - Also renames mp3 based on metadata automatically
- Can authorize users by twitter authorization
  - Share your library with your friends!
- Easy to quit
  - All metadata is saved into mp3 so you can back to your iTunes at anytime
  - **But watch out that your filenames and covers are modified**

## Dependency

The software is tested only on my environment (RasPi3) 😖

- node (6.4.0 in my env)
- mongodb (3.0.9 in my env)
- ffmpeg (N-85950-g8ef2c79 in my env, various codec library is enabled)
- taglib (`libtag1-dev`, 1.9.1-2.1 in my env)

## Usage

- Setting up:
  - copy `mp3cat.json-example` into `mp3cat.json`
  - [Create a twitter app](https://apps.twitter.com/) and Fill the `twauth.consumerKey`, `twauth.consumerSecret`
  - `twauth.callbackURL` is `http://<YOUR SERVER URL>/twauthCallback`
  - Set up some Twitter users who want to use the server
    `"approved"` users can use the server, `"mighty"` users can modify the library

- Run - first time:
  - `node . -p 6060 -l /path/to/library --drop --scan`
  - You must specify the mp3 library path by `-l` option
  - You can set PORT by `-p` option
    default is 4077 (don't ask why, I don't know)
  - You need to scan entire library at first (`--drop --scan`), it may takes minutes or hours

- Run - after the first run:
  `node . -p 6060 -l /path/to/library`
  - You don't have to rescan entire library next time

- Accessing from remote place
  - You can access the server from local without any authorization
  - If you want to access the server from remote, you must authorize via Twitter
    access to `http://<yourserver>/login`

## TODO

- mp3cat.json
  - make users can change filename format, also can disable auto rename
- client stuff
  - mobile friendly UI
- server stuff
  - make faster
- other
  - improve shuffle procedure
  - refactor

## Shoutouts

- [Mp3tag](http://www.mp3tag.de/en/index.html) - An original concept of metadata editing, ultrafast search
- [node-taglib2](https://github.com/voltraco/node-taglib2) - An awesome taglib wrapper for nodejs
- [Vue.js](https://vuejs.org) - No Vue, no life

## Follow me on Twitter!

- [@FMS_Cat](https://twitter.com/fms_cat)