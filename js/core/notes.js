'use strict';

/**
 * Provides 8 octaves of notes in the equal tempered note scale
 * (Middle A (A4) == 440 hertz)
 *
 * @module core/notes
 * @author David Volquartz Lebech
 * @license MIT
 */

var notes = {};

// Notes on the same octave start at C and end at B.
// There are 12 notes for each octave.
// The lower-case s is used instead of # so referencing the notes is
// easier, i.e. notes.Cs instead of notes['C#']
var noteSymbols = ['C',  'Cs', 'D',  'Ds', 'E',  'F',
                   'Fs', 'G',  'Gs', 'A',  'As', 'B'];

// http://www.phy.mtu.edu/~suits/NoteFreqCalcs.html
// fn = A4 * a^n
// A4 = 440 hertz
// a = 2^(1/12)
// n = number of half-steps (semitones) from A4
var noteConstant = Math.pow(2, 1/12);

// Create 8 octaves.
for (var octave = 0; octave < 8; octave++) {

    // Find offset from the middle octave
    // This should be 0 for the middle octave, positive for octaves
    // above the middle and negative for octaves below the middle.
    var middleOffset = (octave-4)*12;

    for (var note = 0; note < 12; note++) {

        // Every note index corresponds to a number of half-steps
        // (semitones) from C in the given octave.
        // For example, if we are at octave 4, C4 is zero steps from C4
        // and D4 is 2 steps from C4.

        // Find offset from middle A (A4). For example:
        // C3 is 21 steps below A4 (-12-9+0)
        // C4 is 9 steps below A4 (0-9+0).
        // C5 is 3 steps above A4 (12-9+0)
        // C6 is 15 steps above A4 (24-9+0)
        var halfSteps = middleOffset-9+note;

        // Finally, the note frequency can be calculated and stored.
        var noteValue = 440 * Math.pow(noteConstant, halfSteps);
        notes[noteSymbols[note]+octave] = noteValue;
    }
}

module.exports = notes;
