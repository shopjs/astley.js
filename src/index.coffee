import El from 'el.js'
import HeaderMenuComplex from './header-menu-complex'
import HeaderMenuMobile from './header-menu-mobile'
import HeaderMenuSimple from './header-menu-simple'
import Hero from './hero'
import Block from './block'
import CTA from './cta'

import HanzoAnalytics from 'hanzo-analytics'

tagNames = [
  HeaderMenuComplex::tag.toUpperCase()
  HeaderMenuMobile::tag.toUpperCase()
  HeaderMenuSimple::tag.toUpperCase()
  Hero::tag.toUpperCase()
  Block::tag.toUpperCase()
]

export default init = (orgId) ->
  HanzoAnalytics.orgId = orgId
  HanzoAnalytics.onFocus = (record) ->
    console.log 'Record', record
  HanzoAnalytics.flushRate = 10000

  El.mount tagNames.join ','

