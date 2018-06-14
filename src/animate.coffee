import $ from 'zepto-modules'
import { debounce } from './utils'

# This script lets you define intro and outro animations for animate js

triggerDist = 40

$.fn.extend = (obj)->
    $.extend($.fn, obj)

$.fn.extend animateCss: (animationName, callback) ->
  animationEnd = ((el) ->
    animations =
      animation: 'animationend'
      OAnimation: 'oAnimationEnd'
      MozAnimation: 'mozAnimationEnd'
      WebkitAnimation: 'webkitAnimationEnd'
    for t of animations
      if el.style[t] != undefined
        return animations[t]
    return
  )(document.createElement('div'))
  @addClass('animated ' + animationName).one animationEnd, ->
    $(this).removeClass 'animated ' + animationName
    if typeof callback == 'function'
      callback()
    return
  this

$ ()->
  fn = ->
    width = Math.max(document.documentElement.clientWidth, window.innerWidth) ? 0
    height = Math.max(document.documentElement.clientHeight, window.innerHeight) ? 0

    $('[data-animate-in]:not(.animated-in)').each ->
      el = @
      $el =  $(el)

      rect = el.getBoundingClientRect()

      if rect.top < height + triggerDist && rect.bottom > -triggerDist
        $el.animateCss $el.attr('data-animate-in'), ->
          $el.addClass 'animated-in'

    $('.animated-in').each ->
      el = @
      $el =  $(el)

      rect = el.getBoundingClientRect()

      return if !$el.attr('data-animate-out')
      if rect.top >= height + triggerDist * 2 || rect.bottom <= triggerDist * -2
        $el.animateCss $el.attr('data-animate-out'), ->
          $el.removeClass 'animated-in'

  $window = $(window)
  $window.on 'DOMContentLoaded scroll', fn

  $scrollableArea = $('main')
  $scrollableArea.on 'DOMContentLoaded scroll', fn

