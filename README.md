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

`
'@context': 'hanzo.ai/schema'
`

---

## WebsiteHeader

`
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
`

WebsiteHeader is the top header menu of a webpage

---

## WebsiteLogo

`
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

`

WebsiteLogo is an image + text logo

---

## WebSiteMenuCollection

`
{
  '@type': 'WebsiteMenuCollection'
  # menus - list of WebsiteMenus in group/collection
  menus: [ WebsiteMenu ]
}
`

WebsiteMenuCollection is a grouped collection of WebsiteMenus for the purposes
of organizing related menus

---

## WebSiteMenu

`
{
  '@type': 'WebsiteMenu'
  # name - menu display name
  name: string
  # url - menu may be a link itself (usually if no child links)
  url: string
  links: [ WebsiteMenuLink ]
}
`

WebsiteMenu is a menu which may be a link itself or a menu containing links

---

## WebsiteMenuLink

`
{
  '@type': 'WebsiteMenuLink'
  # name - link display name
  name: string
  # description - link description
  description: string
  # image - link image
  image: string
  # image - link url
  url: string
}
`

WebsiteMenuLink is a url link with associated image and description
