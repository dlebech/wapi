/**
 * wapi 0.1
 * Copyright 2014, David Volquartz Lebech.
 * Licensed under MIT.
 */
(function() {
    var audioContextClass = (window.AudioContext || 
        window.webkitAudioContext || 
        window.mozAudioContext || 
        window.oAudioContext || 
        window.msAudioContext);

    // Notes in the equal tempered note scale (Middle A (A4) == 440 hertz)
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

    // The main wapi object.
    var Wapi = function () {
        this.context = new audioContextClass();
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
        // This schedule 
        this.scheduleAheadTime = 0.1;

        // Determines whether or not sequences should be restarted once they
        // reach the end. This is a good way of creating live sequencing by
        // having a single sequence and looping it.
        this.loop = true;

        // The main mixer node. Instruments should always connect to this node
        // instead of the context destination because the main mixer goes
        // through a dynamic compressor that helps mitigate clipping issues
        // when multiple sounds are playing at the same time.
        //
        // The mixer is set up in a separate function to avoid some timing
        // issues.
        this.mixer = null;
    };

    // Sets up the master audio mixer.
    Wapi.prototype.setupMixer = function() {
        // Creates the following node network:
        // [instruments] -> mixer -> compressor -> speakers (destination)
        
        var compressor = this.context.createDynamicsCompressor();
        compressor.connect(this.context.destination);

        this.mixer = this.context.createGain();
        this.mixer.connect(compressor);
    };

    // Adds the specified sequences to the sequencer.
    // A sequence is a JavaScript function which consist of calls to the
    // different instruments in the sequence.
    Wapi.prototype.addSequence = function(sequence) {
        this.sequences.push(sequence);
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
        // Schedule beats ahead.
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

    // Starts playback.
    Wapi.prototype.play = function() {
        if (this.sequences.length == 0)
            alert('Need at least one sequence');
        else {
            this.playing = true;
            this.setupMixer();
            this.schedule();
        }
    };

    // Stop playback.
    Wapi.prototype.stop = function() {
        this.playing = false;
    };

    Wapi.prototype.reset = function() {
        this.stop();
        this.sequences = [];
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
            var releaseTime = sustainTime + 1/sustain;
            param.linearRampToValueAtTime(minValue, releaseTime);

            return releaseTime;
        }
        return decayTime;
    };

    /**
     * Plays back a very synth-y drum snare.
     *
     * @param {int} time - The time that the instrument will start playing.
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
        var noise = new NoiseNode(this.context);
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
     * Plays back a nice low drum kick.
     *
     * @param {int} time - The time that the instrument will start playing.
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
     * Plays a simple saw note. The saw node sounds slightly "noisy".
     */
    Wapi.prototype.saw = function(time, note) {
        // The saw note is just a simple note with a sawtooth waveform.
        this.simpleNote(time, note, OscillatorNode.SAWTOOTH);
    };

    /**
     * Plays a simple piano note. Well, heavily synthesized piano node, that
     * is.
     */
    Wapi.prototype.piano = function(time, note) {
        // For now, the piano note is just a sine wave.
        this.simpleNote(time, note, OscillatorNode.SINE);
    };

    /**
     * Plays a simple retro note. Calling it retro is probably weird but it
     * sounds like those good old C64, Amiga or Nintendo sounds.
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
     * @param {float} note - The note to play.
     * @param {OscillatorNode.type} type - The type of the waveform.
     */
    Wapi.prototype.simpleNote = function(time, note, type) {
        // Node network:
        // wave -> gain -> master mixer
        var node = this.context.createOscillator();
        node.type = type;
        var gainNode = this.context.createGain();
        node.connect(gainNode);
        gainNode.connect(this.mixer);

        // The frequency of note does not change over time.
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

    window.wapi = new Wapi();
})();