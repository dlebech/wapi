define(['wapi-core'], function(Wapi) {
    /**
     * Instruments class that holds all instruments of wapi.
     *
     * @class WapiInstruments
     * @copyright 2014 David Volquartz Lebech
     * @license MIT
     */

    /**
     * Plays a simple saw note. The saw node sounds slightly "noisy".
     * @param {int} time - The time that the instrument will start playing.
     * @param {float} note - The wapi.NOTES note to play.
     * @method 
     * @memberof Wapi
     */
    Wapi.prototype.saw = function(time, note) {
        // The saw note is just a simple note with a sawtooth waveform.
        this.simpleNote(time, note, OscillatorNode.SAWTOOTH);
    };

    /**
     * Plays a simple piano note. Well, heavily synthesized piano node, that
     * is.
     * @param {int} time - The time that the instrument will start playing.
     * @param {float} note - The wapi.NOTES note to play.
     * @method 
     * @memberof Wapi
     */
    Wapi.prototype.piano = function(time, note) {
        // For now, the piano note is just a sine wave.
        this.simpleNote(time, note, OscillatorNode.SINE);
    };

    /**
     * Plays a simple retro note. Calling it retro is probably weird but it
     * sounds like those good old C64, Amiga or Nintendo sounds.
     * @param {int} time - The time that the instrument will start playing.
     * @param {float} note - The wapi.NOTES note to play.
     * @method 
     * @memberof Wapi
     */
    Wapi.prototype.retro = function(time, note) {
        // The retro note is a square wave form.
        this.simpleNote(time, note, OscillatorNode.SQUARE);
    };

    /**
     * Plays a simple note with the given note frequency and waveform.
     *
     * This function is usually not called directly but through the abstracted
     * waveform functions such as saw, sine and square.
     * 
     * @param {int} time - The start time.
     * @param {float} note - The wapi.NOTES note to play.
     * @param {OscillatorNode.type} type - The type of the waveform.
     * @method 
     * @memberof Wapi
     */
    Wapi.prototype.simpleNote = function(time, note, type) {
        // Node network:
        // wave -> gain -> master mixer
        var node = this.context.createOscillator();
        var gainNode = this.context.createGain();
        node.type = type;
        node.connect(gainNode);
        gainNode.connect(this.mixer);

        // The frequency of the note does not change over time.
        node.frequency.value = note;

        // Make a slight increase in gain in the beginning to simulate hitting
        // a key. 
        // Attack 1000 -> Decay 1000 -> Sustain 3 -> Release 10
        var endTime = this.ADSREnvelope(gainNode.gain, time, 0, 1,
                                        1000, 1000, 0.6, 3, 10);

        // Start the sine node.
        node.start(time);
        node.stop(endTime);
    };

    /**
     * Plays a very synth-y drum snare.
     *
     * @param {int} time - The time that the instrument will start playing.
     * @method 
     * @memberof Wapi
     */
    Wapi.prototype.drumSnare = function(time) {
        // A drum snare is a drum synth with some added noise.
        // Node network:
        // noise -> lowpass filter -> gain -> master mixer
        
        var gainNode = this.context.createGain();
        gainNode.connect(this.mixer);

        // How long time the entire beat and gain decay takes.
        var gainDecay = 3;

        // Make a slight increase in gain in the beginning to simulate a
        // hitting pedal or snare. Basically, go from silence to loud in a very
        // short timespan and then back to silence.
        var endTime = this.ADSREnvelope(gainNode.gain, time, 0, 1, 0, gainDecay);

        // Create new NoiseNode and pass it through a low-pass filter.
        var noise = this.createNoise();
        var filter = this.context.createBiquadFilter();
        filter.type = filter.LOWPASS;
        filter.frequency.value = 4000;
        filter.Q.value = 5;
        noise.connect(filter);
        filter.connect(gainNode);
        noise.start(time);
        noise.stop(endTime);
        this.drum(time, this.mixer, 400, 100, gainDecay, gainDecay);
    };

    /**
     * Plays a nice low drum kick.
     *
     * @param {int} time - The time that the instrument will start playing.
     * @method 
     * @memberof Wapi
     */
    Wapi.prototype.drumKick = function(time) {
        // Uses the base drum sound with a 100 -> 50 hertz frequency drop that
        // happens quite fast.
        this.drum(time, this.mixer, 100, 50, 60, 10);
    };

    /**
     * Creates a synthesized drum sound. Good for drum kicks with varying
     * intensity.
     *
     * @param {int} time - The time that the instrument will start playing.
     * @param {AudioDestinationNode} destination - The destination node for the
     * instrument. Allows for playing the drums through other nodes such as
     * noise nodes.
     * @param {int} startFrequency - The start frequency of sine wave for the drum.
     * @param {int} endFrequency - The end frequency of the sine wave for the drum.
     * @param {int} frequencyDecay - The rate at which the the frequency decays
     * between start and end frequency. Higher numbers mean faster decay.
     * @param {int} gainDecay - The rate at which the gain (volume) decays.
     * @method 
     * @memberof Wapi
     */
    Wapi.prototype.drum = function(time,
                                   destination,
                                   startFrequency,
                                   endFrequency,
                                   frequencyDecay,
                                   gainDecay) {
        // The drum sound is just a sine wave with a rapid attack-release
        // envelope.
        //
        // The sound is made by making a rapid drop-off in both frequency and
        // gain (volume).
        // The frequency drop-off is usually faster than the gain drop-off,
        // depending on the given parameters.
        // See the ADSR envelope function for more details.

        // Node network:
        // sine -> gain -> destination
        var sineNode = this.context.createOscillator();
        var gainNode = this.context.createGain();
        sineNode.connect(gainNode);
        gainNode.connect(destination);

        // Wrap the sine node's frequency in an envelope.
        var freqEnd = this.ADSREnvelope(sineNode.frequency, time, endFrequency,
                                        startFrequency, 0, frequencyDecay);

        // Make a slight increase in gain in the beginning to simulate a
        // hitting pedal or snare. Basically, go from silence to loud in a very
        // short timespan and then back to silence.
        // This is accomplished with an ADSR envelope.
        var gainEnd = this.ADSREnvelope(gainNode.gain, time, 0, 1,
                                        1000, gainDecay);

        // Determine when to end playing by taking the largest end time of the
        // frequency and gain envelopes.
        var endTime = freqEnd > gainEnd ? freqEnd : gainEnd;

        // Start the sine node.
        sineNode.start(time);
        sineNode.stop(endTime);
    };

    /**
     * Plays a classic electric synth bass tone.
     * @param {int} time - The start time.
     * @param {float} note - The wapi.NOTES note to play.
     * @method 
     * @memberof Wapi
     */
    Wapi.prototype.electroSynthBass = function(time, note) {
        // Inspired by this tutorial:
        // http://www.futureaudioworkshop.com/circle/tutorials/tutorial2
        //
        // Node network:
        // saw1 -\
        //        -> filter -> gain -> master mixer.
        // saw2 -/
        
        // Create two sawtooth oscillators.
        var saw1 = this.context.createOscillator();
        var saw2 = this.context.createOscillator();
        var filter = this.context.createBiquadFilter();
        var gainNode = this.context.createGain();
        saw1.type = saw2.type = OscillatorNode.SAWTOOTH;
        saw1.connect(filter);
        saw2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.mixer);

        // Set the frequency of the saw waves based on the given note.
        // The two saw oscillators have the same frequency but they are
        // slightly detuned to add some width.
        saw1.frequency.value = saw2.frequency.value = note;
        saw1.detune.value = Math.pow(2, 1/12) * -7;
        saw2.detune.value = Math.pow(2, 1/12) * 7;

        // Set the filter settings. The frequency will be modulates by the
        // envelope later.
        filter.type = BiquadFilterNode.LOWPASS;
        filter.Q.value = 5;

        // Add amplitude (gain) envelope.
        // Amplitudes: 0 -> 1 -> 0.2 -> 0
        // Timing: Attack 100 -> Decay 10 -> Sustain 3 -> Release 10
        var endTime = this.ADSREnvelope(gainNode.gain, time, 0, 1, 100, 10, 0.3, 3, 10);

        // Add filter envelope.
        // Frequencies: 100 -> 4000 -> 1000
        // Timing: Attack 100 -> Decay 10 -> Sustain 5 -> Release 10
        this.ADSREnvelope(filter.frequency, time, 100, 4000, 100, 10, 1000, 5, 10);

        saw1.start(time);
        saw1.stop(endTime);
        saw2.start(time);
        saw2.stop(endTime);
    };

    return Wapi;
});
