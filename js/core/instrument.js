/**
 * Interface for a MIDI-like instrument.
 *
 * In order for an instrument to be useful, most instruments will also
 * implement the {@link WapiPlugin} interface.
 *
 * @interface WapiInstrument
 */

/**
 * A note on event for the instrument.
 *
 * @method
 * @name WapiInstrument#noteOn
 * @param {number} time - The time that the note is turned on.
 * @param {string|number} note - Either a MIDI note or a string representing a
 * note.
 */

/**
 * A note off event for the instrument.
 *
 * @method
 * @name WapiInstrument#noteOff
 * @param {number} time - The time that the note is turned on.
 * @param {string|number} note - Either a MIDI note or a string representing a
 * note.
 */

// This interface is specified with virtual comments.
// See http://usejsdoc.org/tags-interface.html
