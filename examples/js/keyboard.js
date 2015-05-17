window.keyboardExample = function() {
    
    Wapi.reset();
    Wapi.loop = false;

    var keyboardFunc = Wapi.clean.bind(Wapi);

    // Play Frère Jacques.
    // Aka. Brother John / Brother Peter / Are You Sleeping? / Mester Jacob
    var seq = function(time, beatIndex) {
        if (beatIndex == 0)
            keyboardFunc(time, Wapi.NOTES.C4);

        if (beatIndex == 4)
            keyboardFunc(time, Wapi.NOTES.D4);

        if (beatIndex == 8)
            keyboardFunc(time, Wapi.NOTES.E4);

        if (beatIndex == 12)
            keyboardFunc(time, Wapi.NOTES.C4);
    };
    

    var seq2 = function(time, beatIndex) {
        if (beatIndex == 0)
            keyboardFunc(time, Wapi.NOTES.E4);

        if (beatIndex == 4)
            keyboardFunc(time, Wapi.NOTES.F4);

        if (beatIndex == 8)
            keyboardFunc(time, Wapi.NOTES.G4);
    };

    var seq3 = function(time, beatIndex) {
        if (beatIndex == 0)
            keyboardFunc(time, Wapi.NOTES.G4);

        if (beatIndex == 2)
            keyboardFunc(time, Wapi.NOTES.A4);

        if (beatIndex == 4)
            keyboardFunc(time, Wapi.NOTES.G4);

        if (beatIndex == 6)
            keyboardFunc(time, Wapi.NOTES.F4);

        if (beatIndex == 8)
            keyboardFunc(time, Wapi.NOTES.E4);

        if (beatIndex == 12)
            keyboardFunc(time, Wapi.NOTES.C4);
    };

    var seq4 = function(time, beatIndex) {
        if (beatIndex == 0)
            keyboardFunc(time, Wapi.NOTES.C4);

        if (beatIndex == 4)
            keyboardFunc(time, Wapi.NOTES.G3);

        if (beatIndex == 8)
            keyboardFunc(time, Wapi.NOTES.C4);

    };

    Wapi.addSequence(seq);
    Wapi.addSequence(seq);

    Wapi.addSequence(seq2);
    Wapi.addSequence(seq2);

    Wapi.addSequence(seq3);
    Wapi.addSequence(seq3);

    Wapi.addSequence(seq4);
    Wapi.addSequence(seq4);
};
