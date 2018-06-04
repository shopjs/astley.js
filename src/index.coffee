import $ from './zepto'

import El from 'el.js'

import HeaderMenuComplex    from './header-menu-complex'
import HeaderMenuMobile     from './header-menu-mobile'
import HeaderMenuSimple     from './header-menu-simple'
import PrivacyPopup         from './privacy-popup'
import Hero                 from './hero'
import Block                from './block'
import CTA                  from './cta'

import HanzoAnalytics from 'hanzo-analytics'

tagNames = [
  HeaderMenuComplex::tag.toUpperCase()
  HeaderMenuMobile::tag.toUpperCase()
  HeaderMenuSimple::tag.toUpperCase()
  PrivacyPopup::tag.toUpperCase()
]

export default start = (orgId) ->
  HanzoAnalytics.orgId = orgId
  HanzoAnalytics.onFocus = (record) ->
    console.log 'Record', record
  HanzoAnalytics.flushRate = 10000

  $('hero, .hero').each (i, el) ->
    new Hero(el)

  $('block, .block').each (i, el) ->
    new Block(el)

  El.mount tagNames.join ','
