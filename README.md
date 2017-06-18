# mp3-server

Web based mp3 library server fully flavored by my preference

![](https://i.imgur.com/rJ6jNbb.png)

(experimental, wip, not stable, insecure)

## Features

- Can access from anywhere via browser
- Can stream / download library
- Can search so fast
  - Serach by title, artist, album...
  - Also you can sort by metadata
  - using mongodb
- Can add any file and convert into mp3
  - from .wav, .ogg, .flac, or even mp4...??
  - using ffmpeg
- Can modify metadata
  - Can read comment as json!! (important)
  - Also renames mp3 based on metadata automatically
- Can authorize users by twitter authorization
  - Share your library with your friends!

## dependency

The software is tested only on my environment (RasPi3) 😖

- node (6.4.0 in my env)
- mongodb (3.0.9 in my env)
- ffmpeg (N-85950-g8ef2c79 in my env, various codec library is enabled)
- taglib (`libtag1-dev`, 1.9.1-2.1 in my env)

## Shoutouts

- [Mp3tag](http://www.mp3tag.de/en/index.html) - An original concept of metadata editing, ultrafast search
- [node-taglib2](https://github.com/voltraco/node-taglib2) - An awesome taglib wrapper for nodejs
- [Vue.js](https://vuejs.org) - No Vue, no life