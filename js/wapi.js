define(['wapi-core', 'wapi-instruments', 'wapi-viz'], function(Wapi) {
    // All we do here is expose the Wapi object to the window so it can be used
    // globally.
    // XXX: Maybe this is not necessary. Maybe sub-modules can use require to
    // take in the object and instantiate it themselves. This has to be thought
    // through some more.
    var w = new Wapi();
    window.Wapi = w;
    return w;
});
