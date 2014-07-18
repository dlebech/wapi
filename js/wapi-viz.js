define(['wapi-core'], function(Wapi) {

    Wapi.prototype.visualizeAt = function(canvasSelector) {
        var elem = document.getElementById(canvasSelector);
        var ctx = elem.getContext('2d');
        ctx.fillText('hej', 100, 100);
    };
});
