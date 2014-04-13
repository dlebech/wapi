(function(wapi) {
    wapi.reset();
    wapi.loop = false;

    var keyboardFunc = wapi.piano.bind(wapi);

    // Play Frère Jacques.
    // Aka. Brother John / Brother Peter / Are You Sleeping? / Mester Jacob
    var seq = function(time, beatIndex) {
        if (beatIndex == 0)
            keyboardFunc(time, wapi.NOTES.C4);

        if (beatIndex == 4)
            keyboardFunc(time, wapi.NOTES.D4);

        if (beatIndex == 8)
            keyboardFunc(time, wapi.NOTES.E4);

        if (beatIndex == 12)
            keyboardFunc(time, wapi.NOTES.C4);
    };
    

    var seq2 = function(time, beatIndex) {
        if (beatIndex == 0)
            keyboardFunc(time, wapi.NOTES.E4);

        if (beatIndex == 4)
            keyboardFunc(time, wapi.NOTES.F4);

        if (beatIndex == 8)
            keyboardFunc(time, wapi.NOTES.G4);
    };

    var seq3 = function(time, beatIndex) {
        if (beatIndex == 0)
            keyboardFunc(time, wapi.NOTES.G4);

        if (beatIndex == 2)
            keyboardFunc(time, wapi.NOTES.A4);

        if (beatIndex == 4)
            keyboardFunc(time, wapi.NOTES.G4);

        if (beatIndex == 6)
            keyboardFunc(time, wapi.NOTES.F4);

        if (beatIndex == 8)
            keyboardFunc(time, wapi.NOTES.E4);

        if (beatIndex == 12)
            keyboardFunc(time, wapi.NOTES.C4);
    };

    var seq4 = function(time, beatIndex) {
        if (beatIndex == 0)
            keyboardFunc(time, wapi.NOTES.C4);

        if (beatIndex == 4)
            keyboardFunc(time, wapi.NOTES.G3);

        if (beatIndex == 8)
            keyboardFunc(time, wapi.NOTES.C4);

    };

    wapi.addSequence(seq);
    wapi.addSequence(seq);

    wapi.addSequence(seq2);
    wapi.addSequence(seq2);

    wapi.addSequence(seq3);
    wapi.addSequence(seq3);

    wapi.addSequence(seq4);
    wapi.addSequence(seq4);

    // Don't play it. Let the user decide that...

})(window.wapi);
