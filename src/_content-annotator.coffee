import $ from 'zepto-modules'
import El from 'el.js'
import HanzoAnalytics from 'hanzo-analytics'

get$targetAndSelector = (e)->
  selectors = []

  $target = $(e.target)

  if !$target.is('[itemscope]')
    $parent = $target.closest('[itemscope]')
    if $parent[0]
      $target = $parent

  target = $target[0]
  _selector = target.selector

  if !_selector?
    $target.parents().each (i, el)->
      $el = $(el)
      selector = el.tagName
      id = $el.attr 'id'
      if id
        selector += '#' + id
      clas = $el.attr 'class'
      if clas
        selector += '.' + clas.replace /\s/g, '.'

      selectors.push selector

      _selector = selectors.reverse().join ' > '
      target._selector = _selector

  return [$target, _selector]

class Annotator extends El.View
  tag: 'annotator'
  html: '<yield/>'

  bindEvents: ()->
    $root = $(@root)

    # Bind Event Listeners
    $root.on 'mouseenter', '[itemscope]', (e)->
      [$target, _selector] = get$targetAndSelector(e)
      HanzoAnalytics 'MouseEnter',
        selector: _selector
        type:     $target.attr 'itemtype'
        mouseX:   e.clientX
        mouseY:   e.clientY

    # $root.on 'mouseleave', (e)>

    #   HanzoAnalytics 'MouseLeave'

  init: ()->
    super

    @one 'mount', ()=>
      # keeps tracks of link els
      addedLinkEls = []

      $root = $(@root)

      # JSON-LD tree begining with the current node
      json = {
        '@type': 'WebsiteSection',
        type: @tag
        id: $root.attr 'id'
        class: $root.attr 'class'
        content: []
      }

      # label the current node
      $root.attr('itemscope', '').attr('itemtype', 'WebsiteSection')
      $root.prepend('<meta itemprop="type" content="' + @tag + '"/>')
      if $root.attr('id')
        $root.prepend('<meta itemprop="id" content="' + $root.attr('id') + '"/>')
      if $root.attr('class')
        $root.prepend('<meta itemprop="class" content="' + $root.attr('class') + '"/>')

      content = { '@type': 'WebsiteContent', content: [] }
      written = false

      # determine the highest level text so we can split on sections
      topLevel = 5

      $root.find('h1, h2, h3, h4, small').each (i, node) ->
        switch node.tagName
          when 'H1'
            topLevel = Math.min(1, topLevel)
          when 'H2'
            topLevel = Math.min(2, topLevel)
          when 'H3'
            topLevel = Math.min(3, topLevel)
          when 'H4'
            topLevel = Math.min(4, topLevel)
          when 'SMALL'
            topLevel = Math.min(6, topLevel)
          else
            topLevel = Math.min(5, topLevel)

        console.log('tag', node.tagName, topLevel)

      # label the links
      $root.find('a').each (i, node) ->
        $node = $(node)
        $node.attr('itemscope', '').attr('itemtype', 'WebsiteLink').attr('itemprop', 'url')
        $node.prepend('<meta itemprop="text" content="' + $node.text() + '"/>')
        if $node.attr('id')
          $node.prepend('<meta itemprop="id" content="' + $node.attr('id') + '"/>')
        if $node.attr('class')
          $node.prepend('<meta itemprop="class" content="' + $node.attr('class') + '"/>')

      # Iterate over the text nodes
      nodes = document.createTreeWalker(@root, NodeFilter.SHOW_TEXT, null, null)
      while node = nodes.nextNode()
        p = node.parentNode
        text = node.nodeValue

        $p = $(p)
        $node = $(node)

        # add labeled links
        if $p.attr('itemtype') == 'WebsiteLink'
          if !addedLinkEls.includes p
            content.content.push
              '@type': 'WebsiteLink'
              text: $p.text()
              id: $p.attr 'id'
              class: $p.attr 'class'
              element: p
            addedLinkEls.push p

          continue

        if (link = ($p.closest('[itemtype="WebsiteLink"]')[0]))?
          $link = $(link)

          if !addedLinkEls.includes link
            content.content.push
              '@type': 'WebsiteLink'
              text: $link.text()
              id: $link.attr 'id'
              class: $link.attr 'class'
              element: link
            addedLinkEls.push link

          continue

        # skip blank text nodes
        if (/^\s+$/).test text
          continue

        # label text nodes
        $p.attr('itemscope', '').attr('itemtype', 'WebsiteText').attr('itemprop', 'text')
        if $p.attr('id')
          $p.prepend('<meta itemprop="id" content="' + $node.attr('id') + '"/>')
        if $p.attr('class')
          $p.prepend('<meta itemprop="class" content="' + $node.attr('class') + '"/>')

        level = 5

        textContent =
          '@type': 'WebsiteText'
          text: text
          id: $p.attr 'id'
          class: $p.attr 'class'
          element: p

        switch p.tagName
          when 'H1'
            level = 1
            textContent.level = 'h1'
          when 'H2'
            level = 2
            textContent.level = 'h2'
          when 'H3'
            level = 3
            textContent.level = 'h3'
          when 'H4'
            level = 4
            textContent.level = 'h4'
          when 'SMALL'
            level = 6
            textContent.level = 'small'
          else
            level = 5
            textContent.level = 'p'

        content.content.push textContent

        $p.prepend('<meta itemprop="level" content="' + textContent.level + '"/>')

        if level == topLevel && written
          json.content.push(content)
          content = { '@type': 'WebsiteContent', content: [] }
          written = false

        written = true

      if written
        json.content.push(content)

      console.log 'content', json

      @bindEvents()

export default Annotator
