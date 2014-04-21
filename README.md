wapi
====

An exploration of the Web Audio API.
Live version can be [found here](https://davidlebech.com/wapi).

Inspired by a talk on live music coding by [Jan Krutisch](https://github.com/halfbyte),
this repository is an exploration of the Web Audio API and an attempt to
understand music and audio synthesis a little better.

The code is heavily commented as part of the learning process.

Examples
--------
[Live example](https://davidlebech.com/wapi).

Or take a look at the examples folder.

Features
--------
* A simple sequencer.
* Instruments
  * Drum kick
  * Drum snare (needs extra tweaking)
  * Electro synth bass
  * Simple notes (needs extra tweaking)
    * Piano-ish notes
    * Saw notes
    * Retro notes (square)

Documentation
-------------
[jsdoc documentation](https://davidlebech.com/wapi/docs) (not very complete)

To manually create the documentation for wapi, the following commands can be
run:

    npm install -g jsdoc
    // or
    npm install

    jsdoc -d docs js/wapi.js

License
-------
MIT licensed. See LICENSE for details.

Some code is inspired/copied directly from the [liv3c0der](https://github.com/halfbyte/liv3c0der) audio engine. This
code is copyright Jan Krutisch and licensed under the MIT license. The code is
also used with explicit permission by Jan Krutisch.
