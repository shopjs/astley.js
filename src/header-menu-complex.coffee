import $ from 'zepto-modules'
import El from 'el.js'
import { raf } from 'es-raf'

import './header-menu'

class HeaderMenuComplex extends El.View
  tag: 'header-menu-complex'
  html: '<yield/>'

  # Show this menu
  menuToShow: ''

  # Direction to animate slide from
  slideDirection: ''

  init: ()->
    super

    hideMenu = @hideMenu.bind @

    @on 'mount', ()=>
      @showMenu
        target: $('[data-menu-title]')[0]
      @menuToShow = ''

      $(document).on 'mousemove', hideMenu

    @on 'unmount', ()->
      $(document).off 'mousemove', hideMenu

  showMenu: (e) ->
    @slideDirection = ''

    $el = $(e.target)

    first = @menuToShow == ''
    title = $el.data('menu-title')

    if !first
      isRightOf = $('[data-menu-title="' + @menuToShow + '"]').offset().left < $el.offset().left
      isLeftOf = $('[data-menu-title="' + @menuToShow + '"]').offset().left > $el.offset().left

      if isRightOf
        @slideDirection = 'right'
      else if isLeftOf
        @slideDirection = 'left'

    @menuToShow = title

    $menu = $el.closest(@tag)
    $menuToShow = $menu.find('[data-menu="'+@menuToShow+'"] .menu-content')

    left = $el.offset().left - $menu.offset().left + (($el.width() - $menuToShow.width()) / 2)

    $wrapper = $menu.find('.menu-wrapper')

    if first
      $wrapper.css
        transition: $wrapper.css('transition') + ', transform 0s'

      raf ()->
        $wrapper.css
          transition: null

    $wrapper
      .css
        transform: 'translateX(' + left + 'px)'
        width: $menuToShow.width() + 'px'
        height: $menuToShow.height() + 'px'

    console.log('Showing ' + $el.data('menu-title'))

  hideMenu: (e) ->
    if !$('[data-menu-title]:hover')[0] && !$('[data-menu-title]:focus')[0] && !$('.menu-wrapper:hover')[0]
      @menuToShow = ''
      console.log('Hiding ' + e)
      # schedule update just in case
      @scheduleUpdate()

HeaderMenuComplex.register()

export default HeaderMenuComplex
