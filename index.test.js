'use strict'

const tap = require('tap')
const { BerReader, BerWriter } = require('@ldapjs/asn1')
const controls = require('.')

tap.test('#getControl', t => {
  t.test('requires a BER to parse', async t => {
    try {
      controls.getControl()
      t.fail('should throw exception')
    } catch (error) {
      t.match(error, /ber must be provided/)
    }
  })

  t.test('returns null for empty BER', async t => {
    const result = controls.getControl(new BerReader(Buffer.alloc(0)))
    t.equal(result, null)
  })

  t.test('parses a BER (control)', async t => {
    const ber = new BerWriter()
    ber.startSequence()
    ber.writeString('2.16.840.1.113730.3.4.2')
    ber.writeBoolean(true)
    ber.writeString('foo')
    ber.endSequence()

    const control = controls.getControl(new BerReader(ber.buffer))

    t.ok(control)
    t.equal(control.type, '2.16.840.1.113730.3.4.2')
    t.ok(control.criticality)
    t.equal(control.value.toString('utf8'), 'foo')
    t.end()
  })

  t.test('parses BER with no value', function (t) {
    const ber = new BerWriter()
    ber.startSequence()
    ber.writeString('2.16.840.1.113730.3.4.2')
    ber.endSequence()

    const control = controls.getControl(new BerReader(ber.buffer))

    t.ok(control)
    t.equal(control.type, '2.16.840.1.113730.3.4.2')
    t.equal(control.criticality, false)
    t.notOk(control.value, null)
    t.end()
  })

  t.test('returns a PersistentSearchControl', async t => {
    const buf = Buffer.from([
      0x30, 0x26, 0x04, 0x17, 0x32, 0x2e, 0x31, 0x36, 0x2e, 0x38, 0x34, 0x30,
      0x2e, 0x31, 0x2e, 0x31, 0x31, 0x33, 0x37, 0x33, 0x30, 0x2e, 0x33, 0x2e,
      0x34, 0x2e, 0x33, 0x04, 0x0b, 0x30, 0x09, 0x02, 0x01, 0x0f, 0x01, 0x01,
      0xff, 0x01, 0x01, 0xff])

    const ber = new BerReader(buf)
    const psc = controls.getControl(ber)
    t.ok(psc)
    t.equal(psc.type, controls.PersistentSearchControl.OID)
    t.equal(psc.criticality, false)
    t.equal(psc.value.changeTypes, 15)
    t.equal(psc.value.changesOnly, true)
    t.equal(psc.value.returnECs, true)
    t.end()
  })

  t.end()
})
