var drumsExample = function() {
    wapi.reset();
    wapi.loop = false;

    // Start out with a drum kick baseline.
    var seq = function(time, beatIndex) {
        if (beatIndex % 4 == 0)
            wapi.drumKick(time);
    };
    
    wapi.addSequence(seq);
    wapi.addSequence(seq);

    // Add a snare on top of the beat.
    var seq2 = function(time, beatIndex) {
        seq(time, beatIndex);

        if (beatIndex % 8 == 4)
            wapi.drumSnare(time);
    }

    // Add a little extra snare in at the end of the beat cycle.
    var seq3 = function(time, beatIndex) {
        seq2(time, beatIndex);

        if (beatIndex > 13)
            wapi.drumSnare(time);
    };

    wapi.addSequence(seq2);
    wapi.addSequence(seq2);
    wapi.addSequence(seq2);
    wapi.addSequence(seq3);
}
