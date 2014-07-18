require(['wapi'], function() {

    window.bassExample = function() {
        Wapi.reset();
        Wapi.loop = false;
    
        var seq = function(time, beatIndex) {
            if (beatIndex % 8 == 0) {
                Wapi.electroSynthBass(time, Wapi.NOTES.C2);
            }
    
            if (beatIndex % 8 == 4) {
                Wapi.electroSynthBass(time, Wapi.NOTES.D2);
            }
        };
    
        Wapi.addSequence(seq);
    }
});
