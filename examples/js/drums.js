window.drumsExample = function(canvasContainer) {
  var wapi = new Wapi();

  // Create a new Wapi track
  var drumTrack = wapi.createTrack();

  // Create a drum track from the WapiDrums plugin and add it to the track.
  var drums = new WapiDrums(wapi.context);
  drumTrack.addPlugin(drums);

  // Create an analyzer
  var analyzer = new Analyzer(wapi.context);
  drumTrack.addPlugin(analyzer);
  canvasContainer.appendChild(analyzer.createFrequencyGraph(300, 300));

  // Add simple drum sequence
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
