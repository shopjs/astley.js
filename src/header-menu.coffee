import $ from 'zepto-modules'

$ ()->
  $window = $(window)
  $window.on 'DOMContentLoaded scroll', (e)->
    if $window.scrollTop() > 10
      $('header').first().addClass('undocked').removeClass('docked')
    else
      $('header').first().removeClass('undocked').addClass('docked')


