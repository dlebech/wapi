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
     * Plays back a drum snare.
     *
     * @param {int} time - The time that the instrument will start playing.
     */
    Wapi.prototype.drumSnare = function(time) {
        // A drum snare is a drum synth with some added noise.
        // Node network:
        // noise -> lowpass_filter -> gain -> destination
        
        var gainNode = this.context.createGain();
        gainNode.connect(this.context.destination);

        // How long time the entire beat and gain decay takes.
        var gainDecay = 3;
        var gainDecayTime = time + 1/gainDecay;

        // How long time it takes for the gain to reach full volume.
        var gainTime = time + 1/gainDecay/20;

        // Make a slight increase in gain in the beginning to simulate a
        // hitting pedal or snare. Basically, go from silence to loud in a very
        // short timespan and then back to silence.
        gainNode.gain.value = 0;
        gainNode.gain.setValueAtTime(1, gainTime);
        gainNode.gain.linearRampToValueAtTime(0, gainDecayTime);

        // Create new NoiseNode and pass it through a low-pass filter.
        var noise = new NoiseNode(this.context);
        var filter = this.context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 4000;
        filter.Q.value = 5;
        noise.connect(filter);
        filter.connect(gainNode);
        noise.start(time);
        noise.stop(gainDecayTime);
        this.drum(time, this.context.destination, 400, 100, gainDecay, gainDecay);
    };

    /**
     * Plays back a nice low drum kick.
     *
     * @param {int} time - The time that the instrument will start playing.
     */
    Wapi.prototype.drumKick = function(time) {
        // Uses the base drum sound with a 100 -> 50 hertz frequency drop that
        // happens quite fast.
        this.drum(time, this.context.destination, 100, 50, 60, 10);
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
        // The drum sound is made by making a drop-off in both frequency and
        // gain (volume).
        // The frequency drop-off is usually faster than the gain drop-off,
        // depending on the given parameters.

        // Node network:
        // sine -> gain -> destination
        var sineNode = this.context.createOscillator();
        var gainNode = this.context.createGain();
        sineNode.connect(gainNode);
        gainNode.connect(destination);

        // How long time the frequency decay takes.
        var freqDecayTime = time + 1/frequencyDecay;

        // setValueAtTime creates an exponential ramp to the given value.
        sineNode.frequency.value = startFrequency;
        sineNode.frequency.setValueAtTime(endFrequency, freqDecayTime);

        // How long time the entire beat and gain decay takes.
        var gainDecayTime = time + 1/gainDecay;

        // How long time it takes for the gain to reach full volume.
        var gainTime = time + 1/gainDecay/20;

        // Make a slight increase in gain in the beginning to simulate a
        // hitting pedal or snare. Basically, go from silence to loud in a very
        // short timespan and then back to silence.
        gainNode.gain.value = 0;
        gainNode.gain.setValueAtTime(1, gainTime);
        gainNode.gain.linearRampToValueAtTime(0, gainDecayTime);

        // Start the sine node.
        sineNode.start(time);
        sineNode.stop(gainDecayTime);
    };

    window.wapi = new Wapi();
})();
