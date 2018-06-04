import El from 'el.js'
import akasha from 'akasha'

class PrivacyPopup extends El.View
  tag: 'privacy-popup'
  html: '<yield/>'

  init: ->
    super arguments...

  accept: ->
    akasha.set 'site.privacy.accepted', true

  accepted: ->
    return !!(akasha.get 'site.privacy.accepted')

PrivacyPopup.register()

export default PrivacyPopup
