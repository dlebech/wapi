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
[Live example](https://davidlebech.com/wapi/examples).

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

Vision
------
Since starting this project a year ago, I've learned a lot about audio
synthesis and working with digital music. My go-to DAW is Reaper, but I really
like the idea of getting closer to the core of the music design. The Web Audio
API allows some very basic building blocks, and my hope is to slowly build up a
framework that allows me to play with music production in the browser. It's
probably not going to turn into a full-fletched DAW, but for anyone who might
be reading this, that's the idea. Maybe I should write a blog post instead :-)

There's a few spin-off projects related to sound that I have been exploring.
One that has been mostly on my mind is how to turn a photo into a soundscape.
This has been researched for years and I'm pretty sure I cannot come up with
something useful, but the idea is there, and I hope that my first "plugin" for
Wapi will be a photo-to-audio synthesis tool. More info on this later.

Documentation
-------------
To manually create the documentation for wapi:

    npm run docs

Or visit the [generated docs](https://dlebech.github.io/wapi/docs/).

License
-------
MIT licensed. See LICENSE for details.

Some code is inspired/copied directly from the [liv3c0der](https://github.com/halfbyte/liv3c0der) audio engine. This
code is copyright Jan Krutisch and licensed under the MIT license. The code is
also used with explicit permission by Jan Krutisch.
