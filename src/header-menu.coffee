import $ from 'zepto-modules'

$ ()->
  $window = $(window)
  $window.on 'scroll', (e)->
    if $window.scrollTop() > 10
      $('header').first().addClass('darken')
    else
      $('header').first().removeClass('darken')


