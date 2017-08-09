import El from 'el.js'
import HeaderMenuComplex from './header-menu-complex'
import HeaderMenuSimple from './header-menu-simple'
import Hero from './hero'
import Block from './block'
import CTA from './cta'

import HanzoAnalytics from 'hanzo-analytics'

export default init = (orgId)->
  HanzoAnalytics.orgId = orgId
  HanzoAnalytics.onFocus = (record)->
    console.log 'Record', record
  HanzoAnalytics.flushRate = 10000

  El.mount '*'

