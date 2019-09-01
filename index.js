'use strict'

const { Ber } = require('asn1')
const Control = require('./lib/control')

module.exports = {

  getControl: function getControl (ber) {
    if (!ber) throw TypeError('ber must be provided')

    if (ber.readSequence() === null) { return null }

    let type
    const opts = {
      criticality: false,
      value: null
    }

    if (ber.length) {
      const end = ber.offset + ber.length

      type = ber.readString()
      if (ber.offset < end) {
        if (ber.peek() === Ber.Boolean) { opts.criticality = ber.readBoolean() }
      }

      if (ber.offset < end) { opts.value = ber.readString(Ber.OctetString, true) }
    }

    let control
    switch (type) {
      // case PersistentSearchControl.OID:
      //   control = new PersistentSearchControl(opts)
      //   break
      // case EntryChangeNotificationControl.OID:
      //   control = new EntryChangeNotificationControl(opts)
      //   break
      // case PagedResultsControl.OID:
      //   control = new PagedResultsControl(opts)
      //   break
      // case ServerSideSortingRequestControl.OID:
      //   control = new ServerSideSortingRequestControl(opts)
      //   break
      // case ServerSideSortingResponseControl.OID:
      //   control = new ServerSideSortingResponseControl(opts)
      //   break
      default:
        opts.type = type
        control = Control(opts)
        break
    }

    return control
  },

  Control
  // EntryChangeNotificationControl: EntryChangeNotificationControl,
  // PagedResultsControl: PagedResultsControl,
  // PersistentSearchControl: PersistentSearchControl,
  // ServerSideSortingRequestControl: ServerSideSortingRequestControl,
  // ServerSideSortingResponseControl: ServerSideSortingResponseControl
}
