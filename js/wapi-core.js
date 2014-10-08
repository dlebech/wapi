define(function() {
    /**
     * Core class that holds all the base functionality of Wapi.
     *
     * @class WapiCore
     * @copyright 2014 David Volquartz Lebech
     * @license MIT
     */

    var audioContextClass = (window.AudioContext || 
        window.webkitAudioContext || 
        window.mozAudioContext || 
        window.oAudioContext || 
        window.msAudioContext);

    // 8 octaves of notes in the equal tempered note scale
    // (Middle A (A4) == 440 hertz)
    var notes = (function () {
        var notes = {};

        // Notes on the same octave start at C and end at B.
        // There are 12 notes for each octave.
        // The lower-case s is used instead of # so referencing the notes is
        // easier, i.e. notes.Cs instead of notes['C#']
        var noteSymbols= ['C',  'Cs', 'D',  'Ds', 'E',  'F',
                          'Fs', 'G',  'Gs', 'A',  'As', 'B'];
        
        // http://www.phy.mtu.edu/~suits/NoteFreqCalcs.html
        // fn = A4 * a^n
        // A4 = 440 hertz
        // a = 2^(1/12)
        // n = number of half-steps (semitones) from A4
        var noteConstant = Math.pow(2, 1/12)

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
        return notes;
    })();

    // Noise node copied from liv3c0der project.
    // Copyright Jan Krutisch, MIT license.
    var NoiseNode = (function() {
        NoiseNode.makeBuffer = function(ac, length) {
            var array, i, word, _i, _len;

            if (length == null) {
                length = 1;
            }
            this.buffer = ac.createBuffer(1, 44100 * length, 44100);
            array = this.buffer.getChannelData(0);
            for (i = _i = 0, _len = array.length; _i < _len; i = ++_i) {
                word = array[i];
                array[i] = Math.random() * 2 - 1;
            }
            return this.buffer;
        };

        function NoiseNode(ac, buffer) {
            this.ac = ac;
            this.buffer = buffer;
            if (!this.buffer) {
                this.buffer = NoiseNode.makeBuffer(this.ac, 1);
            }
            this.source = ac.createBufferSource();
            this.source.buffer = this.buffer;
        }

        NoiseNode.prototype.connect = function(dest) {
            return this.source.connect(dest);
        };

        NoiseNode.prototype.start = function(time) {
            return this.source.start(time);
        };

        NoiseNode.prototype.stop = function(time) {
            return this.source.stop(time);
        };

        return NoiseNode;

    })();

    /**
     * @constructor
     */
    var Wapi = function () {
        this.context = new audioContextClass();

        /**
         * An object containing 8 octaves of pre-calculated notes (C0-B7) where
         * A4 = 440 hertz.
         *
         * @const
         * @memberOf Wapi
         * @example
         * var aNote = wapi.NOTES.C4;
         */
        this.NOTES = notes;

        // Controls playback.
        this.playing = false;

        // Beats per minute
        this.bpm = 120.0;

        // Sequence list as well as indexes for the current sequence and
        // current beat.
        this.sequences = [];
        this.currentSequenceIndex = 0;
        this.currentBeatIndex = 0;

        this.nextBeatTime = 0;

        // Determines how many milliseconds to look ahead for new schedules.
        this.lookAheadTime = 25.0;

        // Determines how far ahead to schedule beats.
        this.scheduleAheadTime = 0.5;

        // Determines whether or not sequences should be restarted once they
        // reach the end. This is a good way of creating live sequencing by
        // having a single sequence and looping it.
        this.loop = true;

        // The main mixer node. Instruments should always connect to this node
        // instead of the context destination because the main mixer goes
        // through a dynamic compressor that helps mitigate clipping issues
        // when multiple sounds are playing at the same time.
        this.mixer = this.context.createGain();

        // Create a compressor and send the master mix to this compressor.
        var compressor = this.context.createDynamicsCompressor();
        this.mixer.connect(compressor);

        // Create an analyser and connect the compressor to the analyser.
        // The analyser is the last node before final output.
        this.analyser = this.context.createAnalyser();
        compressor.connect(this.analyser);
        this.analyser.connect(this.context.destination);
    };

    // Fetches the next beat from the currently playing sequence.
    Wapi.prototype.nextBeat = function() {
        // Calculate current seconds per beat.
        var secondsPerBeat = 60.0 / this.bpm;
        this.nextBeatTime += 0.25 * secondsPerBeat;

        // Increment beat index and reset if at beat 16.
        this.currentBeatIndex++;
        if (this.currentBeatIndex == 16) {
            this.currentBeatIndex = 0;

            // Increment sequence index and check to see if there are more
            // sequences.
            this.currentSequenceIndex++;
            if (this.currentSequenceIndex == this.sequences.length) {
                this.currentSequenceIndex = 0;
                if (!this.loop)
                    this.playing = false;
            }
        }
    };

    // Schedules a a single beat for playing in the current sequence.
    Wapi.prototype.scheduleBeat = function(time) {
        var sequence = this.sequences[this.currentSequenceIndex];
        sequence(time, this.currentBeatIndex);
    };

    // Schedules a series of beats in the current sequence.
    Wapi.prototype.schedule = function() {
        var scheduleUntil = this.context.currentTime + this.scheduleAheadTime;
        while (this.playing && this.nextBeatTime < scheduleUntil) {
            this.scheduleBeat(this.nextBeatTime);
            this.nextBeat();
        }

        // Re-schedule if we are still playing
        if (this.playing) {
            window.setTimeout(function() {
                this.schedule();
            }.bind(this), this.lookAheadTime);
        }
    };

    /**
     * Adds the specified sequence to the sequencer.
     *
     * @param {function} sequence - A JavaScript function which consist of
     * calls to the different instruments in the sequence.
     *
     * @example
     * var mySequence = function(time, beatIndex) {
     *     if (beatIndex % 4 == 0)
     *         wapi.drumKick(time);
     * }
     * wapi.addSequence(mySequence);
     * @method
     * @memberOf Wapi
     */
    Wapi.prototype.addSequence = function(sequence) {
        this.sequences.push(sequence);
    };

    /**
     * Starts playback
     * @method 
     * @memberof Wapi
     */
    Wapi.prototype.play = function() {
        if (this.sequences.length == 0)
            alert('Need at least one sequence');
        else {
            this.playing = true;
            this.nextBeatTime = this.context.currentTime;
            this.schedule();
        }
    };

    /**
     * Stops playback.
     * @method 
     * @memberof Wapi
     */
    Wapi.prototype.stop = function() {
        this.playing = false;
    };

    /**
     * Reset playback.
     * @method 
     * @memberof Wapi
     */
    Wapi.prototype.reset = function() {
        this.stop();
        this.sequences = [];
        this.currentSequenceIndex = 0;
        this.currentBeatIndex = 0;
    };

    /**
     * Creates an Attack Decay Sustain Release envelope (ADSR) for the given
     * AudioNode parameter.
     *
     * Notice that larger values of time give shorter intervals for the
     * parameter, e.g. a decay time of 10 is shorter than a decay time of 3.
     *
     * To use purely as attack-decay node, simply leave out the sustain and
     * release parameters.
     *
     * @param {AudioParam} param - The audio parameter to create the envelope
     * for, e.g. frequency for a sine node or gain for a gain node.
     * @param {int} startTime - The start time for the envelope.
     * @param {float} minValue - The minimum value.
     * @param {float} maxValue - The maximum or peak value.
     * @param {int} attack - The attack time.
     * @param {int} decay - The decay time.
     * @param {float} sustainValue - The value for the sustain.
     * @param {int} sustain - The sustain time.
     * @param {int} release - The release time.
     * @method 
     * @memberof Wapi
     */
    Wapi.prototype.ADSREnvelope = function(param, startTime, minValue,
            maxValue, attack, decay, sustainValue, sustain, release) {
        // http://en.wikipedia.org/wiki/Synthesizer#ADSR_envelope
        //
        // Here is how it looks in ASCII... because we like ASCII.
        //      /\
        //     /  \
        //    /    \
        //   /      \
        //  /        \-----\
        // /                \
        // A     D    S    R
        
        // Set initial value.
        param.setValueAtTime(0, startTime);
        
        // Attack
        // If the attack is set to 0, it means that there is no attack phase
        // and the maxValue is set immediately.
        // This can be useful for frequencies.
        var attackTime = startTime;
        if (attack > 0) {
            attackTime = startTime + 1/attack;
        }
        param.linearRampToValueAtTime(maxValue, attackTime);

        // Decay
        var decayTime = attackTime + 1/decay;
        sustainValue = sustainValue || minValue;
        param.linearRampToValueAtTime(sustainValue, decayTime);

        if (sustainValue > 0 && sustain > 0 && release > 0) {
            // Sustain
            // Don't do anything except calculate the sustain time.
            var sustainTime = decayTime + 1/sustain;

            // Release
            var releaseTime = sustainTime + 1/release;
            param.linearRampToValueAtTime(minValue, releaseTime);

            return releaseTime;
        }
        return decayTime;
    };

    Wapi.prototype.createNoise = function() {
        return new NoiseNode(this.context);
    };

    return Wapi;
});
