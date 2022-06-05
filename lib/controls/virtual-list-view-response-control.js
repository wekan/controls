'use strict'

const { Ber, BerReader, BerWriter } = require('@ldapjs/asn1')
const isObject = require('../is-object')
const hasOwn = require('../has-own')
const Control = require('../control')
const CODES = require('@ldapjs/codes')

const validCodeNames = [
  'LDAP_SUCCESS',
  'LDAP_OPERATIONS_ERROR',
  'LDAP_UNWILLING_TO_PERFORM',
  'LDAP_INSUFFICIENT_ACCESS_RIGHTS',
  'LDAP_BUSY',
  'LDAP_TIME_LIMIT_EXCEEDED',
  'LDAP_STRONG_AUTH_REQUIRED',
  'LDAP_ADMIN_LIMIT_EXCEEDED',
  'LDAP_SORT_CONTROL_MISSING',
  'LDAP_INDEX_RANGE_ERROR',
  'LDAP_CONTROL_ERROR',
  'LDAP_OTHER'
]

const filteredCodes = Object.entries(CODES).filter(([k, v]) => validCodeNames.includes(k))
const VALID_CODES = new Map([
  ...filteredCodes,
  ...filteredCodes.map(([k, v]) => { return [v, k] })
])

// TODO: complete this doc block based on the "implements" spec link
/**
 * @typedef {object} VirtualListViewResponseControlValue
 * @property {number} result A valid LDAP response code for the control.
 */

/**
 * Implements:
 * https://datatracker.ietf.org/doc/html/draft-ietf-ldapext-ldapv3-vlv-07#section-6.2
 *
 * @extends Control
 */
class VirtualListViewResponseControl extends Control {
  static OID = '2.16.840.1.113730.3.4.10'

  /**
   * A map of possible response codes. Includes `CODE => VALUE` and
   * `VALUE => CODE`. For example, `RESPONSE_CODES.get(0)` returns
   * `LDAP_SUCCESS`, and `RESPONSE_CODES.get('LDAP_SUCCESS')` returns `0`.
   */
  static RESPONSE_CODES = Object.freeze(VALID_CODES)

  constructor (options = {}) {
    options.type = VirtualListViewResponseControl.OID
    options.criticality = false
    super(options)

    this.value = {}

    if (hasOwn(options, 'value') === false || !options.value) {
      // return
      throw Error('control not enabled')
    }

    const value = options.value
    if (Buffer.isBuffer(value)) {
      this.#parse(options.value)
    } else if (isObject(value)) {
      if (VALID_CODES.has(value.result) === false) {
        throw new Error('Invalid result code')
      }
      this.value = options.value
    } else {
      throw new TypeError('options.value must be a Buffer or Object')
    }

    throw Error('control not enabled')
  }

  get value () {
    return this._value
  }

  set value (obj) {
    this._value = Object.assign({}, this._value, obj)
  }

  #parse (buffer) {
    const ber = new BerReader(buffer)
    if (ber.readSequence()) {
      this._value = {}

      if (ber.peek(0x02)) {
        this._value.targetPosition = ber.readInt()
      }

      if (ber.peek(0x02)) {
        this._value.contentCount = ber.readInt()
      }

      this._value.result = ber.readEnumeration()
      this._value.cookie = ber.readString(Ber.OctetString, true)

      // readString returns '' instead of a zero-length buffer
      if (!this._value.cookie) {
        this._value.cookie = Buffer.alloc(0)
      }

      return true
    }

    return false
  }

  _toBer (ber) {
    if (this.value.length === 0) { return }

    const writer = new BerWriter()
    writer.startSequence()
    if (this.value.targetPosition !== undefined) {
      writer.writeInt(this.value.targetPosition)
    }
    if (this.value.contentCount !== undefined) {
      writer.writeInt(this.value.contentCount)
    }

    writer.writeEnumeration(this.value.result)
    if (this.value.cookie && this.value.cookie.length > 0) {
      writer.writeBuffer(this.value.cookie, Ber.OctetString)
    } else {
      writer.writeString('') // writeBuffer rejects zero-length buffers
    }

    writer.endSequence()
    ber.writeBuffer(writer.buffer, 0x04)
  }

  _updatePlainObject (obj) {
    obj.controlValue = this.value
    return obj
  }
}
module.exports = VirtualListViewResponseControl
