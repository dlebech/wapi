window.bassExample = function() {
  var wapi = new Wapi();

  // Create a new Wapi track
  var bassTrack = wapi.createTrack();

  // Create a bass from the WapiBass plugin and add it to the track.
  var bass = new WapiBass(wapi.context);
  bassTrack.addPlugin(bass);

  // Add simple bass sequence
  bassTrack.addSequence(function(time, beatIndex) {
    var notes = [];
    if (beatIndex % 8 === 0) {
      notes.push('C2');
    }

    if (beatIndex % 8 === 4) {
      notes.push('D2');
    }
    return notes;
  });

  wapi.play();
};
