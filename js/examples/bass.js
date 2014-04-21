var bassExample = function() {
    wapi.reset();
    wapi.loop = false;

    var seq = function(time, beatIndex) {
        if (beatIndex % 8 == 0) {
            wapi.electroSynthBass(time, wapi.NOTES.C2);
        }

        if (beatIndex % 8 == 4) {
            wapi.electroSynthBass(time, wapi.NOTES.D2);
        }
    };

    wapi.addSequence(seq);
}
