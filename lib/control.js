'use strict'

const { BerWriter } = require('asn1')

module.exports = Control

/**
 * Baseline LDAP control object. Implements
 * https://tools.ietf.org/html/rfc4511#section-4.1.11
 *
 * @param {object} [options]
 * @param {string} [options.type=''] The dotted decimal control type value.
 * @param {boolean} [options.criticality=false] Criticality value for the control.
 * @param {string|Buffer} [options.value] The value for the control. If this is
 * a `string` then it will be written as-is. If it is an instance of `Buffer`
 * then it will be written by `value.toString()`.
 *
 * @typedef {object} Control
 */
function Control (options) {
  if ((this instanceof Control) === false) return new Control(options)

  const opts = Object.assign({ type: '', criticality: false, value: null }, options)
  this.type = opts.type
  this.criticality = opts.criticality
  this.value = opts.value
}

/**
 * Serializes the control instance into an LDAP style control object, e.g.
 * `type` => `controlType`. If an instance has a `_json(obj)` method then the
 * built object will be sent to that method and the resulting mutated object
 * returned.
 *
 * @alias json
 * @memberof! Control#
 */
Object.defineProperty(Control.prototype, 'json', {
  get: function getJson () {
    const obj = {
      controlType: this.type,
      criticality: this.criticality,
      controlValue: this.value
    }
    return (typeof (this._json) === 'function' ? this._json(obj) : obj)
  }
})

/**
 * Converts the instance into a [BER](http://luca.ntop.org/Teaching/Appunti/asn1.html)
 * representation.
 *
 * @param {BerWriter} [ber] An empty `BerWriter` instance to populate.
 *
 * @returns {object} A BER object.
 */
Control.prototype.toBer = function toBer (ber = new BerWriter()) {
  ber.startSequence()
  ber.writeString(this.type || '')
  ber.writeBoolean(this.criticality)
  if (typeof (this._toBer) === 'function') {
    this._toBer(ber)
  } else {
    if (this.value) {
      if (typeof this.value === 'string') {
        ber.writeString(this.value)
      } else if (Buffer.isBuffer(this.value)) {
        ber.writeString(this.value.toString())
      }
    }
  }

  ber.endSequence()
  return ber
}

/**
 * Alias for {@link Control#json}.
 *
 * @returns {object}
 */
Control.prototype.toString = function toString () {
  return this.json
}
