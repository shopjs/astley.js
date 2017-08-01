import $ from 'zepto-modules'
import El from 'el.js'
import { raf } from 'es-raf'

class MenuComplex extends El.View
  tag: 'menu-complex'
  html: '<yield/>'

  # Show this menu
  menuToShow: ''

  # Direction to animate slide from
  slideDirection: ''

  init: ()->
    super

    @one 'mount', ()=>
      @showMenu
        target: $('[data-menu-title]')[0]
      @menuToShow = ''

  showMenu: (e) ->
    @slideDirection = ''

    $el = $(e.target)

    first = @menuToShow == ''
    title = $el.data('menu-title')

    if !first
      isRightOf = $('[data-menu-title="' + @menuToShow + '"]').offset().left < $el.offset().left

      if isRightOf
        @slideDirection = 'right'
        console.log 'from right'
      else
        @slideDirection = 'left'
        console.log 'from left'

    @menuToShow = title

    $menu = $el.closest('menu-complex')
    $menuToShow = $menu.find('[data-menu="'+@menuToShow+'"] .menu-content')

    left = $el.offset().left - $menu.offset().left + ($el.width() / 2)

    $wrapper = $menu.find('.menu-wrapper')
    $wrapper
      .css
        left: left
        width: $menuToShow.width() + 'px'
        height: $menuToShow.height() + 'px'

    if first
      $wrapper.css
        transition: $wrapper.css('transition') + ', left 0s'

      raf ()->
        $wrapper.css
          transition: null

    console.log('Showing ' + $el.data('menu-title'))

  hideMenu: (e) ->
    @menuToShow = '' if !$('[data-menu-title]:hover')[0] &&
      !$('[data-menu-title]:focus')[0] &&
      !$('.menu-wrapper:hover')[0]

MenuComplex.register()

export default MenuComplex
