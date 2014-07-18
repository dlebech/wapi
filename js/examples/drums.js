require(['wapi'], function() {

    window.drumsExample = function() {
        Wapi.reset();
        Wapi.loop = false;
    
        // Start out with a drum kick baseline.
        var seq = function(time, beatIndex) {
            if (beatIndex % 4 == 0)
                Wapi.drumKick(time);
        };
        
        Wapi.addSequence(seq);
        Wapi.addSequence(seq);
    
        // Add a snare on top of the beat.
        var seq2 = function(time, beatIndex) {
            seq(time, beatIndex);
    
            if (beatIndex % 8 == 4)
                Wapi.drumSnare(time);
        }
    
        // Add a little extra snare in at the end of the beat cycle.
        var seq3 = function(time, beatIndex) {
            seq2(time, beatIndex);
    
            if (beatIndex > 13)
                Wapi.drumSnare(time);
        };
    
        Wapi.addSequence(seq2);
        Wapi.addSequence(seq2);
        Wapi.addSequence(seq2);
        Wapi.addSequence(seq3);
    }
});
