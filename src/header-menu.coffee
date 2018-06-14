import $ from 'zepto-modules'
import { debounce } from './utils'

$ ()->
  $window = $(window)
  $window.on 'DOMContentLoaded scroll', (e)->
    if $window.scrollTop() > 10
      $('header').first().addClass('undocked').removeClass('docked')
    else
      $('header').first().removeClass('undocked').addClass('docked')

  $scrollableArea = $('.scrollable-area')
  $scrollableArea.on 'DOMContentLoaded scroll', (e)->
    if $scrollableArea.scrollTop() > 10
      $('header').first().addClass('undocked').removeClass('docked')
    else
      $('header').first().removeClass('undocked').addClass('docked')
