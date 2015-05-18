/**
 * Interface for a plugin. A plugin can be an effect or instrument and can be
 * part of a chain of plugins. A plugin is similar to an AudioNode and
 * implements the connect and disconnect methods.
 * @interface
 */

/**
 * Disconnects this plugin
 *
 * @method
 * @name WapiPlugin#disconnect
 */

/**
 * Connects this plugin to the given destination.
 *
 * @method
 * @name WapiPlugin#connect
 * @param {AudioNode|WapiPlugin} destination
 */

// This interface is specified with virtual comments.
// See http://usejsdoc.org/tags-interface.html
