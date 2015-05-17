window.drumsExample = function() {
  var wapi = new Wapi();

  // Create a new Wapi track
  var drumTrack = wapi.createTrack();

  // Create a bass from the WapiBass plugin and add it to the track.
  var drums = new WapiDrums(wapi.context);
  drumTrack.addPlugin(drums);

  // Add simple bass sequence
  drumTrack.addSequence(function(time, beatIndex) {
    var notes = [];
    if (beatIndex % 4 == 0) {
      notes.push('C4');
    }
    return notes;
  });

  drumTrack.addSequence(function(time, beatIndex) {
    var notes = [];

    if (beatIndex % 4 == 0) {
      notes.push('C4');
    }

    if (beatIndex % 8 == 4) {
      notes.push('D4');
    }

    return notes;
  });

  drumTrack.addSequence(function(time, beatIndex) {
    var notes = [];

    if (beatIndex % 4 == 0) {
      notes.push('C4');
    }

    if (beatIndex % 8 == 4 || beatIndex > 13) {
      notes.push('D4');
    }

    return notes;
  });

  wapi.play();
};
