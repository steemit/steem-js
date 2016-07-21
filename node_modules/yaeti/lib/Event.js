/**
 * Expose the Event class.
 */
module.exports = _Event;


function _Event(type) {
	this.type = type;
	this.isTrusted = false;
}
