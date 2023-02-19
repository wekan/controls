'use strict'

const { BerReader, BerWriter } = require('@ldapjs/asn1')
const Control = require('../control')
const isObject = require('../is-object')
const hasOwn = require('../has-own')
const CODES = require('@ldapjs/codes')

const validCodeNames = [
  'LDAP_SUCCESS',
  'LDAP_OPERATIONS_ERROR',
  'LDAP_TIME_LIMIT_EXCEEDED',
  'LDAP_STRONG_AUTH_REQUIRED',
  'LDAP_ADMIN_LIMIT_EXCEEDED',
  'LDAP_NO_SUCH_ATTRIBUTE',
  'LDAP_INAPPROPRIATE_MATCHING',
  'LDAP_INSUFFICIENT_ACCESS_RIGHTS',
  'LDAP_BUSY',
  'LDAP_UNWILLING_TO_PERFORM',
  'LDAP_OTHER'
]

const filteredCodes = Object.entries(CODES).filter(([k, v]) => validCodeNames.includes(k))
const VALID_CODES = new Map([
  ...filteredCodes,
  ...filteredCodes.map(([k, v]) => { return [v, k] })
])

/**
 * @typedef {object} ServerSideSortingResponseControlResult
 * @property {number} result
 * @property {string} failedAttribute
 */

/**
 * Implements:
 * https://datatracker.ietf.org/doc/html/draft-ietf-ldapext-sorting#section-3.2
 *
 * @extends Control
 */
class ServerSideSortingResponseControl extends Control {
  static OID = '1.2.840.113556.1.4.474'

  /**
   * A map of possible response codes. Includes `CODE => VALUE` and
   * `VALUE => CODE`. For example, `RESPONSE_CODES.get(0)` returns
   * `LDAP_SUCCESS`, and `RESPONSE_CODES.get('LDAP_SUCCESS')` returns `0`.
   */
  static RESPONSE_CODES = Object.freeze(VALID_CODES)

  /**
   * @typedef {ControlParams} ServerSideSortingResponseParams
   * @property {ServerSideSortingResponseControlResult | Buffer} value
   */

  /**
   * Creates a new server side sorting response control.
   *
   * @param {ServerSideSortingResponseParams} [options]
   */
  constructor (options = {}) {
    options.type = ServerSideSortingResponseControl.OID
    options.criticality = false
    super(options)

    this.value = {}

    if (hasOwn(options, 'value') === false || !options.value) {
      return
    }

    const value = options.value
    if (Buffer.isBuffer(value)) {
      this.#parse(value)
    } else if (isObject(value)) {
      if (VALID_CODES.has(value.result) === false) {
        throw new Error('Invalid result code')
      }
      if (hasOwn(value, 'failedAttribute') && (typeof value.failedAttribute) !== 'string') {
        throw new Error('failedAttribute must be String')
      }

      this.value = value
    } else {
      throw new TypeError('options.value must be a Buffer or Object')
    }
  }

  get value () {
    return this._value
  }

  set value (obj) {
    this._value = Object.assign({}, this._value, obj)
  }

  #parse (buffer) {
    const ber = new BerReader(buffer)
    /* istanbul ignore else */
    if (ber.readSequence(0x30)) {
      this._value = {}
      this._value.result = ber.readEnumeration()
      /* istanbul ignore else */
      if (ber.peek() === 0x80) {
        this._value.failedAttribute = ber.readString(0x80)
      }
    }
  }

  _toBer (ber) {
    if (!this._value || Object.keys(this._value).length === 0) { return }

    const writer = new BerWriter()
    writer.startSequence(0x30)
    writer.writeEnumeration(this.value.result)
    /* istanbul ignore else */
    if (this.value.result !== CODES.LDAP_SUCCESS && this.value.failedAttribute) {
      writer.writeString(this.value.failedAttribute, 0x80)
    }
    writer.endSequence()
    ber.writeBuffer(writer.buffer, 0x04)
  }

  _updatePlainObject (obj) {
    obj.controlValue = this.value
    return obj
  }
}
module.exports = ServerSideSortingResponseControl
