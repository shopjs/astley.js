import $ from 'zepto-modules'
import El from 'el.js'

import './header-menu'

class HeaderMenuMobile extends El.View
  tag: 'header-menu-mobile'
  html: '<yield/>'

  init: ->
    super arguments...

HeaderMenuMobile.register()

export default HeaderMenuMobile

