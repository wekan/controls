'use strict'

const tap = require('tap')
const { BerWriter } = require('@ldapjs/asn1')
const Control = require('./control')

tap.test('contructor', t => {
  t.test('new no args', function (t) {
    t.ok(new Control())
    t.equal(Object.prototype.toString.call(new Control()), '[object LdapControl]')
    t.end()
  })

  t.test('new with args', function (t) {
    const c = new Control({
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

    const control = new Control()
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

    const control = new Control({
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

    const control = new Control({
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

    const control = new Control({
      type: '2.16.840.1.113730.3.4.2',
      criticality: true,
      value: 'foo'
    })
    const ber = control.toBer()

    t.equal(Buffer.compare(ber.buffer, target.buffer), 0)
  })

  t.test('ignores unrecognized value', async t => {
    const target = new BerWriter()
    target.startSequence()
    target.writeString('2.16.840.1.113730.3.4.2')
    target.writeBoolean(true)
    target.writeBoolean(false)
    target.endSequence()

    const control = new Control({
      type: '2.16.840.1.113730.3.4.2',
      criticality: true,
      value: false
    })
    const ber = control.toBer()

    t.not(Buffer.compare(ber.buffer, target.buffer), 0)
  })

  t.test('passes through _toBer', async t => {
    t.plan(2)
    const target = new BerWriter()
    target.startSequence()
    target.writeString('')
    target.writeBoolean(false)
    target.endSequence()

    const control = new Control()
    control._toBer = (ber) => t.ok(ber)
    const ber = control.toBer()

    t.equal(Buffer.compare(ber.buffer, target.buffer), 0)
  })

  t.end()
})

tap.test('#plainObject', t => {
  t.test('passes through _updatePlainObject', async t => {
    t.plan(2)
    const control = new Control()
    control._updatePlainObject = () => {
      t.pass()
      return 'foo'
    }
    const str = control.plainObject
    t.equal(str, 'foo')
  })

  t.test('returns basic object', async t => {
    const control = new Control({ type: '1.2.3', criticality: false, value: 'foo' })
    const str = control.plainObject
    t.same(str, {
      controlType: '1.2.3',
      criticality: false,
      controlValue: 'foo'
    })
  })

  t.end()
})
