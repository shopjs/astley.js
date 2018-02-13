# astley.js

Library for rendering a website AST into semantic aware template.  Separate the
content structure from the template structure to easily transform your website.

Of course building a semantic template is hard but it is much easier to give
your site a new look once there is a library of templates.  Astley.js comes
with a default semantic template, fork to create your own.

# AST Definition

The AST is implemented in JSON-LD format.  The semantic pug template annotates
the compiled template using microdata so any microdata parser can retrieve the
AST.

@context for the topmost element is

```
'@context': 'hanzo.ai/schema'
```

---

## Website

```
{
  '@type': 'Website'
  # head - website head, title, description, opengraph
  head: WebsiteHead
  # header - website header, navigation, top menus
  header: WebsiteHeader
  # main - website body, content, etc
  main: [ WebsiteSection ]
  # footer - website footer, navigation
  footer: WebsiteFooter
}
```

Website root node

---

## WebsiteHeader

```
{
  '@type': 'WebsiteHeader'
  # type - rendering mode, default template supports 'complex' and 'simple' header menus
  type: string
  # logos - logos to display in the headers
  logos: [ WebsiteLogo ]
  # menuCollections - grouped menus to render in the header, default templates
  # supports 2, the first for the centered menu group, and second for the right
  # menu group
  menuCollections: [ WebsiteMenuCollection ]
}
```

WebsiteHeader is the top header menu of a webpage

---

## WebsiteLogo

```
{
  '@type': 'WebsiteLogo'
  # image - logo image url
  image: string
  # alt - logo image alt
  alt: string
  # name - logo text if any
  name: string
  # url - logo url
  url: string
}
```

WebsiteLogo is an image + text logo

---

## WebSiteMenuCollection

```
{
  '@type': 'WebsiteMenuCollection'
  // menus - list of WebsiteMenus in group/collection
  menus: [ WebsiteMenu ]
}
```

WebsiteMenuCollection is a grouped collection of WebsiteMenus for the purposes
of organizing related menus

---

## WebSiteMenu

```
{
  '@type': 'WebsiteMenu'
  # name - menu display name
  name: string
  # description - link description
  type: basic | button
  # url - menu may be a link itself (usually if no child links)
  url: string
  links: [ WebsiteMenuLink ]
}
```

WebsiteMenu is a menu which may be a link itself or a menu containing links

---

## WebsiteMenuLink

```
{
  '@type': 'WebsiteMenuLink'
  # name - link display name
  name: string
  # description - link description
  description: string
  # type - type of link supports specific types
  type: basic | button
  # image - link image
  image: string
  # image - link url
  url: string
}
```

WebsiteMenuLink is a url link with associated image and description

---

## WebsiteSection

```
{
  '@type': 'WebsiteSection'
  # name - section name
  name: string
  # type - type of section, supports specific types
  type: hero | block | cta
  # class - class names like html tag class
  class: string
  # id - id
  id: string
  # content - list of content
  content: [ WebsiteText | WebsiteImage | WebsiteButton | WebsiteContent ]
}
```

WebsiteSection containes website primatives

---

## WebsiteContent

```
{
  '@type': 'WebsiteContent'
  # class - class names like html tag class
  class: string
  # id - id
  id: string
  # content - list of content
  content: [ WebsiteText | WebsiteImage | WebsiteButton | WebsiteContent ]
}
```

WebsiteContent allows tree-like structuring of data, not necessarily rendered,
just organizational.  Usually inferred by the content-annotator

---

## WebsiteText

```
{
  '@type': 'WebsiteText'
  # class - class names like html tag class
  class: string
  # id - id
  id: string
  # text - text
  text: string
  # level - level (h1, h2, h3, h4, p, small)
  level: string
}
```

WebsiteText primative

---

## WebsiteImage

```
{
  '@type': 'WebsiteImage'
  # class - class names like html tag class
  class: string
  # id - id
  id: string
  # src - source
  src: string
  # alt - alt text
  alt: string
}
```

WebsiteImage primative

---

## WebsiteLink

```
{
  '@type': 'WebsiteLink'
  # class - class names like html tag class
  class: string
  # id - id
  id: string
  # text - link text
  text: string
  # url - link url
  url: string
}
```

WebsiteLink primative

---

## WebsiteHeader

```
{
  '@type': 'WebsiteFooter'
  # logos - logos to display in the footers
  logos: [ WebsiteLogo ]
  # menuCollections - grouped menus to render in the footer
  menuCollections: [ WebsiteMenuCollection ]
}
```

WebsiteFooter is the bottom footer menu of a webpage

---

