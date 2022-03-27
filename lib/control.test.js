'use strict'

const tap = require('tap')
const { BerWriter } = require('@ldapjs/asn1')
const Control = require('./control')

tap.test('contructor', t => {
  t.test('new no args', function (t) {
    t.ok(Control())
    t.end()
  })

  t.test('new with args', function (t) {
    const c = Control({
      type: '2.16.840.1.113730.3.4.2',
      criticality: true
    })
    t.ok(c)
    t.equal(c.type, '2.16.840.1.113730.3.4.2')
    t.ok(c.criticality)
    t.end()
  })

  t.end()
})

tap.test('#toBer', t => {
  t.test('converts empty instance to BER', async t => {
    const target = new BerWriter()
    target.startSequence()
    target.writeString('')
    target.writeBoolean(false)
    target.endSequence()

    const control = Control()
    const ber = control.toBer()

    t.equal(Buffer.compare(ber.buffer, target.buffer), 0)
  })

  t.test('converts instance to BER', async t => {
    const target = new BerWriter()
    target.startSequence()
    target.writeString('2.16.840.1.113730.3.4.2')
    target.writeBoolean(true)
    target.writeString('foo')
    target.endSequence()

    const control = Control({
      type: '2.16.840.1.113730.3.4.2',
      criticality: true,
      value: Buffer.from('foo', 'utf8')
    })
    const ber = control.toBer()

    t.equal(Buffer.compare(ber.buffer, target.buffer), 0)
  })

  t.test('converts instance to BER (side effect manner)', async t => {
    const target = new BerWriter()
    target.startSequence()
    target.writeString('2.16.840.1.113730.3.4.2')
    target.writeBoolean(true)
    target.writeString('foo')
    target.endSequence()

    const control = Control({
      type: '2.16.840.1.113730.3.4.2',
      criticality: true,
      value: Buffer.from('foo', 'utf8')
    })
    const ber = new BerWriter()
    control.toBer(ber)

    t.equal(Buffer.compare(ber.buffer, target.buffer), 0)
  })

  t.test('converts instance to BER with string value', async t => {
    const target = new BerWriter()
    target.startSequence()
    target.writeString('2.16.840.1.113730.3.4.2')
    target.writeBoolean(true)
    target.writeString('foo')
    target.endSequence()

    const control = Control({
      type: '2.16.840.1.113730.3.4.2',
      criticality: true,
      value: 'foo'
    })
    const ber = control.toBer()

    t.equal(Buffer.compare(ber.buffer, target.buffer), 0)
  })

  t.test('passes through _toBer', async t => {
    t.plan(2)
    const target = new BerWriter()
    target.startSequence()
    target.writeString('')
    target.writeBoolean(false)
    target.endSequence()

    const control = Control()
    control._toBer = (ber) => t.ok(ber)
    const ber = control.toBer()

    t.equal(Buffer.compare(ber.buffer, target.buffer), 0)
  })

  t.end()
})

tap.test('#toString', t => {
  t.test('passes through _json', async t => {
    t.plan(2)
    const control = Control()
    control._json = () => {
      t.pass()
      return 'foo'
    }
    const str = control.toString()
    t.equal(str, 'foo')
  })

  t.test('returns basic object', async t => {
    const control = Control({ type: '1.2.3', criticality: false, value: 'foo' })
    const str = control.toString()
    t.same(str, {
      controlType: '1.2.3',
      criticality: false,
      controlValue: 'foo'
    })
  })

  t.end()
})
