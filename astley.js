var Astley = (function () {
'use strict';

// node_modules/zepto-modules/zepto.js
//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = (function() {
  var undefined, key, $, classList, emptyArray = [], concat = emptyArray.concat, filter = emptyArray.filter, slice = emptyArray.slice,
    document = window.document,
    elementDisplay = {}, classCache = {},
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,
    capitalRE = /([A-Z])/g,

    // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    simpleSelectorRE = /^[\w-]*$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div'),
    propMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'for': 'htmlFor',
      'class': 'className',
      'maxlength': 'maxLength',
      'cellspacing': 'cellSpacing',
      'cellpadding': 'cellPadding',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable'
    },
    isArray = Array.isArray ||
      function(object){ return object instanceof Array };

  zepto.matches = function(element, selector) {
    if (!selector || !element || element.nodeType !== 1) return false
    var matchesSelector = element.matches || element.webkitMatchesSelector ||
                          element.mozMatchesSelector || element.oMatchesSelector ||
                          element.matchesSelector;
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    var match, parent = element.parentNode, temp = !parent;
    if (temp) (parent = tempParent).appendChild(element);
    match = ~zepto.qsa(parent, selector).indexOf(element);
    temp && tempParent.removeChild(element);
    return match
  };

  function type(obj) {
    return obj == null ? String(obj) :
      class2type[toString.call(obj)] || "object"
  }

  function isFunction(value) { return type(value) == "function" }
  function isWindow(obj)     { return obj != null && obj == obj.window }
  function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
  function isObject(obj)     { return type(obj) == "object" }
  function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
  }

  function likeArray(obj) {
    var length = !!obj && 'length' in obj && obj.length,
      type = $.type(obj);

    return 'function' != type && !isWindow(obj) && (
      'array' == type || length === 0 ||
        (typeof length == 'number' && length > 0 && (length - 1) in obj)
    )
  }

  function compact(array) { return filter.call(array, function(item){ return item != null }) }
  function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) };
  function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase()
  }
  uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) };

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function defaultDisplay(nodeName) {
    var element, display;
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName);
      document.body.appendChild(element);
      display = getComputedStyle(element, '').getPropertyValue("display");
      element.parentNode.removeChild(element);
      display == "none" && (display = "block");
      elementDisplay[nodeName] = display;
    }
    return elementDisplay[nodeName]
  }

  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
  }

  function Z(dom, selector) {
    var i, len = dom ? dom.length : 0;
    for (i = 0; i < len; i++) this[i] = dom[i];
    this.length = len;
    this.selector = selector || '';
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overridden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function(html, name, properties) {
    var dom, nodes, container;

    // A special case optimization for a single tag
    if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1));

    if (!dom) {
      if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>");
      if (name === undefined) name = fragmentRE.test(html) && RegExp.$1;
      if (!(name in containers)) name = '*';

      container = containers[name];
      container.innerHTML = '' + html;
      dom = $.each(slice.call(container.childNodes), function(){
        container.removeChild(this);
      });
    }

    if (isPlainObject(properties)) {
      nodes = $(dom);
      $.each(properties, function(key, value) {
        if (methodAttributes.indexOf(key) > -1) nodes[key](value);
        else nodes.attr(key, value);
      });
    }

    return dom
  };

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. This method can be overridden in plugins.
  zepto.Z = function(dom, selector) {
    return new Z(dom, selector)
  };

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overridden in plugins.
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  };

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overridden in plugins.
  zepto.init = function(selector, context) {
    var dom;
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // Optimize for string selectors
    else if (typeof selector == 'string') {
      selector = selector.trim();
      // If it's a html fragment, create nodes from it
      // Note: In both Chrome 21 and Firefox 15, DOM error 12
      // is thrown if the fragment doesn't begin with <
      if (selector[0] == '<' && fragmentRE.test(selector))
        dom = zepto.fragment(selector, RegExp.$1, context), selector = null;
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // If it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector);
    }
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, just return it
    else if (zepto.isZ(selector)) return selector
    else {
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector);
      // Wrap DOM nodes.
      else if (isObject(selector))
        dom = [selector], selector = null;
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null;
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector);
    }
    // create a new Zepto collection from the nodes found
    return zepto.Z(dom, selector)
  };

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, which makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function(selector, context){
    return zepto.init(selector, context)
  };

  function extend(target, source, deep) {
    for (key in source)
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
          target[key] = {};
        if (isArray(source[key]) && !isArray(target[key]))
          target[key] = [];
        extend(target[key], source[key], deep);
      }
      else if (source[key] !== undefined) target[key] = source[key];
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function(target){
    var deep, args = slice.call(arguments, 1);
    if (typeof target == 'boolean') {
      deep = target;
      target = args.shift();
    }
    args.forEach(function(arg){ extend(target, arg, deep); });
    return target
  };

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overridden in plugins.
  zepto.qsa = function(element, selector){
    var found,
        maybeID = selector[0] == '#',
        maybeClass = !maybeID && selector[0] == '.',
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
        isSimple = simpleSelectorRE.test(nameOnly);
    return (element.getElementById && isSimple && maybeID) ? // Safari DocumentFragment doesn't have getElementById
      ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
      (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] :
      slice.call(
        isSimple && !maybeID && element.getElementsByClassName ? // DocumentFragment doesn't have getElementsByClassName/TagName
          maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
          element.getElementsByTagName(selector) : // Or a tag
          element.querySelectorAll(selector) // Or it's not simple, and we need to query all
      )
  };

  function filtered(nodes, selector) {
    return selector == null ? $(nodes) : $(nodes).filter(selector)
  }

  $.contains = document.documentElement.contains ?
    function(parent, node) {
      return parent !== node && parent.contains(node)
    } :
    function(parent, node) {
      while (node && (node = node.parentNode))
        if (node === parent) return true
      return false
    };

  function funcArg(context, arg, idx, payload) {
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value);
  }

  // access className property while respecting SVGAnimatedString
  function className(node, value){
    var klass = node.className || '',
        svg   = klass && klass.baseVal !== undefined;

    if (value === undefined) return svg ? klass.baseVal : klass
    svg ? (klass.baseVal = value) : (node.className = value);
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // "08"    => "08"
  // JSON    => parse if valid
  // String  => self
  function deserializeValue(value) {
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          +value + "" == value ? +value :
          /^[\[\{]/.test(value) ? $.parseJSON(value) :
          value )
        : value
    } catch(e) {
      return value
    }
  }

  $.type = type;
  $.isFunction = isFunction;
  $.isWindow = isWindow;
  $.isArray = isArray;
  $.isPlainObject = isPlainObject;

  $.isEmptyObject = function(obj) {
    var name;
    for (name in obj) return false
    return true
  };

  $.isNumeric = function(val) {
    var num = Number(val), type = typeof val;
    return val != null && type != 'boolean' &&
      (type != 'string' || val.length) &&
      !isNaN(num) && isFinite(num) || false
  };

  $.inArray = function(elem, array, i){
    return emptyArray.indexOf.call(array, elem, i)
  };

  $.camelCase = camelize;
  $.trim = function(str) {
    return str == null ? "" : String.prototype.trim.call(str)
  };

  // plugin compatibility
  $.uuid = 0;
  $.support = { };
  $.expr = { };
  $.noop = function() {};

  $.map = function(elements, callback){
    var value, values = [], i, key;
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i);
        if (value != null) values.push(value);
      }
    else
      for (key in elements) {
        value = callback(elements[key], key);
        if (value != null) values.push(value);
      }
    return flatten(values)
  };

  $.each = function(elements, callback){
    var i, key;
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  };

  $.grep = function(elements, callback){
    return filter.call(elements, callback)
  };

  if (window.JSON) $.parseJSON = JSON.parse;

  // Populate the class2type map
  $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase();
  });

  // Define methods that will be available on all
  // Zepto collections
  $.fn = {
    constructor: zepto.Z,
    length: 0,

    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    sort: emptyArray.sort,
    splice: emptyArray.splice,
    indexOf: emptyArray.indexOf,
    concat: function(){
      var i, value, args = [];
      for (i = 0; i < arguments.length; i++) {
        value = arguments[i];
        args[i] = zepto.isZ(value) ? value.toArray() : value;
      }
      return concat.apply(zepto.isZ(this) ? this.toArray() : this, args)
    },

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    map: function(fn){
      return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
    },
    slice: function(){
      return $(slice.apply(this, arguments))
    },

    ready: function(callback){
      // need to check if document.body exists for IE as that browser reports
      // document ready when it hasn't yet created the body element
      if (readyRE.test(document.readyState) && document.body) callback($);
      else document.addEventListener('DOMContentLoaded', function(){ callback($); }, false);
      return this
    },
    get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },
    toArray: function(){ return this.get() },
    size: function(){
      return this.length
    },
    remove: function(){
      return this.each(function(){
        if (this.parentNode != null)
          this.parentNode.removeChild(this);
      })
    },
    each: function(callback){
      emptyArray.every.call(this, function(el, idx){
        return callback.call(el, idx, el) !== false
      });
      return this
    },
    filter: function(selector){
      if (isFunction(selector)) return this.not(this.not(selector))
      return $(filter.call(this, function(element){
        return zepto.matches(element, selector)
      }))
    },
    add: function(selector,context){
      return $(uniq(this.concat($(selector,context))))
    },
    is: function(selector){
      return this.length > 0 && zepto.matches(this[0], selector)
    },
    not: function(selector){
      var nodes=[];
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this);
        });
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector);
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el);
        });
      }
      return $(nodes)
    },
    has: function(selector){
      return this.filter(function(){
        return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
      })
    },
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
    first: function(){
      var el = this[0];
      return el && !isObject(el) ? el : $(el)
    },
    last: function(){
      var el = this[this.length - 1];
      return el && !isObject(el) ? el : $(el)
    },
    find: function(selector){
      var result, $this = this;
      if (!selector) result = $();
      else if (typeof selector == 'object')
        result = $(selector).filter(function(){
          var node = this;
          return emptyArray.some.call($this, function(parent){
            return $.contains(parent, node)
          })
        });
      else if (this.length == 1) result = $(zepto.qsa(this[0], selector));
      else result = this.map(function(){ return zepto.qsa(this, selector) });
      return result
    },
    closest: function(selector, context){
      var nodes = [], collection = typeof selector == 'object' && $(selector);
      this.each(function(_, node){
        while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
          node = node !== context && !isDocument(node) && node.parentNode;
        if (node && nodes.indexOf(node) < 0) nodes.push(node);
      });
      return $(nodes)
    },
    parents: function(selector){
      var ancestors = [], nodes = this;
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node);
            return node
          }
        });
      return filtered(ancestors, selector)
    },
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
    children: function(selector){
      return filtered(this.map(function(){ return children(this) }), selector)
    },
    contents: function() {
      return this.map(function() { return this.contentDocument || slice.call(this.childNodes) })
    },
    siblings: function(selector){
      return filtered(this.map(function(i, el){
        return filter.call(children(el.parentNode), function(child){ return child!==el })
      }), selector)
    },
    empty: function(){
      return this.each(function(){ this.innerHTML = ''; })
    },
    // `pluck` is borrowed from Prototype.js
    pluck: function(property){
      return $.map(this, function(el){ return el[property] })
    },
    show: function(){
      return this.each(function(){
        this.style.display == "none" && (this.style.display = '');
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName);
      })
    },
    replaceWith: function(newContent){
      return this.before(newContent).remove()
    },
    wrap: function(structure){
      var func = isFunction(structure);
      if (this[0] && !func)
        var dom   = $(structure).get(0),
            clone = dom.parentNode || this.length > 1;

      return this.each(function(index){
        $(this).wrapAll(
          func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
        );
      })
    },
    wrapAll: function(structure){
      if (this[0]) {
        $(this[0]).before(structure = $(structure));
        var children;
        // drill down to the inmost element
        while ((children = structure.children()).length) structure = children.first();
        $(structure).append(this);
      }
      return this
    },
    wrapInner: function(structure){
      var func = isFunction(structure);
      return this.each(function(index){
        var self = $(this), contents = self.contents(),
            dom  = func ? structure.call(this, index) : structure;
        contents.length ? contents.wrapAll(dom) : self.append(dom);
      })
    },
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children());
      });
      return this
    },
    clone: function(){
      return this.map(function(){ return this.cloneNode(true) })
    },
    hide: function(){
      return this.css("display", "none")
    },
    toggle: function(setting){
      return this.each(function(){
        var el = $(this)
        ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide();
      })
    },
    prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
    next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
    html: function(html){
      return 0 in arguments ?
        this.each(function(idx){
          var originHtml = this.innerHTML;
          $(this).empty().append( funcArg(this, html, idx, originHtml) );
        }) :
        (0 in this ? this[0].innerHTML : null)
    },
    text: function(text){
      return 0 in arguments ?
        this.each(function(idx){
          var newText = funcArg(this, text, idx, this.textContent);
          this.textContent = newText == null ? '' : ''+newText;
        }) :
        (0 in this ? this.pluck('textContent').join("") : null)
    },
    attr: function(name, value){
      var result;
      return (typeof name == 'string' && !(1 in arguments)) ?
        (0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null ? result : undefined) :
        this.each(function(idx){
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key]);
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)));
        })
    },
    removeAttr: function(name){
      return this.each(function(){ this.nodeType === 1 && name.split(' ').forEach(function(attribute){
        setAttribute(this, attribute);
      }, this);})
    },
    prop: function(name, value){
      name = propMap[name] || name;
      return (1 in arguments) ?
        this.each(function(idx){
          this[name] = funcArg(this, value, idx, this[name]);
        }) :
        (this[0] && this[0][name])
    },
    removeProp: function(name){
      name = propMap[name] || name;
      return this.each(function(){ delete this[name]; })
    },
    data: function(name, value){
      var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase();

      var data = (1 in arguments) ?
        this.attr(attrName, value) :
        this.attr(attrName);

      return data !== null ? deserializeValue(data) : undefined
    },
    val: function(value){
      if (0 in arguments) {
        if (value == null) value = "";
        return this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value);
        })
      } else {
        return this[0] && (this[0].multiple ?
           $(this[0]).find('option').filter(function(){ return this.selected }).pluck('value') :
           this[0].value)
      }
    },
    offset: function(coordinates){
      if (coordinates) return this.each(function(index){
        var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top:  coords.top  - parentOffset.top,
              left: coords.left - parentOffset.left
            };

        if ($this.css('position') == 'static') props['position'] = 'relative';
        $this.css(props);
      })
      if (!this.length) return null
      if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0]))
        return {top: 0, left: 0}
      var obj = this[0].getBoundingClientRect();
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      }
    },
    css: function(property, value){
      if (arguments.length < 2) {
        var element = this[0];
        if (typeof property == 'string') {
          if (!element) return
          return element.style[camelize(property)] || getComputedStyle(element, '').getPropertyValue(property)
        } else if (isArray(property)) {
          if (!element) return
          var props = {};
          var computedStyle = getComputedStyle(element, '');
          $.each(property, function(_, prop){
            props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop));
          });
          return props
        }
      }

      var css = '';
      if (type(property) == 'string') {
        if (!value && value !== 0)
          this.each(function(){ this.style.removeProperty(dasherize(property)); });
        else
          css = dasherize(property) + ":" + maybeAddPx(property, value);
      } else {
        for (key in property)
          if (!property[key] && property[key] !== 0)
            this.each(function(){ this.style.removeProperty(dasherize(key)); });
          else
            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';';
      }

      return this.each(function(){ this.style.cssText += ';' + css; })
    },
    index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    hasClass: function(name){
      if (!name) return false
      return emptyArray.some.call(this, function(el){
        return this.test(className(el))
      }, classRE(name))
    },
    addClass: function(name){
      if (!name) return this
      return this.each(function(idx){
        if (!('className' in this)) return
        classList = [];
        var cls = className(this), newName = funcArg(this, name, idx, cls);
        newName.split(/\s+/g).forEach(function(klass){
          if (!$(this).hasClass(klass)) classList.push(klass);
        }, this);
        classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "));
      })
    },
    removeClass: function(name){
      return this.each(function(idx){
        if (!('className' in this)) return
        if (name === undefined) return className(this, '')
        classList = className(this);
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          classList = classList.replace(classRE(klass), " ");
        });
        className(this, classList.trim());
      })
    },
    toggleClass: function(name, when){
      if (!name) return this
      return this.each(function(idx){
        var $this = $(this), names = funcArg(this, name, idx, className(this));
        names.split(/\s+/g).forEach(function(klass){
          (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass);
        });
      })
    },
    scrollTop: function(value){
      if (!this.length) return
      var hasScrollTop = 'scrollTop' in this[0];
      if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
      return this.each(hasScrollTop ?
        function(){ this.scrollTop = value; } :
        function(){ this.scrollTo(this.scrollX, value); })
    },
    scrollLeft: function(value){
      if (!this.length) return
      var hasScrollLeft = 'scrollLeft' in this[0];
      if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
      return this.each(hasScrollLeft ?
        function(){ this.scrollLeft = value; } :
        function(){ this.scrollTo(value, this.scrollY); })
    },
    position: function() {
      if (!this.length) return

      var elem = this[0],
        // Get *real* offsetParent
        offsetParent = this.offsetParent(),
        // Get correct offsets
        offset       = this.offset(),
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset();

      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
      offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0;
      offset.left -= parseFloat( $(elem).css('margin-left') ) || 0;

      // Add offsetParent borders
      parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0;
      parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0;

      // Subtract the two offsets
      return {
        top:  offset.top  - parentOffset.top,
        left: offset.left - parentOffset.left
      }
    },
    offsetParent: function() {
      return this.map(function(){
        var parent = this.offsetParent || document.body;
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
          parent = parent.offsetParent;
        return parent
      })
    }
  };

  // for now
  $.fn.detach = $.fn.remove

  // Generate the `width` and `height` functions
  ;['width', 'height'].forEach(function(dimension){
    var dimensionProperty =
      dimension.replace(/./, function(m){ return m[0].toUpperCase() });

    $.fn[dimension] = function(value){
      var offset, el = this[0];
      if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
        isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function(idx){
        el = $(this);
        el.css(dimension, funcArg(this, value, idx, el[dimension]()));
      })
    };
  });

  function traverseNode(node, fun) {
    fun(node);
    for (var i = 0, len = node.childNodes.length; i < len; i++)
      traverseNode(node.childNodes[i], fun);
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function(operator, operatorIndex) {
    var inside = operatorIndex % 2; //=> prepend, append

    $.fn[operator] = function(){
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      var argType, nodes = $.map(arguments, function(arg) {
            var arr = [];
            argType = type(arg);
            if (argType == "array") {
              arg.forEach(function(el) {
                if (el.nodeType !== undefined) return arr.push(el)
                else if ($.zepto.isZ(el)) return arr = arr.concat(el.get())
                arr = arr.concat(zepto.fragment(el));
              });
              return arr
            }
            return argType == "object" || arg == null ?
              arg : zepto.fragment(arg)
          }),
          parent, copyByClone = this.length > 1;
      if (nodes.length < 1) return this

      return this.each(function(_, target){
        parent = inside ? target : target.parentNode;

        // convert all methods to a "before" operation
        target = operatorIndex == 0 ? target.nextSibling :
                 operatorIndex == 1 ? target.firstChild :
                 operatorIndex == 2 ? target :
                 null;

        var parentInDocument = $.contains(document.documentElement, parent);

        nodes.forEach(function(node){
          if (copyByClone) node = node.cloneNode(true);
          else if (!parent) return $(node).remove()

          parent.insertBefore(node, target);
          if (parentInDocument) traverseNode(node, function(el){
            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
               (!el.type || el.type === 'text/javascript') && !el.src){
              var target = el.ownerDocument ? el.ownerDocument.defaultView : window;
              target['eval'].call(target, el.innerHTML);
            }
          });
        });
      })
    };

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
    $.fn[inside ? operator+'To' : 'insert'+(operatorIndex ? 'Before' : 'After')] = function(html){
      $(html)[operator](this);
      return this
    };
  });

  zepto.Z.prototype = Z.prototype = $.fn;

  // Export internal API functions in the `$.zepto` namespace
  zepto.uniq = uniq;
  zepto.deserializeValue = deserializeValue;
  $.zepto = zepto;

  return $
})();

var zepto = Zepto;

//  commonjs-proxy:/Users/dtai/work/hanzo/astley.js/node_modules/zepto-modules/zepto.js

(function($){
  var _zid = 1, undefined,
      slice = Array.prototype.slice,
      isFunction = $.isFunction,
      isString = function(obj){ return typeof obj == 'string' },
      handlers = {},
      specialEvents={},
      focusinSupported = 'onfocusin' in window,
      focus = { focus: 'focusin', blur: 'focusout' },
      hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' };

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents';

  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event);
    if (event.ns) var matcher = matcherFor(event.ns);
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  function parse(event) {
    var parts = ('' + event).split('.');
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  function eventCapture(handler, captureSetting) {
    return handler.del &&
      (!focusinSupported && (handler.e in focus)) ||
      !!captureSetting
  }

  function realEvent(type) {
    return hover[type] || (focusinSupported && focus[type]) || type
  }

  function add(element, events, fn, data, selector, delegator, capture){
    var id = zid(element), set = (handlers[id] || (handlers[id] = []));
    events.split(/\s/).forEach(function(event){
      if (event == 'ready') return $(document).ready(fn)
      var handler   = parse(event);
      handler.fn    = fn;
      handler.sel   = selector;
      // emulate mouseenter, mouseleave
      if (handler.e in hover) fn = function(e){
        var related = e.relatedTarget;
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      };
      handler.del   = delegator;
      var callback  = delegator || fn;
      handler.proxy = function(e){
        e = compatible(e);
        if (e.isImmediatePropagationStopped()) return
        e.data = data;
        var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args));
        if (result === false) e.preventDefault(), e.stopPropagation();
        return result
      };
      handler.i = set.length;
      set.push(handler);
      if ('addEventListener' in element)
        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
    });
  }
  function remove(element, events, fn, selector, capture){
    var id = zid(element)
    ;(events || '').split(/\s/).forEach(function(event){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i];
      if ('removeEventListener' in element)
        element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
      });
    });
  }

  $.event = { add: add, remove: remove };

  $.proxy = function(fn, context) {
    var args = (2 in arguments) && slice.call(arguments, 2);
    if (isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments) };
      proxyFn._zid = zid(fn);
      return proxyFn
    } else if (isString(context)) {
      if (args) {
        args.unshift(fn[context], fn);
        return $.proxy.apply(null, args)
      } else {
        return $.proxy(fn[context], fn)
      }
    } else {
      throw new TypeError("expected function")
    }
  };

  $.fn.bind = function(event, data, callback){
    return this.on(event, data, callback)
  };
  $.fn.unbind = function(event, callback){
    return this.off(event, callback)
  };
  $.fn.one = function(event, selector, data, callback){
    return this.on(event, selector, data, callback, 1)
  };

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      };

  function compatible(event, source) {
    if (source || !event.isDefaultPrevented) {
      source || (source = event);

      $.each(eventMethods, function(name, predicate) {
        var sourceMethod = source[name];
        event[name] = function(){
          this[predicate] = returnTrue;
          return sourceMethod && sourceMethod.apply(source, arguments)
        };
        event[predicate] = returnFalse;
      });

      try {
        event.timeStamp || (event.timeStamp = Date.now());
      } catch (ignored) { }

      if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault())
        event.isDefaultPrevented = returnTrue;
    }
    return event
  }

  function createProxy(event) {
    var key, proxy = { originalEvent: event };
    for (key in event)
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key];

    return compatible(proxy, event)
  }

  $.fn.delegate = function(selector, event, callback){
    return this.on(event, selector, callback)
  };
  $.fn.undelegate = function(selector, event, callback){
    return this.off(event, selector, callback)
  };

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback);
    return this
  };
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback);
    return this
  };

  $.fn.on = function(event, selector, data, callback, one){
    var autoRemove, delegator, $this = this;
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.on(type, selector, data, fn, one);
      });
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = data, data = selector, selector = undefined;
    if (callback === undefined || data === false)
      callback = data, data = undefined;

    if (callback === false) callback = returnFalse;

    return $this.each(function(_, element){
      if (one) autoRemove = function(e){
        remove(element, e.type, callback);
        return callback.apply(this, arguments)
      };

      if (selector) delegator = function(e){
        var evt, match = $(e.target).closest(selector, element).get(0);
        if (match && match !== element) {
          evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element});
          return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
        }
      };

      add(element, event, callback, data, selector, delegator || autoRemove);
    })
  };
  $.fn.off = function(event, selector, callback){
    var $this = this;
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.off(type, selector, fn);
      });
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = selector, selector = undefined;

    if (callback === false) callback = returnFalse;

    return $this.each(function(){
      remove(this, event, callback, selector);
    })
  };

  $.fn.trigger = function(event, args){
    event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event);
    event._args = args;
    return this.each(function(){
      // handle focus(), blur() by calling them directly
      if (event.type in focus && typeof this[event.type] == "function") this[event.type]();
      // items in the collection might not be DOM elements
      else if ('dispatchEvent' in this) this.dispatchEvent(event);
      else $(this).triggerHandler(event, args);
    })
  };

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function(event, args){
    var e, result;
    this.each(function(i, element){
      e = createProxy(isString(event) ? $.Event(event) : event);
      e._args = args;
      e.target = element;
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e);
        if (e.isImmediatePropagationStopped()) return false
      });
    });
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout focus blur load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback) {
      return (0 in arguments) ?
        this.bind(event, callback) :
        this.trigger(event)
    };
  });

  $.Event = function(type, props) {
    if (!isString(type)) props = type, type = props.type;
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true;
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name]);
    event.initEvent(type, bubbles, true);
    return compatible(event)
  };

})(zepto);

(function($){
  var jsonpID = +new Date(),
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/,
      originAnchor = document.createElement('a');

  originAnchor.href = window.location.href;

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName);
    $(context).trigger(event, data);
    return !event.isDefaultPrevented()
  }

  // trigger an Ajax "global" event
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) return triggerAndReturn(context || document, eventName, data)
  }

  // Number of active Ajax requests
  $.active = 0;

  function ajaxStart(settings) {
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart');
  }
  function ajaxStop(settings) {
    if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop');
  }

  // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context;
    if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
      return false

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings]);
  }
  function ajaxSuccess(data, xhr, settings, deferred) {
    var context = settings.context, status = 'success';
    settings.success.call(context, data, status, xhr);
    if (deferred) deferred.resolveWith(context, [data, status, xhr]);
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data]);
    ajaxComplete(status, xhr, settings);
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings, deferred) {
    var context = settings.context;
    settings.error.call(context, xhr, type, error);
    if (deferred) deferred.rejectWith(context, [xhr, type, error]);
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type]);
    ajaxComplete(type, xhr, settings);
  }
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context;
    settings.complete.call(context, xhr, status);
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings]);
    ajaxStop(settings);
  }

  function ajaxDataFilter(data, type, settings) {
    if (settings.dataFilter == empty) return data
    var context = settings.context;
    return settings.dataFilter.call(context, data, type)
  }

  // Empty function, used as default callback
  function empty() {}

  $.ajaxJSONP = function(options, deferred){
    if (!('type' in options)) return $.ajax(options)

    var _callbackName = options.jsonpCallback,
      callbackName = ($.isFunction(_callbackName) ?
        _callbackName() : _callbackName) || ('Zepto' + (jsonpID++)),
      script = document.createElement('script'),
      originalCallback = window[callbackName],
      responseData,
      abort = function(errorType) {
        $(script).triggerHandler('error', errorType || 'abort');
      },
      xhr = { abort: abort }, abortTimeout;

    if (deferred) deferred.promise(xhr);

    $(script).on('load error', function(e, errorType){
      clearTimeout(abortTimeout);
      $(script).off().remove();

      if (e.type == 'error' || !responseData) {
        ajaxError(null, errorType || 'error', xhr, options, deferred);
      } else {
        ajaxSuccess(responseData[0], xhr, options, deferred);
      }

      window[callbackName] = originalCallback;
      if (responseData && $.isFunction(originalCallback))
        originalCallback(responseData[0]);

      originalCallback = responseData = undefined;
    });

    if (ajaxBeforeSend(xhr, options) === false) {
      abort('abort');
      return xhr
    }

    window[callbackName] = function(){
      responseData = arguments;
    };

    script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName);
    document.head.appendChild(script);

    if (options.timeout > 0) abortTimeout = setTimeout(function(){
      abort('timeout');
    }, options.timeout);

    return xhr
  };

  $.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
      return new window.XMLHttpRequest()
    },
    // MIME types mapping
    // IIS returns Javascript as "application/x-javascript"
    accepts: {
      script: 'text/javascript, application/javascript, application/x-javascript',
      json:   jsonType,
      xml:    'application/xml, text/xml',
      html:   htmlType,
      text:   'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0,
    // Whether data should be serialized to string
    processData: true,
    // Whether the browser should be allowed to cache GET responses
    cache: true,
    //Used to handle the raw response data of XMLHttpRequest.
    //This is a pre-filtering function to sanitize the response.
    //The sanitized response should be returned
    dataFilter: empty
  };

  function mimeToDataType(mime) {
    if (mime) mime = mime.split(';', 2)[0];
    return mime && ( mime == htmlType ? 'html' :
      mime == jsonType ? 'json' :
      scriptTypeRE.test(mime) ? 'script' :
      xmlTypeRE.test(mime) && 'xml' ) || 'text'
  }

  function appendQuery(url, query) {
    if (query == '') return url
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // serialize payload and append it to the URL for GET requests
  function serializeData(options) {
    if (options.processData && options.data && $.type(options.data) != "string")
      options.data = $.param(options.data, options.traditional);
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET' || 'jsonp' == options.dataType))
      options.url = appendQuery(options.url, options.data), options.data = undefined;
  }

  $.ajax = function(options){
    var settings = $.extend({}, options || {}),
        deferred = $.Deferred && $.Deferred(),
        urlAnchor, hashIndex;
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key];

    ajaxStart(settings);

    if (!settings.crossDomain) {
      urlAnchor = document.createElement('a');
      urlAnchor.href = settings.url;
      // cleans up URL for .href (IE only), see https://github.com/madrobby/zepto/pull/1049
      urlAnchor.href = urlAnchor.href;
      settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host);
    }

    if (!settings.url) settings.url = window.location.toString();
    if ((hashIndex = settings.url.indexOf('#')) > -1) settings.url = settings.url.slice(0, hashIndex);
    serializeData(settings);

    var dataType = settings.dataType, hasPlaceholder = /\?.+=\?/.test(settings.url);
    if (hasPlaceholder) dataType = 'jsonp';

    if (settings.cache === false || (
         (!options || options.cache !== true) &&
         ('script' == dataType || 'jsonp' == dataType)
        ))
      settings.url = appendQuery(settings.url, '_=' + Date.now());

    if ('jsonp' == dataType) {
      if (!hasPlaceholder)
        settings.url = appendQuery(settings.url,
          settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?');
      return $.ajaxJSONP(settings, deferred)
    }

    var mime = settings.accepts[dataType],
        headers = { },
        setHeader = function(name, value) { headers[name.toLowerCase()] = [name, value]; },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = settings.xhr(),
        nativeSetHeader = xhr.setRequestHeader,
        abortTimeout;

    if (deferred) deferred.promise(xhr);

    if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest');
    setHeader('Accept', mime || '*/*');
    if (mime = settings.mimeType || mime) {
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0];
      xhr.overrideMimeType && xhr.overrideMimeType(mime);
    }
    if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
      setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded');

    if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name]);
    xhr.setRequestHeader = setHeader;

    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        xhr.onreadystatechange = empty;
        clearTimeout(abortTimeout);
        var result, error = false;
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
          dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'));

          if (xhr.responseType == 'arraybuffer' || xhr.responseType == 'blob')
            result = xhr.response;
          else {
            result = xhr.responseText;

            try {
              // http://perfectionkills.com/global-eval-what-are-the-options/
              // sanitize response accordingly if data filter callback provided
              result = ajaxDataFilter(result, dataType, settings);
              if (dataType == 'script')    (eval)(result);
              else if (dataType == 'xml')  result = xhr.responseXML;
              else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result);
            } catch (e) { error = e; }

            if (error) return ajaxError(error, 'parsererror', xhr, settings, deferred)
          }

          ajaxSuccess(result, xhr, settings, deferred);
        } else {
          ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred);
        }
      }
    };

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort();
      ajaxError(null, 'abort', xhr, settings, deferred);
      return xhr
    }

    var async = 'async' in settings ? settings.async : true;
    xhr.open(settings.type, settings.url, async, settings.username, settings.password);

    if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name];

    for (name in headers) nativeSetHeader.apply(xhr, headers[name]);

    if (settings.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.onreadystatechange = empty;
        xhr.abort();
        ajaxError(null, 'timeout', xhr, settings, deferred);
      }, settings.timeout);

    // avoid sending empty string (#319)
    xhr.send(settings.data ? settings.data : null);
    return xhr
  };

  // handle optional data/success arguments
  function parseArguments(url, data, success, dataType) {
    if ($.isFunction(data)) dataType = success, success = data, data = undefined;
    if (!$.isFunction(success)) dataType = success, success = undefined;
    return {
      url: url
    , data: data
    , success: success
    , dataType: dataType
    }
  }

  $.get = function(/* url, data, success, dataType */){
    return $.ajax(parseArguments.apply(null, arguments))
  };

  $.post = function(/* url, data, success, dataType */){
    var options = parseArguments.apply(null, arguments);
    options.type = 'POST';
    return $.ajax(options)
  };

  $.getJSON = function(/* url, data, success */){
    var options = parseArguments.apply(null, arguments);
    options.dataType = 'json';
    return $.ajax(options)
  };

  $.fn.load = function(url, data, success){
    if (!this.length) return this
    var self = this, parts = url.split(/\s/), selector,
        options = parseArguments(url, data, success),
        callback = options.success;
    if (parts.length > 1) options.url = parts[0], selector = parts[1];
    options.success = function(response){
      self.html(selector ?
        $('<div>').html(response.replace(rscript, "")).find(selector)
        : response);
      callback && callback.apply(self, arguments);
    };
    $.ajax(options);
    return this
  };

  var escape = encodeURIComponent;

  function serialize(params, obj, traditional, scope){
    var type, array = $.isArray(obj), hash = $.isPlainObject(obj);
    $.each(obj, function(key, value) {
      type = $.type(value);
      if (scope) key = traditional ? scope :
        scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']';
      // handle data in serializeArray() format
      if (!scope && array) params.add(value.name, value.value);
      // recurse into nested objects
      else if (type == "array" || (!traditional && type == "object"))
        serialize(params, value, traditional, key);
      else params.add(key, value);
    });
  }

  $.param = function(obj, traditional){
    var params = [];
    params.add = function(key, value) {
      if ($.isFunction(value)) value = value();
      if (value == null) value = "";
      this.push(escape(key) + '=' + escape(value));
    };
    serialize(params, obj, traditional);
    return params.join('&').replace(/%20/g, '+')
  };
})(zepto);

(function($){
  $.fn.serializeArray = function() {
    var name, type, result = [],
      add = function(value) {
        if (value.forEach) return value.forEach(add)
        result.push({ name: name, value: value });
      };
    if (this[0]) $.each(this[0].elements, function(_, field){
      type = field.type, name = field.name;
      if (name && field.nodeName.toLowerCase() != 'fieldset' &&
        !field.disabled && type != 'submit' && type != 'reset' && type != 'button' && type != 'file' &&
        ((type != 'radio' && type != 'checkbox') || field.checked))
          add($(field).val());
    });
    return result
  };

  $.fn.serialize = function(){
    var result = [];
    this.serializeArray().forEach(function(elm){
      result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value));
    });
    return result.join('&')
  };

  $.fn.submit = function(callback) {
    if (0 in arguments) this.bind('submit', callback);
    else if (this.length) {
      var event = $.Event('submit');
      this.eq(0).trigger(event);
      if (!event.isDefaultPrevented()) this.get(0).submit();
    }
    return this
  };

})(zepto);

// node_modules/zepto-modules/ie.js
(function(){
  // getComputedStyle shouldn't freak out when called
  // without a valid element as argument
  try {
    getComputedStyle(undefined);
  } catch(e) {
    var nativeGetComputedStyle = getComputedStyle;
    window.getComputedStyle = function(element, pseudoElement){
      try {
        return nativeGetComputedStyle(element, pseudoElement)
      } catch(e) {
        return null
      }
    };
  }
})();

//  commonjs-proxy:/Users/dtai/work/hanzo/astley.js/node_modules/zepto-modules/event.js

//  commonjs-proxy:/Users/dtai/work/hanzo/astley.js/node_modules/zepto-modules/ajax.js

//  commonjs-proxy:/Users/dtai/work/hanzo/astley.js/node_modules/zepto-modules/form.js

//  commonjs-proxy:/Users/dtai/work/hanzo/astley.js/node_modules/zepto-modules/ie.js

// node_modules/zepto-modules/_default.js







var _default = zepto;

(function($){
  var zepto$$1 = $.zepto, oldQsa = zepto$$1.qsa, oldMatches = zepto$$1.matches;

  function visible(elem){
    elem = $(elem);
    return !!(elem.width() || elem.height()) && elem.css("display") !== "none"
  }

  // Implements a subset from:
  // http://api.jquery.com/category/selectors/jquery-selector-extensions/
  //
  // Each filter function receives the current index, all nodes in the
  // considered set, and a value if there were parentheses. The value
  // of `this` is the node currently being considered. The function returns the
  // resulting node(s), null, or undefined.
  //
  // Complex selectors are not supported:
  //   li:has(label:contains("foo")) + li:has(label:contains("bar"))
  //   ul.inner:first > li
  var filters = $.expr[':'] = {
    visible:  function(){ if (visible(this)) return this },
    hidden:   function(){ if (!visible(this)) return this },
    selected: function(){ if (this.selected) return this },
    checked:  function(){ if (this.checked) return this },
    parent:   function(){ return this.parentNode },
    first:    function(idx){ if (idx === 0) return this },
    last:     function(idx, nodes){ if (idx === nodes.length - 1) return this },
    eq:       function(idx, _, value){ if (idx === value) return this },
    contains: function(idx, _, text){ if ($(this).text().indexOf(text) > -1) return this },
    has:      function(idx, _, sel){ if (zepto$$1.qsa(this, sel).length) return this }
  };

  var filterRe = new RegExp('(.*):(\\w+)(?:\\(([^)]+)\\))?$\\s*'),
      childRe  = /^\s*>/,
      classTag = 'Zepto' + (+new Date());

  function process(sel, fn) {
    // quote the hash in `a[href^=#]` expression
    sel = sel.replace(/=#\]/g, '="#"]');
    var filter, arg, match = filterRe.exec(sel);
    if (match && match[2] in filters) {
      filter = filters[match[2]], arg = match[3];
      sel = match[1];
      if (arg) {
        var num = Number(arg);
        if (isNaN(num)) arg = arg.replace(/^["']|["']$/g, '');
        else arg = num;
      }
    }
    return fn(sel, filter, arg)
  }

  zepto$$1.qsa = function(node, selector) {
    return process(selector, function(sel, filter, arg){
      try {
        var taggedParent;
        if (!sel && filter) sel = '*';
        else if (childRe.test(sel))
          // support "> *" child queries by tagging the parent node with a
          // unique class and prepending that classname onto the selector
          taggedParent = $(node).addClass(classTag), sel = '.'+classTag+' '+sel;

        var nodes = oldQsa(node, sel);
      } catch(e) {
        console.error('error performing selector: %o', selector);
        throw e
      } finally {
        if (taggedParent) taggedParent.removeClass(classTag);
      }
      return !filter ? nodes :
        zepto$$1.uniq($.map(nodes, function(n, i){ return filter.call(n, i, nodes, arg) }))
    })
  };

  zepto$$1.matches = function(node, selector){
    return process(selector, function(sel, filter, arg){
      return (!sel || oldMatches(node, sel)) &&
        (!filter || filter.call(node, null, arg) === node)
    })
  };
})(zepto);

// src/zepto.coffee

// node_modules/es-tostring/index.mjs
function toString(obj) {
  return Object.prototype.toString.call(obj)
}

// node_modules/es-is/function.js
// Generated by CoffeeScript 1.12.5
var isFunction;

var isFunction$1 = isFunction = function(value) {
  var str;
  if (typeof window !== 'undefined' && value === window.alert) {
    return true;
  }
  str = toString(value);
  return str === '[object Function]' || str === '[object GeneratorFunction]' || str === '[object AsyncFunction]';
};

// node_modules/riot/lib/browser/common/global-variables.js
const
  // be aware, internal usage
  // ATTENTION: prefix the global dynamic variables with `__`
  // tags instances cache
  __TAGS_CACHE = [],
  // tags implementation cache
  __TAG_IMPL = {},
  YIELD_TAG = 'yield',

  /**
   * Const
   */
  GLOBAL_MIXIN = '__global_mixin',

  // riot specific prefixes or attributes
  ATTRS_PREFIX = 'riot-',

  // Riot Directives
  REF_DIRECTIVES = ['ref', 'data-ref'],
  IS_DIRECTIVE = 'data-is',
  CONDITIONAL_DIRECTIVE = 'if',
  LOOP_DIRECTIVE = 'each',
  LOOP_NO_REORDER_DIRECTIVE = 'no-reorder',
  SHOW_DIRECTIVE = 'show',
  HIDE_DIRECTIVE = 'hide',
  KEY_DIRECTIVE = 'key',
  RIOT_EVENTS_KEY = '__riot-events__',

  // for typeof == '' comparisons
  T_STRING = 'string',
  T_OBJECT = 'object',
  T_UNDEF  = 'undefined',
  T_FUNCTION = 'function',

  XLINK_NS = 'http://www.w3.org/1999/xlink',
  SVG_NS = 'http://www.w3.org/2000/svg',
  XLINK_REGEX = /^xlink:(\w+)/,

  WIN = typeof window === T_UNDEF ? undefined : window,

  // special native tags that cannot be treated like the others
  RE_SPECIAL_TAGS = /^(?:t(?:body|head|foot|[rhd])|caption|col(?:group)?|opt(?:ion|group))$/,
  RE_SPECIAL_TAGS_NO_OPTION = /^(?:t(?:body|head|foot|[rhd])|caption|col(?:group)?)$/,
  RE_EVENTS_PREFIX = /^on/,
  RE_HTML_ATTRS = /([-\w]+) ?= ?(?:"([^"]*)|'([^']*)|({[^}]*}))/g,
  // some DOM attributes must be normalized
  CASE_SENSITIVE_ATTRIBUTES = {
    'viewbox': 'viewBox',
    'preserveaspectratio': 'preserveAspectRatio'
  },
  /**
   * Matches boolean HTML attributes in the riot tag definition.
   * With a long list like this, a regex is faster than `[].indexOf` in most browsers.
   * @const {RegExp}
   * @see [attributes.md](https://github.com/riot/compiler/blob/dev/doc/attributes.md)
   */
  RE_BOOL_ATTRS = /^(?:disabled|checked|readonly|required|allowfullscreen|auto(?:focus|play)|compact|controls|default|formnovalidate|hidden|ismap|itemscope|loop|multiple|muted|no(?:resize|shade|validate|wrap)?|open|reversed|seamless|selected|sortable|truespeed|typemustmatch)$/,
  // version# for IE 8-11, 0 for others
  IE_VERSION = (WIN && WIN.document || {}).documentMode | 0;

// node_modules/riot/lib/browser/common/util/dom.js

/**
 * Shorter and fast way to select multiple nodes in the DOM
 * @param   { String } selector - DOM selector
 * @param   { Object } ctx - DOM node where the targets of our search will is located
 * @returns { Object } dom nodes found
 */
function $$(selector, ctx) {
  return [].slice.call((ctx || document).querySelectorAll(selector))
}

/**
 * Shorter and fast way to select a single node in the DOM
 * @param   { String } selector - unique dom selector
 * @param   { Object } ctx - DOM node where the target of our search will is located
 * @returns { Object } dom node found
 */
function $(selector, ctx) {
  return (ctx || document).querySelector(selector)
}

/**
 * Create a document fragment
 * @returns { Object } document fragment
 */
function createFrag() {
  return document.createDocumentFragment()
}

/**
 * Create a document text node
 * @returns { Object } create a text node to use as placeholder
 */
function createDOMPlaceholder() {
  return document.createTextNode('')
}

/**
 * Check if a DOM node is an svg tag or part of an svg
 * @param   { HTMLElement }  el - node we want to test
 * @returns {Boolean} true if it's an svg node
 */
function isSvg(el) {
  const owner = el.ownerSVGElement;
  return !!owner || owner === null
}

/**
 * Create a generic DOM node
 * @param   { String } name - name of the DOM node we want to create
 * @returns { Object } DOM node just created
 */
function mkEl(name) {
  return name === 'svg' ? document.createElementNS(SVG_NS, name) : document.createElement(name)
}

/**
 * Set the inner html of any DOM node SVGs included
 * @param { Object } container - DOM node where we'll inject new html
 * @param { String } html - html to inject
 * @param { Boolean } isSvg - svg tags should be treated a bit differently
 */
/* istanbul ignore next */
function setInnerHTML(container, html, isSvg) {
  // innerHTML is not supported on svg tags so we neet to treat them differently
  if (isSvg) {
    const node = container.ownerDocument.importNode(
      new DOMParser()
        .parseFromString(`<svg xmlns="${ SVG_NS }">${ html }</svg>`, 'application/xml')
        .documentElement,
      true
    );

    container.appendChild(node);
  } else {
    container.innerHTML = html;
  }
}

/**
 * Toggle the visibility of any DOM node
 * @param   { Object }  dom - DOM node we want to hide
 * @param   { Boolean } show - do we want to show it?
 */

function toggleVisibility(dom, show) {
  dom.style.display = show ? '' : 'none';
  dom.hidden = show ? false : true;
}

/**
 * Remove any DOM attribute from a node
 * @param   { Object } dom - DOM node we want to update
 * @param   { String } name - name of the property we want to remove
 */
function remAttr(dom, name) {
  dom.removeAttribute(name);
}

/**
 * Convert a style object to a string
 * @param   { Object } style - style object we need to parse
 * @returns { String } resulting css string
 * @example
 * styleObjectToString({ color: 'red', height: '10px'}) // => 'color: red; height: 10px'
 */
function styleObjectToString(style) {
  return Object.keys(style).reduce((acc, prop) => {
    return `${acc} ${prop}: ${style[prop]};`
  }, '')
}

/**
 * Get the value of any DOM attribute on a node
 * @param   { Object } dom - DOM node we want to parse
 * @param   { String } name - name of the attribute we want to get
 * @returns { String | undefined } name of the node attribute whether it exists
 */
function getAttr(dom, name) {
  return dom.getAttribute(name)
}

/**
 * Set any DOM attribute
 * @param { Object } dom - DOM node we want to update
 * @param { String } name - name of the property we want to set
 * @param { String } val - value of the property we want to set
 */
function setAttr(dom, name, val) {
  const xlink = XLINK_REGEX.exec(name);
  if (xlink && xlink[1])
    dom.setAttributeNS(XLINK_NS, xlink[1], val);
  else
    dom.setAttribute(name, val);
}

/**
 * Insert safely a tag to fix #1962 #1649
 * @param   { HTMLElement } root - children container
 * @param   { HTMLElement } curr - node to insert
 * @param   { HTMLElement } next - node that should preceed the current node inserted
 */
function safeInsert(root, curr, next) {
  root.insertBefore(curr, next.parentNode && next);
}

/**
 * Minimize risk: only zero or one _space_ between attr & value
 * @param   { String }   html - html string we want to parse
 * @param   { Function } fn - callback function to apply on any attribute found
 */
function walkAttrs(html, fn) {
  if (!html) return
  let m;
  while (m = RE_HTML_ATTRS.exec(html))
    fn(m[1].toLowerCase(), m[2] || m[3] || m[4]);
}

/**
 * Walk down recursively all the children tags starting dom node
 * @param   { Object }   dom - starting node where we will start the recursion
 * @param   { Function } fn - callback to transform the child node just found
 * @param   { Object }   context - fn can optionally return an object, which is passed to children
 */
function walkNodes(dom, fn, context) {
  if (dom) {
    const res = fn(dom, context);
    let next;
    // stop the recursion
    if (res === false) return

    dom = dom.firstChild;

    while (dom) {
      next = dom.nextSibling;
      walkNodes(dom, fn, res);
      dom = next;
    }
  }
}

var dom = Object.freeze({
	$$: $$,
	$: $,
	createFrag: createFrag,
	createDOMPlaceholder: createDOMPlaceholder,
	isSvg: isSvg,
	mkEl: mkEl,
	setInnerHTML: setInnerHTML,
	toggleVisibility: toggleVisibility,
	remAttr: remAttr,
	styleObjectToString: styleObjectToString,
	getAttr: getAttr,
	setAttr: setAttr,
	safeInsert: safeInsert,
	walkAttrs: walkAttrs,
	walkNodes: walkNodes
});

// node_modules/riot/lib/browser/tag/styleManager.js

let styleNode;
// Create cache and shortcut to the correct property
let cssTextProp;
let byName = {};
let remainder = [];
let needsInject = false;

// skip the following code on the server
if (WIN) {
  styleNode = ((() => {
    // create a new style element with the correct type
    const newNode = mkEl('style');
    // replace any user node or insert the new one into the head
    const userNode = $('style[type=riot]');

    setAttr(newNode, 'type', 'text/css');
    /* istanbul ignore next */
    if (userNode) {
      if (userNode.id) newNode.id = userNode.id;
      userNode.parentNode.replaceChild(newNode, userNode);
    } else document.head.appendChild(newNode);

    return newNode
  }))();
  cssTextProp = styleNode.styleSheet;
}

/**
 * Object that will be used to inject and manage the css of every tag instance
 */
var styleManager = {
  styleNode,
  /**
   * Save a tag style to be later injected into DOM
   * @param { String } css - css string
   * @param { String } name - if it's passed we will map the css to a tagname
   */
  add(css, name) {
    if (name) byName[name] = css;
    else remainder.push(css);
    needsInject = true;
  },
  /**
   * Inject all previously saved tag styles into DOM
   * innerHTML seems slow: http://jsperf.com/riot-insert-style
   */
  inject() {
    if (!WIN || !needsInject) return
    needsInject = false;
    const style = Object.keys(byName)
      .map(k => byName[k])
      .concat(remainder).join('\n');
    /* istanbul ignore next */
    if (cssTextProp) cssTextProp.cssText = style;
    else styleNode.innerHTML = style;
  }
}

// node_modules/riot-tmpl/dist/es6.tmpl.js

/**
 * The riot template engine
 * @version v3.0.8
 */

var skipRegex = (function () { //eslint-disable-line no-unused-vars

  var beforeReChars = '[{(,;:?=|&!^~>%*/';

  var beforeReWords = [
    'case',
    'default',
    'do',
    'else',
    'in',
    'instanceof',
    'prefix',
    'return',
    'typeof',
    'void',
    'yield'
  ];

  var wordsLastChar = beforeReWords.reduce(function (s, w) {
    return s + w.slice(-1)
  }, '');

  var RE_REGEX = /^\/(?=[^*>/])[^[/\\]*(?:(?:\\.|\[(?:\\.|[^\]\\]*)*\])[^[\\/]*)*?\/[gimuy]*/;
  var RE_VN_CHAR = /[$\w]/;

  function prev (code, pos) {
    while (--pos >= 0 && /\s/.test(code[pos]));
    return pos
  }

  function _skipRegex (code, start) {

    var re = /.*/g;
    var pos = re.lastIndex = start++;
    var match = re.exec(code)[0].match(RE_REGEX);

    if (match) {
      var next = pos + match[0].length;

      pos = prev(code, pos);
      var c = code[pos];

      if (pos < 0 || ~beforeReChars.indexOf(c)) {
        return next
      }

      if (c === '.') {

        if (code[pos - 1] === '.') {
          start = next;
        }

      } else if (c === '+' || c === '-') {

        if (code[--pos] !== c ||
            (pos = prev(code, pos)) < 0 ||
            !RE_VN_CHAR.test(code[pos])) {
          start = next;
        }

      } else if (~wordsLastChar.indexOf(c)) {

        var end = pos + 1;

        while (--pos >= 0 && RE_VN_CHAR.test(code[pos]));
        if (~beforeReWords.indexOf(code.slice(pos + 1, end))) {
          start = next;
        }
      }
    }

    return start
  }

  return _skipRegex

})();

/**
 * riot.util.brackets
 *
 * - `brackets    ` - Returns a string or regex based on its parameter
 * - `brackets.set` - Change the current riot brackets
 *
 * @module
 */

/* global riot */

var brackets = (function (UNDEF) {

  var
    REGLOB = 'g',

    R_MLCOMMS = /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//g,

    R_STRINGS = /"[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'|`[^`\\]*(?:\\[\S\s][^`\\]*)*`/g,

    S_QBLOCKS = R_STRINGS.source + '|' +
      /(?:\breturn\s+|(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/]))/.source + '|' +
      /\/(?=[^*\/])[^[\/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[\/\\]*)*?([^<]\/)[gim]*/.source,

    UNSUPPORTED = RegExp('[\\' + 'x00-\\x1F<>a-zA-Z0-9\'",;\\\\]'),

    NEED_ESCAPE = /(?=[[\]()*+?.^$|])/g,

    S_QBLOCK2 = R_STRINGS.source + '|' + /(\/)(?![*\/])/.source,

    FINDBRACES = {
      '(': RegExp('([()])|'   + S_QBLOCK2, REGLOB),
      '[': RegExp('([[\\]])|' + S_QBLOCK2, REGLOB),
      '{': RegExp('([{}])|'   + S_QBLOCK2, REGLOB)
    },

    DEFAULT = '{ }';

  var _pairs = [
    '{', '}',
    '{', '}',
    /{[^}]*}/,
    /\\([{}])/g,
    /\\({)|{/g,
    RegExp('\\\\(})|([[({])|(})|' + S_QBLOCK2, REGLOB),
    DEFAULT,
    /^\s*{\^?\s*([$\w]+)(?:\s*,\s*(\S+))?\s+in\s+(\S.*)\s*}/,
    /(^|[^\\]){=[\S\s]*?}/
  ];

  var
    cachedBrackets = UNDEF,
    _regex,
    _cache = [],
    _settings;

  function _loopback (re) { return re }

  function _rewrite (re, bp) {
    if (!bp) bp = _cache;
    return new RegExp(
      re.source.replace(/{/g, bp[2]).replace(/}/g, bp[3]), re.global ? REGLOB : ''
    )
  }

  function _create (pair) {
    if (pair === DEFAULT) return _pairs

    var arr = pair.split(' ');

    if (arr.length !== 2 || UNSUPPORTED.test(pair)) {
      throw new Error('Unsupported brackets "' + pair + '"')
    }
    arr = arr.concat(pair.replace(NEED_ESCAPE, '\\').split(' '));

    arr[4] = _rewrite(arr[1].length > 1 ? /{[\S\s]*?}/ : _pairs[4], arr);
    arr[5] = _rewrite(pair.length > 3 ? /\\({|})/g : _pairs[5], arr);
    arr[6] = _rewrite(_pairs[6], arr);
    arr[7] = RegExp('\\\\(' + arr[3] + ')|([[({])|(' + arr[3] + ')|' + S_QBLOCK2, REGLOB);
    arr[8] = pair;
    return arr
  }

  function _brackets (reOrIdx) {
    return reOrIdx instanceof RegExp ? _regex(reOrIdx) : _cache[reOrIdx]
  }

  _brackets.split = function split (str, tmpl, _bp) {
    // istanbul ignore next: _bp is for the compiler
    if (!_bp) _bp = _cache;

    var
      parts = [],
      match,
      isexpr,
      start,
      pos,
      re = _bp[6];

    var qblocks = [];
    var prevStr = '';
    var mark, lastIndex;

    isexpr = start = re.lastIndex = 0;

    while ((match = re.exec(str))) {

      lastIndex = re.lastIndex;
      pos = match.index;

      if (isexpr) {

        if (match[2]) {

          var ch = match[2];
          var rech = FINDBRACES[ch];
          var ix = 1;

          rech.lastIndex = lastIndex;
          while ((match = rech.exec(str))) {
            if (match[1]) {
              if (match[1] === ch) ++ix;
              else if (!--ix) break
            } else {
              rech.lastIndex = pushQBlock(match.index, rech.lastIndex, match[2]);
            }
          }
          re.lastIndex = ix ? str.length : rech.lastIndex;
          continue
        }

        if (!match[3]) {
          re.lastIndex = pushQBlock(pos, lastIndex, match[4]);
          continue
        }
      }

      if (!match[1]) {
        unescapeStr(str.slice(start, pos));
        start = re.lastIndex;
        re = _bp[6 + (isexpr ^= 1)];
        re.lastIndex = start;
      }
    }

    if (str && start < str.length) {
      unescapeStr(str.slice(start));
    }

    parts.qblocks = qblocks;

    return parts

    function unescapeStr (s) {
      if (prevStr) {
        s = prevStr + s;
        prevStr = '';
      }
      if (tmpl || isexpr) {
        parts.push(s && s.replace(_bp[5], '$1'));
      } else {
        parts.push(s);
      }
    }

    function pushQBlock(_pos, _lastIndex, slash) { //eslint-disable-line
      if (slash) {
        _lastIndex = skipRegex(str, _pos);
      }

      if (tmpl && _lastIndex > _pos + 2) {
        mark = '\u2057' + qblocks.length + '~';
        qblocks.push(str.slice(_pos, _lastIndex));
        prevStr += str.slice(start, _pos) + mark;
        start = _lastIndex;
      }
      return _lastIndex
    }
  };

  _brackets.hasExpr = function hasExpr (str) {
    return _cache[4].test(str)
  };

  _brackets.loopKeys = function loopKeys (expr) {
    var m = expr.match(_cache[9]);

    return m
      ? { key: m[1], pos: m[2], val: _cache[0] + m[3].trim() + _cache[1] }
      : { val: expr.trim() }
  };

  _brackets.array = function array (pair) {
    return pair ? _create(pair) : _cache
  };

  function _reset (pair) {
    if ((pair || (pair = DEFAULT)) !== _cache[8]) {
      _cache = _create(pair);
      _regex = pair === DEFAULT ? _loopback : _rewrite;
      _cache[9] = _regex(_pairs[9]);
    }
    cachedBrackets = pair;
  }

  function _setSettings (o) {
    var b;

    o = o || {};
    b = o.brackets;
    Object.defineProperty(o, 'brackets', {
      set: _reset,
      get: function () { return cachedBrackets },
      enumerable: true
    });
    _settings = o;
    _reset(b);
  }

  Object.defineProperty(_brackets, 'settings', {
    set: _setSettings,
    get: function () { return _settings }
  });

  /* istanbul ignore next: in the browser riot is always in the scope */
  _brackets.settings = typeof riot !== 'undefined' && riot.settings || {};
  _brackets.set = _reset;
  _brackets.skipRegex = skipRegex;

  _brackets.R_STRINGS = R_STRINGS;
  _brackets.R_MLCOMMS = R_MLCOMMS;
  _brackets.S_QBLOCKS = S_QBLOCKS;
  _brackets.S_QBLOCK2 = S_QBLOCK2;

  return _brackets

})();

/**
 * @module tmpl
 *
 * tmpl          - Root function, returns the template value, render with data
 * tmpl.hasExpr  - Test the existence of a expression inside a string
 * tmpl.loopKeys - Get the keys for an 'each' loop (used by `_each`)
 */

var tmpl = (function () {

  var _cache = {};

  function _tmpl (str, data) {
    if (!str) return str

    return (_cache[str] || (_cache[str] = _create(str))).call(
      data, _logErr.bind({
        data: data,
        tmpl: str
      })
    )
  }

  _tmpl.hasExpr = brackets.hasExpr;

  _tmpl.loopKeys = brackets.loopKeys;

  // istanbul ignore next
  _tmpl.clearCache = function () { _cache = {}; };

  _tmpl.errorHandler = null;

  function _logErr (err, ctx) {

    err.riotData = {
      tagName: ctx && ctx.__ && ctx.__.tagName,
      _riot_id: ctx && ctx._riot_id  //eslint-disable-line camelcase
    };

    if (_tmpl.errorHandler) _tmpl.errorHandler(err);
    else if (
      typeof console !== 'undefined' &&
      typeof console.error === 'function'
    ) {
      console.error(err.message);
      console.log('<%s> %s', err.riotData.tagName || 'Unknown tag', this.tmpl); // eslint-disable-line
      console.log(this.data); // eslint-disable-line
    }
  }

  function _create (str) {
    var expr = _getTmpl(str);

    if (expr.slice(0, 11) !== 'try{return ') expr = 'return ' + expr;

    return new Function('E', expr + ';')    // eslint-disable-line no-new-func
  }

  var RE_DQUOTE = /\u2057/g;
  var RE_QBMARK = /\u2057(\d+)~/g;

  function _getTmpl (str) {
    var parts = brackets.split(str.replace(RE_DQUOTE, '"'), 1);
    var qstr = parts.qblocks;
    var expr;

    if (parts.length > 2 || parts[0]) {
      var i, j, list = [];

      for (i = j = 0; i < parts.length; ++i) {

        expr = parts[i];

        if (expr && (expr = i & 1

            ? _parseExpr(expr, 1, qstr)

            : '"' + expr
                .replace(/\\/g, '\\\\')
                .replace(/\r\n?|\n/g, '\\n')
                .replace(/"/g, '\\"') +
              '"'

          )) list[j++] = expr;

      }

      expr = j < 2 ? list[0]
           : '[' + list.join(',') + '].join("")';

    } else {

      expr = _parseExpr(parts[1], 0, qstr);
    }

    if (qstr.length) {
      expr = expr.replace(RE_QBMARK, function (_, pos) {
        return qstr[pos]
          .replace(/\r/g, '\\r')
          .replace(/\n/g, '\\n')
      });
    }
    return expr
  }

  var RE_CSNAME = /^(?:(-?[_A-Za-z\xA0-\xFF][-\w\xA0-\xFF]*)|\u2057(\d+)~):/;
  var
    RE_BREND = {
      '(': /[()]/g,
      '[': /[[\]]/g,
      '{': /[{}]/g
    };

  function _parseExpr (expr, asText, qstr) {

    expr = expr
      .replace(/\s+/g, ' ').trim()
      .replace(/\ ?([[\({},?\.:])\ ?/g, '$1');

    if (expr) {
      var
        list = [],
        cnt = 0,
        match;

      while (expr &&
            (match = expr.match(RE_CSNAME)) &&
            !match.index
        ) {
        var
          key,
          jsb,
          re = /,|([[{(])|$/g;

        expr = RegExp.rightContext;
        key  = match[2] ? qstr[match[2]].slice(1, -1).trim().replace(/\s+/g, ' ') : match[1];

        while (jsb = (match = re.exec(expr))[1]) skipBraces(jsb, re);

        jsb  = expr.slice(0, match.index);
        expr = RegExp.rightContext;

        list[cnt++] = _wrapExpr(jsb, 1, key);
      }

      expr = !cnt ? _wrapExpr(expr, asText)
           : cnt > 1 ? '[' + list.join(',') + '].join(" ").trim()' : list[0];
    }
    return expr

    function skipBraces (ch, re) {
      var
        mm,
        lv = 1,
        ir = RE_BREND[ch];

      ir.lastIndex = re.lastIndex;
      while (mm = ir.exec(expr)) {
        if (mm[0] === ch) ++lv;
        else if (!--lv) break
      }
      re.lastIndex = lv ? expr.length : ir.lastIndex;
    }
  }

  // istanbul ignore next: not both
  var // eslint-disable-next-line max-len
    JS_CONTEXT = '"in this?this:' + (typeof window !== 'object' ? 'global' : 'window') + ').',
    JS_VARNAME = /[,{][\$\w]+(?=:)|(^ *|[^$\w\.{])(?!(?:typeof|true|false|null|undefined|in|instanceof|is(?:Finite|NaN)|void|NaN|new|Date|RegExp|Math)(?![$\w]))([$_A-Za-z][$\w]*)/g,
    JS_NOPROPS = /^(?=(\.[$\w]+))\1(?:[^.[(]|$)/;

  function _wrapExpr (expr, asText, key) {
    var tb;

    expr = expr.replace(JS_VARNAME, function (match, p, mvar, pos, s) {
      if (mvar) {
        pos = tb ? 0 : pos + match.length;

        if (mvar !== 'this' && mvar !== 'global' && mvar !== 'window') {
          match = p + '("' + mvar + JS_CONTEXT + mvar;
          if (pos) tb = (s = s[pos]) === '.' || s === '(' || s === '[';
        } else if (pos) {
          tb = !JS_NOPROPS.test(s.slice(pos));
        }
      }
      return match
    });

    if (tb) {
      expr = 'try{return ' + expr + '}catch(e){E(e,this)}';
    }

    if (key) {

      expr = (tb
          ? 'function(){' + expr + '}.call(this)' : '(' + expr + ')'
        ) + '?"' + key + '":""';

    } else if (asText) {

      expr = 'function(v){' + (tb
          ? expr.replace('return ', 'v=') : 'v=(' + expr + ')'
        ) + ';return v||v===0?v:""}.call(this)';
    }

    return expr
  }

  _tmpl.version = brackets.version = 'v3.0.8';

  return _tmpl

})();

// node_modules/riot-observable/dist/es6.observable.js
var observable = function(el) {

  /**
   * Extend the original object or create a new empty one
   * @type { Object }
   */

  el = el || {};

  /**
   * Private variables
   */
  var callbacks = {},
    slice = Array.prototype.slice;

  /**
   * Public Api
   */

  // extend the el object adding the observable methods
  Object.defineProperties(el, {
    /**
     * Listen to the given `event` ands
     * execute the `callback` each time an event is triggered.
     * @param  { String } event - event id
     * @param  { Function } fn - callback function
     * @returns { Object } el
     */
    on: {
      value: function(event, fn) {
        if (typeof fn == 'function')
          (callbacks[event] = callbacks[event] || []).push(fn);
        return el
      },
      enumerable: false,
      writable: false,
      configurable: false
    },

    /**
     * Removes the given `event` listeners
     * @param   { String } event - event id
     * @param   { Function } fn - callback function
     * @returns { Object } el
     */
    off: {
      value: function(event, fn) {
        if (event == '*' && !fn) callbacks = {};
        else {
          if (fn) {
            var arr = callbacks[event];
            for (var i = 0, cb; cb = arr && arr[i]; ++i) {
              if (cb == fn) arr.splice(i--, 1);
            }
          } else delete callbacks[event];
        }
        return el
      },
      enumerable: false,
      writable: false,
      configurable: false
    },

    /**
     * Listen to the given `event` and
     * execute the `callback` at most once
     * @param   { String } event - event id
     * @param   { Function } fn - callback function
     * @returns { Object } el
     */
    one: {
      value: function(event, fn) {
        function on() {
          el.off(event, on);
          fn.apply(el, arguments);
        }
        return el.on(event, on)
      },
      enumerable: false,
      writable: false,
      configurable: false
    },

    /**
     * Execute all callback functions that listen to
     * the given `event`
     * @param   { String } event - event id
     * @returns { Object } el
     */
    trigger: {
      value: function(event) {

        // getting the arguments
        var arglen = arguments.length - 1,
          args = new Array(arglen),
          fns,
          fn,
          i;

        for (i = 0; i < arglen; i++) {
          args[i] = arguments[i + 1]; // skip first argument
        }

        fns = slice.call(callbacks[event] || [], 0);

        for (i = 0; fn = fns[i]; ++i) {
          fn.apply(el, args);
        }

        if (callbacks['*'] && event != '*')
          el.trigger.apply(el, ['*', event].concat(args));

        return el
      },
      enumerable: false,
      writable: false,
      configurable: false
    }
  });

  return el

};

// node_modules/riot/lib/browser/common/util/check.js

/**
 * Check if the passed argument is a boolean attribute
 * @param   { String } value -
 * @returns { Boolean } -
 */
function isBoolAttr(value) {
  return RE_BOOL_ATTRS.test(value)
}

/**
 * Check if passed argument is a function
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isFunction$2(value) {
  return typeof value === T_FUNCTION
}

/**
 * Check if passed argument is an object, exclude null
 * NOTE: use isObject(x) && !isArray(x) to excludes arrays.
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isObject(value) {
  return value && typeof value === T_OBJECT // typeof null is 'object'
}

/**
 * Check if passed argument is undefined
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isUndefined(value) {
  return typeof value === T_UNDEF
}

/**
 * Check if passed argument is a string
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isString(value) {
  return typeof value === T_STRING
}

/**
 * Check if passed argument is empty. Different from falsy, because we dont consider 0 or false to be blank
 * @param { * } value -
 * @returns { Boolean } -
 */
function isBlank(value) {
  return isNil(value) || value === ''
}

/**
 * Check against the null and undefined values
 * @param   { * }  value -
 * @returns {Boolean} -
 */
function isNil(value) {
  return isUndefined(value) || value === null
}

/**
 * Check if passed argument is a kind of array
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isArray(value) {
  return Array.isArray(value) || value instanceof Array
}

/**
 * Check whether object's property could be overridden
 * @param   { Object }  obj - source object
 * @param   { String }  key - object property
 * @returns { Boolean } true if writable
 */
function isWritable(obj, key) {
  const descriptor = getPropDescriptor(obj, key);
  return isUndefined(obj[key]) || descriptor && descriptor.writable
}


var check = Object.freeze({
	isBoolAttr: isBoolAttr,
	isFunction: isFunction$2,
	isObject: isObject,
	isUndefined: isUndefined,
	isString: isString,
	isBlank: isBlank,
	isNil: isNil,
	isArray: isArray,
	isWritable: isWritable
});

// node_modules/riot/lib/browser/common/util/misc.js

/**
 * Specialized function for looping an array-like collection with `each={}`
 * @param   { Array } list - collection of items
 * @param   {Function} fn - callback function
 * @returns { Array } the array looped
 */
function each(list, fn) {
  const len = list ? list.length : 0;
  let i = 0;
  for (; i < len; i++) fn(list[i], i);
  return list
}

/**
 * Check whether an array contains an item
 * @param   { Array } array - target array
 * @param   { * } item - item to test
 * @returns { Boolean } -
 */
function contains(array, item) {
  return array.indexOf(item) !== -1
}

/**
 * Convert a string containing dashes to camel case
 * @param   { String } str - input string
 * @returns { String } my-string -> myString
 */
function toCamel(str) {
  return str.replace(/-(\w)/g, (_, c) => c.toUpperCase())
}

/**
 * Faster String startsWith alternative
 * @param   { String } str - source string
 * @param   { String } value - test string
 * @returns { Boolean } -
 */
function startsWith(str, value) {
  return str.slice(0, value.length) === value
}

/**
 * Helper function to set an immutable property
 * @param   { Object } el - object where the new property will be set
 * @param   { String } key - object key where the new property will be stored
 * @param   { * } value - value of the new property
 * @param   { Object } options - set the propery overriding the default options
 * @returns { Object } - the initial object
 */
function defineProperty(el, key, value, options) {
  Object.defineProperty(el, key, extend({
    value,
    enumerable: false,
    writable: false,
    configurable: true
  }, options));
  return el
}

/**
 * Function returning always a unique identifier
 * @returns { Number } - number from 0...n
 */
const uid = (function() {
  let i = -1;
  return () => ++i
})();

/**
 * Short alias for Object.getOwnPropertyDescriptor
 */
const getPropDescriptor = (o, k) => Object.getOwnPropertyDescriptor(o, k);

/**
 * Extend any object with other properties
 * @param   { Object } src - source object
 * @returns { Object } the resulting extended object
 *
 * var obj = { foo: 'baz' }
 * extend(obj, {bar: 'bar', foo: 'bar'})
 * console.log(obj) => {bar: 'bar', foo: 'bar'}
 *
 */
function extend(src) {
  let obj;
  let i = 1;
  const args = arguments;
  const l = args.length;

  for (; i < l; i++) {
    if (obj = args[i]) {
      for (const key in obj) {
        // check if this property of the source object could be overridden
        if (isWritable(src, key))
          src[key] = obj[key];
      }
    }
  }
  return src
}

var misc = Object.freeze({
	each: each,
	contains: contains,
	toCamel: toCamel,
	startsWith: startsWith,
	defineProperty: defineProperty,
	uid: uid,
	getPropDescriptor: getPropDescriptor,
	extend: extend
});

// node_modules/riot/lib/settings.js

var settings = extend(Object.create(brackets.settings), {
  skipAnonymousTags: true,
  // handle the auto updates on any DOM event
  autoUpdate: true
})

// node_modules/riot/lib/browser/tag/setEventHandler.js

/**
 * Trigger DOM events
 * @param   { HTMLElement } dom - dom element target of the event
 * @param   { Function } handler - user function
 * @param   { Object } e - event object
 */
function handleEvent(dom, handler, e) {
  let ptag = this.__.parent;
  let item = this.__.item;

  if (!item)
    while (ptag && !item) {
      item = ptag.__.item;
      ptag = ptag.__.parent;
    }

  // override the event properties
  /* istanbul ignore next */
  if (isWritable(e, 'currentTarget')) e.currentTarget = dom;
  /* istanbul ignore next */
  if (isWritable(e, 'target')) e.target = e.srcElement;
  /* istanbul ignore next */
  if (isWritable(e, 'which')) e.which = e.charCode || e.keyCode;

  e.item = item;

  handler.call(this, e);

  // avoid auto updates
  if (!settings.autoUpdate) return

  if (!e.preventUpdate) {
    const p = getImmediateCustomParentTag(this);
    // fixes #2083
    if (p.isMounted) p.update();
  }
}

/**
 * Attach an event to a DOM node
 * @param { String } name - event name
 * @param { Function } handler - event callback
 * @param { Object } dom - dom node
 * @param { Tag } tag - tag instance
 */
function setEventHandler(name, handler, dom, tag) {
  let eventName;
  const cb = handleEvent.bind(tag, dom, handler);

  // avoid to bind twice the same event
  // possible fix for #2332
  dom[name] = null;

  // normalize event name
  eventName = name.replace(RE_EVENTS_PREFIX, '');

  // cache the listener into the listeners array
  if (!contains(tag.__.listeners, dom)) tag.__.listeners.push(dom);
  if (!dom[RIOT_EVENTS_KEY]) dom[RIOT_EVENTS_KEY] = {};
  if (dom[RIOT_EVENTS_KEY][name]) dom.removeEventListener(eventName, dom[RIOT_EVENTS_KEY][name]);

  dom[RIOT_EVENTS_KEY][name] = cb;
  dom.addEventListener(eventName, cb, false);
}

// node_modules/riot/lib/browser/tag/update.js

/**
 * Update dynamically created data-is tags with changing expressions
 * @param { Object } expr - expression tag and expression info
 * @param { Tag }    parent - parent for tag creation
 * @param { String } tagName - tag implementation we want to use
 */
function updateDataIs(expr, parent, tagName) {
  let tag = expr.tag || expr.dom._tag;
  let ref;

  const { head } = tag ? tag.__ : {};
  const isVirtual = expr.dom.tagName === 'VIRTUAL';

  if (tag && expr.tagName === tagName) {
    tag.update();
    return
  }

  // sync _parent to accommodate changing tagnames
  if (tag) {
    // need placeholder before unmount
    if(isVirtual) {
      ref = createDOMPlaceholder();
      head.parentNode.insertBefore(ref, head);
    }

    tag.unmount(true);
  }

  // unable to get the tag name
  if (!isString(tagName)) return

  expr.impl = __TAG_IMPL[tagName];

  // unknown implementation
  if (!expr.impl) return

  expr.tag = tag = initChildTag(
    expr.impl, {
      root: expr.dom,
      parent,
      tagName
    },
    expr.dom.innerHTML,
    parent
  );

  each(expr.attrs, a => setAttr(tag.root, a.name, a.value));
  expr.tagName = tagName;
  tag.mount();

  // root exist first time, after use placeholder
  if (isVirtual) makeReplaceVirtual(tag, ref || tag.root);

  // parent is the placeholder tag, not the dynamic tag so clean up
  parent.__.onUnmount = () => {
    const delName = tag.opts.dataIs;
    arrayishRemove(tag.parent.tags, delName, tag);
    arrayishRemove(tag.__.parent.tags, delName, tag);
    tag.unmount();
  };
}

/**
 * Nomalize any attribute removing the "riot-" prefix
 * @param   { String } attrName - original attribute name
 * @returns { String } valid html attribute name
 */
function normalizeAttrName(attrName) {
  if (!attrName) return null
  attrName = attrName.replace(ATTRS_PREFIX, '');
  if (CASE_SENSITIVE_ATTRIBUTES[attrName]) attrName = CASE_SENSITIVE_ATTRIBUTES[attrName];
  return attrName
}

/**
 * Update on single tag expression
 * @this Tag
 * @param { Object } expr - expression logic
 * @returns { undefined }
 */
function updateExpression(expr) {
  if (this.root && getAttr(this.root,'virtualized')) return

  const dom = expr.dom;
  // remove the riot- prefix
  const attrName = normalizeAttrName(expr.attr);
  const isToggle = contains([SHOW_DIRECTIVE, HIDE_DIRECTIVE], attrName);
  const isVirtual = expr.root && expr.root.tagName === 'VIRTUAL';
  const { isAnonymous } = this.__;
  const parent = dom && (expr.parent || dom.parentNode);
  // detect the style attributes
  const isStyleAttr = attrName === 'style';
  const isClassAttr = attrName === 'class';

  let value;

  // if it's a tag we could totally skip the rest
  if (expr._riot_id) {
    if (expr.__.wasCreated) {
      expr.update();
    // if it hasn't been mounted yet, do that now.
    } else {
      expr.mount();
      if (isVirtual) {
        makeReplaceVirtual(expr, expr.root);
      }
    }
    return
  }

  // if this expression has the update method it means it can handle the DOM changes by itself
  if (expr.update) return expr.update()

  const context = isToggle && !isAnonymous ? inheritParentProps.call(this) : this;

  // ...it seems to be a simple expression so we try to calculate its value
  value = tmpl(expr.expr, context);

  const hasValue = !isBlank(value);
  const isObj = isObject(value);

  // convert the style/class objects to strings
  if (isObj) {
    if (isClassAttr) {
      value = tmpl(JSON.stringify(value), this);
    } else if (isStyleAttr) {
      value = styleObjectToString(value);
    }
  }

  // remove original attribute
  if (expr.attr && (!expr.wasParsedOnce || !hasValue || value === false)) {
    // remove either riot-* attributes or just the attribute name
    remAttr(dom, getAttr(dom, expr.attr) ? expr.attr : attrName);
  }

  // for the boolean attributes we don't need the value
  // we can convert it to checked=true to checked=checked
  if (expr.bool) value = value ? attrName : false;
  if (expr.isRtag) return updateDataIs(expr, this, value)
  if (expr.wasParsedOnce && expr.value === value) return

  // update the expression value
  expr.value = value;
  expr.wasParsedOnce = true;

  // if the value is an object (and it's not a style or class attribute) we can not do much more with it
  if (isObj && !isClassAttr && !isStyleAttr && !isToggle) return
  // avoid to render undefined/null values
  if (!hasValue) value = '';

  // textarea and text nodes have no attribute name
  if (!attrName) {
    // about #815 w/o replace: the browser converts the value to a string,
    // the comparison by "==" does too, but not in the server
    value += '';
    // test for parent avoids error with invalid assignment to nodeValue
    if (parent) {
      // cache the parent node because somehow it will become null on IE
      // on the next iteration
      expr.parent = parent;
      if (parent.tagName === 'TEXTAREA') {
        parent.value = value;                    // #1113
        if (!IE_VERSION) dom.nodeValue = value;  // #1625 IE throws here, nodeValue
      }                                         // will be available on 'updated'
      else dom.nodeValue = value;
    }
    return
  }


  // event handler
  if (isFunction$2(value)) {
    setEventHandler(attrName, value, dom, this);
  // show / hide
  } else if (isToggle) {
    toggleVisibility(dom, attrName === HIDE_DIRECTIVE ? !value : value);
  // handle attributes
  } else {
    if (expr.bool) {
      dom[attrName] = value;
    }

    if (attrName === 'value' && dom.value !== value) {
      dom.value = value;
    } else if (hasValue && value !== false) {
      setAttr(dom, attrName, value);
    }

    // make sure that in case of style changes
    // the element stays hidden
    if (isStyleAttr && dom.hidden) toggleVisibility(dom, false);
  }
}

/**
 * Update all the expressions in a Tag instance
 * @this Tag
 * @param { Array } expressions - expression that must be re evaluated
 */
function updateAllExpressions(expressions) {
  each(expressions, updateExpression.bind(this));
}

// node_modules/riot/lib/browser/tag/if.js

var IfExpr = {
  init(dom, tag, expr) {
    remAttr(dom, CONDITIONAL_DIRECTIVE);
    this.tag = tag;
    this.expr = expr;
    this.stub = createDOMPlaceholder();
    this.pristine = dom;

    const p = dom.parentNode;
    p.insertBefore(this.stub, dom);
    p.removeChild(dom);

    return this
  },
  update() {
    this.value = tmpl(this.expr, this.tag);

    if (this.value && !this.current) { // insert
      this.current = this.pristine.cloneNode(true);
      this.stub.parentNode.insertBefore(this.current, this.stub);
      this.expressions = parseExpressions.apply(this.tag, [this.current, true]);
    } else if (!this.value && this.current) { // remove
      unmountAll(this.expressions);
      if (this.current._tag) {
        this.current._tag.unmount();
      } else if (this.current.parentNode) {
        this.current.parentNode.removeChild(this.current);
      }
      this.current = null;
      this.expressions = [];
    }

    if (this.value) updateAllExpressions.call(this.tag, this.expressions);
  },
  unmount() {
    unmountAll(this.expressions || []);
  }
}

// node_modules/riot/lib/browser/tag/ref.js

var RefExpr = {
  init(dom, parent, attrName, attrValue) {
    this.dom = dom;
    this.attr = attrName;
    this.rawValue = attrValue;
    this.parent = parent;
    this.hasExp = tmpl.hasExpr(attrValue);
    return this
  },
  update() {
    const old = this.value;
    const customParent = this.parent && getImmediateCustomParentTag(this.parent);
    // if the referenced element is a custom tag, then we set the tag itself, rather than DOM
    const tagOrDom = this.dom.__ref || this.tag || this.dom;

    this.value = this.hasExp ? tmpl(this.rawValue, this.parent) : this.rawValue;

    // the name changed, so we need to remove it from the old key (if present)
    if (!isBlank(old) && customParent) arrayishRemove(customParent.refs, old, tagOrDom);
    if (!isBlank(this.value) && isString(this.value)) {
      // add it to the refs of parent tag (this behavior was changed >=3.0)
      if (customParent) arrayishAdd(
        customParent.refs,
        this.value,
        tagOrDom,
        // use an array if it's a looped node and the ref is not an expression
        null,
        this.parent.__.index
      );

      if (this.value !== old) {
        setAttr(this.dom, this.attr, this.value);
      }
    } else {
      remAttr(this.dom, this.attr);
    }

    // cache the ref bound to this dom node
    // to reuse it in future (see also #2329)
    if (!this.dom.__ref) this.dom.__ref = tagOrDom;
  },
  unmount() {
    const tagOrDom = this.tag || this.dom;
    const customParent = this.parent && getImmediateCustomParentTag(this.parent);
    if (!isBlank(this.value) && customParent)
      arrayishRemove(customParent.refs, this.value, tagOrDom);
  }
}

// node_modules/riot/lib/browser/tag/each.js

/**
 * Convert the item looped into an object used to extend the child tag properties
 * @param   { Object } expr - object containing the keys used to extend the children tags
 * @param   { * } key - value to assign to the new object returned
 * @param   { * } val - value containing the position of the item in the array
 * @param   { Object } base - prototype object for the new item
 * @returns { Object } - new object containing the values of the original item
 *
 * The variables 'key' and 'val' are arbitrary.
 * They depend on the collection type looped (Array, Object)
 * and on the expression used on the each tag
 *
 */
function mkitem(expr, key, val, base) {
  const item = base ? Object.create(base) : {};
  item[expr.key] = key;
  if (expr.pos) item[expr.pos] = val;
  return item
}

/**
 * Unmount the redundant tags
 * @param   { Array } items - array containing the current items to loop
 * @param   { Array } tags - array containing all the children tags
 */
function unmountRedundant(items, tags) {
  let i = tags.length;
  const j = items.length;

  while (i > j) {
    i--;
    remove.apply(tags[i], [tags, i]);
  }
}


/**
 * Remove a child tag
 * @this Tag
 * @param   { Array } tags - tags collection
 * @param   { Number } i - index of the tag to remove
 */
function remove(tags, i) {
  tags.splice(i, 1);
  this.unmount();
  arrayishRemove(this.parent, this, this.__.tagName, true);
}

/**
 * Move the nested custom tags in non custom loop tags
 * @this Tag
 * @param   { Number } i - current position of the loop tag
 */
function moveNestedTags(i) {
  each(Object.keys(this.tags), (tagName) => {
    moveChildTag.apply(this.tags[tagName], [tagName, i]);
  });
}

/**
 * Move a child tag
 * @this Tag
 * @param   { HTMLElement } root - dom node containing all the loop children
 * @param   { Tag } nextTag - instance of the next tag preceding the one we want to move
 * @param   { Boolean } isVirtual - is it a virtual tag?
 */
function move(root, nextTag, isVirtual) {
  if (isVirtual)
    moveVirtual.apply(this, [root, nextTag]);
  else
    safeInsert(root, this.root, nextTag.root);
}

/**
 * Insert and mount a child tag
 * @this Tag
 * @param   { HTMLElement } root - dom node containing all the loop children
 * @param   { Tag } nextTag - instance of the next tag preceding the one we want to insert
 * @param   { Boolean } isVirtual - is it a virtual tag?
 */
function insert(root, nextTag, isVirtual) {
  if (isVirtual)
    makeVirtual.apply(this, [root, nextTag]);
  else
    safeInsert(root, this.root, nextTag.root);
}

/**
 * Append a new tag into the DOM
 * @this Tag
 * @param   { HTMLElement } root - dom node containing all the loop children
 * @param   { Boolean } isVirtual - is it a virtual tag?
 */
function append(root, isVirtual) {
  if (isVirtual)
    makeVirtual.call(this, root);
  else
    root.appendChild(this.root);
}

/**
 * Return the value we want to use to lookup the postion of our items in the collection
 * @param   { String }  keyAttr         - lookup string or expression
 * @param   { * }       originalItem    - original item from the collection
 * @param   { Object }  keyedItem       - object created by riot via { item, i in collection }
 * @param   { Boolean } hasKeyAttrExpr  - flag to check whether the key is an expression
 * @returns { * } value that we will use to figure out the item position via collection.indexOf
 */
function getItemId(keyAttr, originalItem, keyedItem, hasKeyAttrExpr) {
  if (keyAttr) {
    return hasKeyAttrExpr ?  tmpl(keyAttr, keyedItem) :  originalItem[keyAttr]
  }

  return originalItem
}

/**
 * Manage tags having the 'each'
 * @param   { HTMLElement } dom - DOM node we need to loop
 * @param   { Tag } parent - parent tag instance where the dom node is contained
 * @param   { String } expr - string contained in the 'each' attribute
 * @returns { Object } expression object for this each loop
 */
function _each(dom, parent, expr) {
  const mustReorder = typeof getAttr(dom, LOOP_NO_REORDER_DIRECTIVE) !== T_STRING || remAttr(dom, LOOP_NO_REORDER_DIRECTIVE);
  const keyAttr = getAttr(dom, KEY_DIRECTIVE);
  const hasKeyAttrExpr = keyAttr ? tmpl.hasExpr(keyAttr) : false;
  const tagName = getTagName(dom);
  const impl = __TAG_IMPL[tagName];
  const parentNode = dom.parentNode;
  const placeholder = createDOMPlaceholder();
  const child = getTag(dom);
  const ifExpr = getAttr(dom, CONDITIONAL_DIRECTIVE);
  const tags = [];
  const isLoop = true;
  const innerHTML = dom.innerHTML;
  const isAnonymous = !__TAG_IMPL[tagName];
  const isVirtual = dom.tagName === 'VIRTUAL';
  let oldItems = [];
  let hasKeys;

  // remove the each property from the original tag
  remAttr(dom, LOOP_DIRECTIVE);
  remAttr(dom, KEY_DIRECTIVE);

  // parse the each expression
  expr = tmpl.loopKeys(expr);
  expr.isLoop = true;

  if (ifExpr) remAttr(dom, CONDITIONAL_DIRECTIVE);

  // insert a marked where the loop tags will be injected
  parentNode.insertBefore(placeholder, dom);
  parentNode.removeChild(dom);

  expr.update = function updateEach() {
    // get the new items collection
    expr.value = tmpl(expr.val, parent);

    let items = expr.value;
    const frag = createFrag();
    const isObject$$1 = !isArray(items) && !isString(items);
    const root = placeholder.parentNode;
    const tmpItems = [];

    // if this DOM was removed the update here is useless
    // this condition fixes also a weird async issue on IE in our unit test
    if (!root) return

    // object loop. any changes cause full redraw
    if (isObject$$1) {
      hasKeys = items || false;
      items = hasKeys ?
        Object.keys(items).map(key => mkitem(expr, items[key], key)) : [];
    } else {
      hasKeys = false;
    }

    if (ifExpr) {
      items = items.filter((item, i) => {
        if (expr.key && !isObject$$1)
          return !!tmpl(ifExpr, mkitem(expr, item, i, parent))

        return !!tmpl(ifExpr, extend(Object.create(parent), item))
      });
    }

    // loop all the new items
    each(items, (_item, i) => {
      const item = !hasKeys && expr.key ? mkitem(expr, _item, i) : _item;
      const itemId = getItemId(keyAttr, _item, item, hasKeyAttrExpr);
      // reorder only if the items are objects
      const doReorder = mustReorder && typeof _item === T_OBJECT && !hasKeys;
      const oldPos = oldItems.indexOf(itemId);
      const isNew = oldPos === -1;
      const pos = !isNew && doReorder ? oldPos : i;
      // does a tag exist in this position?
      let tag = tags[pos];
      const mustAppend = i >= oldItems.length;
      const mustCreate =  doReorder && isNew || !doReorder && !tag;

      // new tag
      if (mustCreate) {
        tag = createTag(impl, {
          parent,
          isLoop,
          isAnonymous,
          tagName,
          root: dom.cloneNode(isAnonymous),
          item,
          index: i,
        }, innerHTML);

        // mount the tag
        tag.mount();

        if (mustAppend)
          append.apply(tag, [frag || root, isVirtual]);
        else
          insert.apply(tag, [root, tags[i], isVirtual]);

        if (!mustAppend) oldItems.splice(i, 0, item);
        tags.splice(i, 0, tag);
        if (child) arrayishAdd(parent.tags, tagName, tag, true);
      } else if (pos !== i && doReorder) {
        // move
        if (keyAttr || contains(items, oldItems[pos])) {
          move.apply(tag, [root, tags[i], isVirtual]);
          // move the old tag instance
          tags.splice(i, 0, tags.splice(pos, 1)[0]);
          // move the old item
          oldItems.splice(i, 0, oldItems.splice(pos, 1)[0]);
        }

        // update the position attribute if it exists
        if (expr.pos) tag[expr.pos] = i;

        // if the loop tags are not custom
        // we need to move all their custom tags into the right position
        if (!child && tag.tags) moveNestedTags.call(tag, i);
      }

      // cache the original item to use it in the events bound to this node
      // and its children
      tag.__.item = item;
      tag.__.index = i;
      tag.__.parent = parent;

      tmpItems[i] = itemId;

      if (!mustCreate) tag.update(item);
    });

    // remove the redundant tags
    unmountRedundant(items, tags);

    // clone the items array
    oldItems = tmpItems.slice();

    root.insertBefore(frag, placeholder);
  };

  expr.unmount = () => {
    each(tags, t => { t.unmount(); });
  };

  return expr
}

// node_modules/riot/lib/browser/tag/parse.js

/**
 * Walk the tag DOM to detect the expressions to evaluate
 * @this Tag
 * @param   { HTMLElement } root - root tag where we will start digging the expressions
 * @param   { Boolean } mustIncludeRoot - flag to decide whether the root must be parsed as well
 * @returns { Array } all the expressions found
 */
function parseExpressions(root, mustIncludeRoot) {
  const expressions = [];

  walkNodes(root, (dom) => {
    const type = dom.nodeType;
    let attr;
    let tagImpl;

    if (!mustIncludeRoot && dom === root) return

    // text node
    if (type === 3 && dom.parentNode.tagName !== 'STYLE' && tmpl.hasExpr(dom.nodeValue))
      expressions.push({dom, expr: dom.nodeValue});

    if (type !== 1) return

    const isVirtual = dom.tagName === 'VIRTUAL';

    // loop. each does it's own thing (for now)
    if (attr = getAttr(dom, LOOP_DIRECTIVE)) {
      if(isVirtual) setAttr(dom, 'loopVirtual', true); // ignore here, handled in _each
      expressions.push(_each(dom, this, attr));
      return false
    }

    // if-attrs become the new parent. Any following expressions (either on the current
    // element, or below it) become children of this expression.
    if (attr = getAttr(dom, CONDITIONAL_DIRECTIVE)) {
      expressions.push(Object.create(IfExpr).init(dom, this, attr));
      return false
    }

    if (attr = getAttr(dom, IS_DIRECTIVE)) {
      if (tmpl.hasExpr(attr)) {
        expressions.push({
          isRtag: true,
          expr: attr,
          dom,
          attrs: [].slice.call(dom.attributes)
        });

        return false
      }
    }

    // if this is a tag, stop traversing here.
    // we ignore the root, since parseExpressions is called while we're mounting that root
    tagImpl = getTag(dom);

    if(isVirtual) {
      if(getAttr(dom, 'virtualized')) {dom.parentElement.removeChild(dom); } // tag created, remove from dom
      if(!tagImpl && !getAttr(dom, 'virtualized') && !getAttr(dom, 'loopVirtual'))  // ok to create virtual tag
        tagImpl = { tmpl: dom.outerHTML };
    }

    if (tagImpl && (dom !== root || mustIncludeRoot)) {
      if(isVirtual && !getAttr(dom, IS_DIRECTIVE)) { // handled in update
        // can not remove attribute like directives
        // so flag for removal after creation to prevent maximum stack error
        setAttr(dom, 'virtualized', true);
        const tag = createTag(
          {tmpl: dom.outerHTML},
          {root: dom, parent: this},
          dom.innerHTML
        );

        expressions.push(tag); // no return, anonymous tag, keep parsing
      } else {
        expressions.push(
          initChildTag(
            tagImpl,
            {
              root: dom,
              parent: this
            },
            dom.innerHTML,
            this
          )
        );
        return false
      }
    }

    // attribute expressions
    parseAttributes.apply(this, [dom, dom.attributes, (attr, expr) => {
      if (!expr) return
      expressions.push(expr);
    }]);
  });

  return expressions
}

/**
 * Calls `fn` for every attribute on an element. If that attr has an expression,
 * it is also passed to fn.
 * @this Tag
 * @param   { HTMLElement } dom - dom node to parse
 * @param   { Array } attrs - array of attributes
 * @param   { Function } fn - callback to exec on any iteration
 */
function parseAttributes(dom, attrs, fn) {
  each(attrs, (attr) => {
    if (!attr) return false

    const name = attr.name;
    const bool = isBoolAttr(name);
    let expr;

    if (contains(REF_DIRECTIVES, name) && dom.tagName.toLowerCase() !== YIELD_TAG) {
      expr =  Object.create(RefExpr).init(dom, this, name, attr.value);
    } else if (tmpl.hasExpr(attr.value)) {
      expr = {dom, expr: attr.value, attr: name, bool};
    }

    fn(attr, expr);
  });
}

// node_modules/riot/lib/browser/tag/mkdom.js

/*
  Includes hacks needed for the Internet Explorer version 9 and below
  See: http://kangax.github.io/compat-table/es5/#ie8
       http://codeplanet.io/dropping-ie8/
*/

const
  reHasYield  = /<yield\b/i,
  reYieldAll  = /<yield\s*(?:\/>|>([\S\s]*?)<\/yield\s*>|>)/ig,
  reYieldSrc  = /<yield\s+to=['"]([^'">]*)['"]\s*>([\S\s]*?)<\/yield\s*>/ig,
  reYieldDest = /<yield\s+from=['"]?([-\w]+)['"]?\s*(?:\/>|>([\S\s]*?)<\/yield\s*>)/ig,
  rootEls = { tr: 'tbody', th: 'tr', td: 'tr', col: 'colgroup' },
  tblTags = IE_VERSION && IE_VERSION < 10 ? RE_SPECIAL_TAGS : RE_SPECIAL_TAGS_NO_OPTION,
  GENERIC = 'div',
  SVG = 'svg';


/*
  Creates the root element for table or select child elements:
  tr/th/td/thead/tfoot/tbody/caption/col/colgroup/option/optgroup
*/
function specialTags(el, tmpl, tagName) {

  let
    select = tagName[0] === 'o',
    parent = select ? 'select>' : 'table>';

  // trim() is important here, this ensures we don't have artifacts,
  // so we can check if we have only one element inside the parent
  el.innerHTML = '<' + parent + tmpl.trim() + '</' + parent;
  parent = el.firstChild;

  // returns the immediate parent if tr/th/td/col is the only element, if not
  // returns the whole tree, as this can include additional elements
  /* istanbul ignore next */
  if (select) {
    parent.selectedIndex = -1;  // for IE9, compatible w/current riot behavior
  } else {
    // avoids insertion of cointainer inside container (ex: tbody inside tbody)
    const tname = rootEls[tagName];
    if (tname && parent.childElementCount === 1) parent = $(tname, parent);
  }
  return parent
}

/*
  Replace the yield tag from any tag template with the innerHTML of the
  original tag in the page
*/
function replaceYield(tmpl, html) {
  // do nothing if no yield
  if (!reHasYield.test(tmpl)) return tmpl

  // be careful with #1343 - string on the source having `$1`
  const src = {};

  html = html && html.replace(reYieldSrc, function (_, ref, text) {
    src[ref] = src[ref] || text;   // preserve first definition
    return ''
  }).trim();

  return tmpl
    .replace(reYieldDest, function (_, ref, def) {  // yield with from - to attrs
      return src[ref] || def || ''
    })
    .replace(reYieldAll, function (_, def) {        // yield without any "from"
      return html || def || ''
    })
}

/**
 * Creates a DOM element to wrap the given content. Normally an `DIV`, but can be
 * also a `TABLE`, `SELECT`, `TBODY`, `TR`, or `COLGROUP` element.
 *
 * @param   { String } tmpl  - The template coming from the custom tag definition
 * @param   { String } html - HTML content that comes from the DOM element where you
 *           will mount the tag, mostly the original tag in the page
 * @param   { Boolean } isSvg - true if the root node is an svg
 * @returns { HTMLElement } DOM element with _tmpl_ merged through `YIELD` with the _html_.
 */
function mkdom(tmpl, html, isSvg$$1) {
  const match   = tmpl && tmpl.match(/^\s*<([-\w]+)/);
  const  tagName = match && match[1].toLowerCase();
  let el = mkEl(isSvg$$1 ? SVG : GENERIC);

  // replace all the yield tags with the tag inner html
  tmpl = replaceYield(tmpl, html);

  /* istanbul ignore next */
  if (tblTags.test(tagName))
    el = specialTags(el, tmpl, tagName);
  else
    setInnerHTML(el, tmpl, isSvg$$1);

  return el
}

// node_modules/riot/lib/browser/tag/core.js

/**
 * Another way to create a riot tag a bit more es6 friendly
 * @param { HTMLElement } el - tag DOM selector or DOM node/s
 * @param { Object } opts - tag logic
 * @returns { Tag } new riot tag instance
 */
function Tag(el, opts) {
  // get the tag properties from the class constructor
  const {name, tmpl, css, attrs, onCreate} = this;
  // register a new tag and cache the class prototype
  if (!__TAG_IMPL[name]) {
    tag(name, tmpl, css, attrs, onCreate);
    // cache the class constructor
    __TAG_IMPL[name].class = this.constructor;
  }

  // mount the tag using the class instance
  mountTo(el, name, opts, this);
  // inject the component css
  if (css) styleManager.inject();

  return this
}

/**
 * Create a new riot tag implementation
 * @param   { String }   name - name/id of the new riot tag
 * @param   { String }   tmpl - tag template
 * @param   { String }   css - custom tag css
 * @param   { String }   attrs - root tag attributes
 * @param   { Function } fn - user function
 * @returns { String } name/id of the tag just created
 */
function tag(name, tmpl, css, attrs, fn) {
  if (isFunction$2(attrs)) {
    fn = attrs;

    if (/^[\w-]+\s?=/.test(css)) {
      attrs = css;
      css = '';
    } else
      attrs = '';
  }

  if (css) {
    if (isFunction$2(css))
      fn = css;
    else
      styleManager.add(css);
  }

  name = name.toLowerCase();
  __TAG_IMPL[name] = { name, tmpl, attrs, fn };

  return name
}

/**
 * Create a new riot tag implementation (for use by the compiler)
 * @param   { String }   name - name/id of the new riot tag
 * @param   { String }   tmpl - tag template
 * @param   { String }   css - custom tag css
 * @param   { String }   attrs - root tag attributes
 * @param   { Function } fn - user function
 * @returns { String } name/id of the tag just created
 */
function tag2(name, tmpl, css, attrs, fn) {
  if (css) styleManager.add(css, name);

  __TAG_IMPL[name] = { name, tmpl, attrs, fn };

  return name
}

/**
 * Mount a tag using a specific tag implementation
 * @param   { * } selector - tag DOM selector or DOM node/s
 * @param   { String } tagName - tag implementation name
 * @param   { Object } opts - tag logic
 * @returns { Array } new tags instances
 */
function mount(selector, tagName, opts) {
  const tags = [];
  let elem, allTags;

  function pushTagsTo(root) {
    if (root.tagName) {
      let riotTag = getAttr(root, IS_DIRECTIVE), tag;

      // have tagName? force riot-tag to be the same
      if (tagName && riotTag !== tagName) {
        riotTag = tagName;
        setAttr(root, IS_DIRECTIVE, tagName);
      }

      tag = mountTo(root, riotTag || root.tagName.toLowerCase(), opts);

      if (tag)
        tags.push(tag);
    } else if (root.length)
      each(root, pushTagsTo); // assume nodeList
  }

  // inject styles into DOM
  styleManager.inject();

  if (isObject(tagName)) {
    opts = tagName;
    tagName = 0;
  }

  // crawl the DOM to find the tag
  if (isString(selector)) {
    selector = selector === '*' ?
      // select all registered tags
      // & tags found with the riot-tag attribute set
      allTags = selectTags() :
      // or just the ones named like the selector
      selector + selectTags(selector.split(/, */));

    // make sure to pass always a selector
    // to the querySelectorAll function
    elem = selector ? $$(selector) : [];
  }
  else
    // probably you have passed already a tag or a NodeList
    elem = selector;

  // select all the registered and mount them inside their root elements
  if (tagName === '*') {
    // get all custom tags
    tagName = allTags || selectTags();
    // if the root els it's just a single tag
    if (elem.tagName)
      elem = $$(tagName, elem);
    else {
      // select all the children for all the different root elements
      var nodeList = [];

      each(elem, _el => nodeList.push($$(tagName, _el)));

      elem = nodeList;
    }
    // get rid of the tagName
    tagName = 0;
  }

  pushTagsTo(elem);

  return tags
}

// Create a mixin that could be globally shared across all the tags
const mixins = {};
const globals = mixins[GLOBAL_MIXIN] = {};
let mixins_id = 0;

/**
 * Create/Return a mixin by its name
 * @param   { String }  name - mixin name (global mixin if object)
 * @param   { Object }  mix - mixin logic
 * @param   { Boolean } g - is global?
 * @returns { Object }  the mixin logic
 */
function mixin(name, mix, g) {
  // Unnamed global
  if (isObject(name)) {
    mixin(`__${mixins_id++}__`, name, true);
    return
  }

  const store = g ? globals : mixins;

  // Getter
  if (!mix) {
    if (isUndefined(store[name]))
      throw new Error(`Unregistered mixin: ${ name }`)

    return store[name]
  }

  // Setter
  store[name] = isFunction$2(mix) ?
    extend(mix.prototype, store[name] || {}) && mix :
    extend(store[name] || {}, mix);
}

/**
 * Update all the tags instances created
 * @returns { Array } all the tags instances
 */
function update() {
  return each(__TAGS_CACHE, tag => tag.update())
}

function unregister(name) {
  __TAG_IMPL[name] = null;
}

const version = 'WIP';


var core = Object.freeze({
	Tag: Tag,
	tag: tag,
	tag2: tag2,
	mount: mount,
	mixin: mixin,
	update: update,
	unregister: unregister,
	version: version
});

// node_modules/riot/lib/browser/tag/tag.js

/**
 * We need to update opts for this tag. That requires updating the expressions
 * in any attributes on the tag, and then copying the result onto opts.
 * @this Tag
 * @param   {Boolean} isLoop - is it a loop tag?
 * @param   { Tag }  parent - parent tag node
 * @param   { Boolean }  isAnonymous - is it a tag without any impl? (a tag not registered)
 * @param   { Object }  opts - tag options
 * @param   { Array }  instAttrs - tag attributes array
 */
function updateOpts(isLoop, parent, isAnonymous, opts, instAttrs) {
  // isAnonymous `each` tags treat `dom` and `root` differently. In this case
  // (and only this case) we don't need to do updateOpts, because the regular parse
  // will update those attrs. Plus, isAnonymous tags don't need opts anyway
  if (isLoop && isAnonymous) return
  const ctx = isLoop ? inheritParentProps.call(this) : parent || this;

  each(instAttrs, (attr) => {
    if (attr.expr) updateExpression.call(ctx, attr.expr);
    // normalize the attribute names
    opts[toCamel(attr.name).replace(ATTRS_PREFIX, '')] = attr.expr ? attr.expr.value : attr.value;
  });
}

/**
 * Manage the mount state of a tag triggering also the observable events
 * @this Tag
 * @param { Boolean } value - ..of the isMounted flag
 */
function setMountState(value) {
  const { isAnonymous } = this.__;

  defineProperty(this, 'isMounted', value);

  if (!isAnonymous) {
    if (value) this.trigger('mount');
    else {
      this.trigger('unmount');
      this.off('*');
      this.__.wasCreated = false;
    }
  }
}


/**
 * Tag creation factory function
 * @constructor
 * @param { Object } impl - it contains the tag template, and logic
 * @param { Object } conf - tag options
 * @param { String } innerHTML - html that eventually we need to inject in the tag
 */
function createTag(impl = {}, conf = {}, innerHTML) {
  const tag$$1 = conf.context || {};
  const opts = extend({}, conf.opts);
  const parent = conf.parent;
  const isLoop = conf.isLoop;
  const isAnonymous = !!conf.isAnonymous;
  const skipAnonymous = settings.skipAnonymousTags && isAnonymous;
  const item = conf.item;
  // available only for the looped nodes
  const index = conf.index;
  // All attributes on the Tag when it's first parsed
  const instAttrs = [];
  // expressions on this type of Tag
  const implAttrs = [];
  const expressions = [];
  const root = conf.root;
  const tagName = conf.tagName || getTagName(root);
  const isVirtual = tagName === 'virtual';
  const isInline = !isVirtual && !impl.tmpl;
  let dom;

  // make this tag observable
  if (!skipAnonymous) observable(tag$$1);
  // only call unmount if we have a valid __TAG_IMPL (has name property)
  if (impl.name && root._tag) root._tag.unmount(true);

  // not yet mounted
  defineProperty(tag$$1, 'isMounted', false);

  defineProperty(tag$$1, '__', {
    isAnonymous,
    instAttrs,
    innerHTML,
    tagName,
    index,
    isLoop,
    isInline,
    // tags having event listeners
    // it would be better to use weak maps here but we can not introduce breaking changes now
    listeners: [],
    // these vars will be needed only for the virtual tags
    virts: [],
    wasCreated: false,
    tail: null,
    head: null,
    parent: null,
    item: null
  });

  // create a unique id to this tag
  // it could be handy to use it also to improve the virtual dom rendering speed
  defineProperty(tag$$1, '_riot_id', uid()); // base 1 allows test !t._riot_id
  defineProperty(tag$$1, 'root', root);
  extend(tag$$1, { opts }, item);
  // protect the "tags" and "refs" property from being overridden
  defineProperty(tag$$1, 'parent', parent || null);
  defineProperty(tag$$1, 'tags', {});
  defineProperty(tag$$1, 'refs', {});

  if (isInline || isLoop && isAnonymous) {
    dom = root;
  } else {
    if (!isVirtual) root.innerHTML = '';
    dom = mkdom(impl.tmpl, innerHTML, isSvg(root));
  }

  /**
   * Update the tag expressions and options
   * @param   { * }  data - data we want to use to extend the tag properties
   * @returns { Tag } the current tag instance
   */
  defineProperty(tag$$1, 'update', function tagUpdate(data) {
    const nextOpts = {};
    const canTrigger = tag$$1.isMounted && !skipAnonymous;

    // inherit properties from the parent tag
    if (isAnonymous && parent) extend(tag$$1, parent);
    extend(tag$$1, data);

    updateOpts.apply(tag$$1, [isLoop, parent, isAnonymous, nextOpts, instAttrs]);

    if (
      canTrigger &&
      tag$$1.isMounted &&
      isFunction$2(tag$$1.shouldUpdate) && !tag$$1.shouldUpdate(data, nextOpts)
    ) {
      return tag$$1
    }

    extend(opts, nextOpts);

    if (canTrigger) tag$$1.trigger('update', data);
    updateAllExpressions.call(tag$$1, expressions);
    if (canTrigger) tag$$1.trigger('updated');

    return tag$$1
  });

  /**
   * Add a mixin to this tag
   * @returns { Tag } the current tag instance
   */
  defineProperty(tag$$1, 'mixin', function tagMixin() {
    each(arguments, (mix) => {
      let instance;
      let obj;
      let props = [];

      // properties blacklisted and will not be bound to the tag instance
      const propsBlacklist = ['init', '__proto__'];

      mix = isString(mix) ? mixin(mix) : mix;

      // check if the mixin is a function
      if (isFunction$2(mix)) {
        // create the new mixin instance
        instance = new mix();
      } else instance = mix;

      const proto = Object.getPrototypeOf(instance);

      // build multilevel prototype inheritance chain property list
      do props = props.concat(Object.getOwnPropertyNames(obj || instance));
      while (obj = Object.getPrototypeOf(obj || instance))

      // loop the keys in the function prototype or the all object keys
      each(props, (key) => {
        // bind methods to tag
        // allow mixins to override other properties/parent mixins
        if (!contains(propsBlacklist, key)) {
          // check for getters/setters
          const descriptor = getPropDescriptor(instance, key) || getPropDescriptor(proto, key);
          const hasGetterSetter = descriptor && (descriptor.get || descriptor.set);

          // apply method only if it does not already exist on the instance
          if (!tag$$1.hasOwnProperty(key) && hasGetterSetter) {
            Object.defineProperty(tag$$1, key, descriptor);
          } else {
            tag$$1[key] = isFunction$2(instance[key]) ?
              instance[key].bind(tag$$1) :
              instance[key];
          }
        }
      });

      // init method will be called automatically
      if (instance.init)
        instance.init.bind(tag$$1)(opts);
    });

    return tag$$1
  });

  /**
   * Mount the current tag instance
   * @returns { Tag } the current tag instance
   */
  defineProperty(tag$$1, 'mount', function tagMount() {
    root._tag = tag$$1; // keep a reference to the tag just created

    // Read all the attrs on this instance. This give us the info we need for updateOpts
    parseAttributes.apply(parent, [root, root.attributes, (attr, expr) => {
      if (!isAnonymous && RefExpr.isPrototypeOf(expr)) expr.tag = tag$$1;
      attr.expr = expr;
      instAttrs.push(attr);
    }]);

    // update the root adding custom attributes coming from the compiler
    walkAttrs(impl.attrs, (k, v) => { implAttrs.push({name: k, value: v}); });
    parseAttributes.apply(tag$$1, [root, implAttrs, (attr, expr) => {
      if (expr) expressions.push(expr);
      else setAttr(root, attr.name, attr.value);
    }]);

    // initialiation
    updateOpts.apply(tag$$1, [isLoop, parent, isAnonymous, opts, instAttrs]);

    // add global mixins
    const globalMixin = mixin(GLOBAL_MIXIN);

    if (globalMixin && !skipAnonymous) {
      for (const i in globalMixin) {
        if (globalMixin.hasOwnProperty(i)) {
          tag$$1.mixin(globalMixin[i]);
        }
      }
    }

    if (impl.fn) impl.fn.call(tag$$1, opts);

    if (!skipAnonymous) tag$$1.trigger('before-mount');

    // parse layout after init. fn may calculate args for nested custom tags
    each(parseExpressions.apply(tag$$1, [dom, isAnonymous]), e => expressions.push(e));

    tag$$1.update(item);

    if (!isAnonymous && !isInline) {
      while (dom.firstChild) root.appendChild(dom.firstChild);
    }

    defineProperty(tag$$1, 'root', root);

    // if we need to wait that the parent "mount" or "updated" event gets triggered
    if (!skipAnonymous && tag$$1.parent) {
      const p = getImmediateCustomParentTag(tag$$1.parent);
      p.one(!p.isMounted ? 'mount' : 'updated', () => {
        setMountState.call(tag$$1, true);
      });
    } else {
      // otherwise it's not a child tag we can trigger its mount event
      setMountState.call(tag$$1, true);
    }

    tag$$1.__.wasCreated = true;

    return tag$$1

  });

  /**
   * Unmount the tag instance
   * @param { Boolean } mustKeepRoot - if it's true the root node will not be removed
   * @returns { Tag } the current tag instance
   */
  defineProperty(tag$$1, 'unmount', function tagUnmount(mustKeepRoot) {
    const el = tag$$1.root;
    const p = el.parentNode;
    const tagIndex = __TAGS_CACHE.indexOf(tag$$1);

    if (!skipAnonymous) tag$$1.trigger('before-unmount');

    // clear all attributes coming from the mounted tag
    walkAttrs(impl.attrs, (name) => {
      if (startsWith(name, ATTRS_PREFIX))
        name = name.slice(ATTRS_PREFIX.length);

      remAttr(root, name);
    });

    // remove all the event listeners
    tag$$1.__.listeners.forEach((dom) => {
      Object.keys(dom[RIOT_EVENTS_KEY]).forEach((eventName) => {
        dom.removeEventListener(eventName, dom[RIOT_EVENTS_KEY][eventName]);
      });
    });

    // remove tag instance from the global tags cache collection
    if (tagIndex !== -1) __TAGS_CACHE.splice(tagIndex, 1);

    // clean up the parent tags object
    if (parent && !isAnonymous) {
      const ptag = getImmediateCustomParentTag(parent);

      if (isVirtual) {
        Object
          .keys(tag$$1.tags)
          .forEach(tagName => arrayishRemove(ptag.tags, tagName, tag$$1.tags[tagName]));
      } else {
        arrayishRemove(ptag.tags, tagName, tag$$1);
      }
    }

    // unmount all the virtual directives
    if (tag$$1.__.virts) {
      each(tag$$1.__.virts, (v) => {
        if (v.parentNode) v.parentNode.removeChild(v);
      });
    }

    // allow expressions to unmount themselves
    unmountAll(expressions);
    each(instAttrs, a => a.expr && a.expr.unmount && a.expr.unmount());

    // clear the tag html if it's necessary
    if (mustKeepRoot) setInnerHTML(el, '');
    // otherwise detach the root tag from the DOM
    else if (p) p.removeChild(el);

    // custom internal unmount function to avoid relying on the observable
    if (tag$$1.__.onUnmount) tag$$1.__.onUnmount();

    // weird fix for a weird edge case #2409 and #2436
    // some users might use your software not as you've expected
    // so I need to add these dirty hacks to mitigate unexpected issues
    if (!tag$$1.isMounted) setMountState.call(tag$$1, true);

    setMountState.call(tag$$1, false);

    delete tag$$1.root._tag;

    return tag$$1
  });

  return tag$$1
}

// node_modules/riot/lib/browser/common/util/tags.js

/**
 * Detect the tag implementation by a DOM node
 * @param   { Object } dom - DOM node we need to parse to get its tag implementation
 * @returns { Object } it returns an object containing the implementation of a custom tag (template and boot function)
 */
function getTag(dom) {
  return dom.tagName && __TAG_IMPL[getAttr(dom, IS_DIRECTIVE) ||
    getAttr(dom, IS_DIRECTIVE) || dom.tagName.toLowerCase()]
}

/**
 * Move the position of a custom tag in its parent tag
 * @this Tag
 * @param   { String } tagName - key where the tag was stored
 * @param   { Number } newPos - index where the new tag will be stored
 */
function moveChildTag(tagName, newPos) {
  const parent = this.parent;
  let tags;
  // no parent no move
  if (!parent) return

  tags = parent.tags[tagName];

  if (isArray(tags))
    tags.splice(newPos, 0, tags.splice(tags.indexOf(this), 1)[0]);
  else arrayishAdd(parent.tags, tagName, this);
}

/**
 * Create a new child tag including it correctly into its parent
 * @param   { Object } child - child tag implementation
 * @param   { Object } opts - tag options containing the DOM node where the tag will be mounted
 * @param   { String } innerHTML - inner html of the child node
 * @param   { Object } parent - instance of the parent tag including the child custom tag
 * @returns { Object } instance of the new child tag just created
 */
function initChildTag(child, opts, innerHTML, parent) {
  const tag = createTag(child, opts, innerHTML);
  const tagName = opts.tagName || getTagName(opts.root, true);
  const ptag = getImmediateCustomParentTag(parent);
  // fix for the parent attribute in the looped elements
  defineProperty(tag, 'parent', ptag);
  // store the real parent tag
  // in some cases this could be different from the custom parent tag
  // for example in nested loops
  tag.__.parent = parent;

  // add this tag to the custom parent tag
  arrayishAdd(ptag.tags, tagName, tag);

  // and also to the real parent tag
  if (ptag !== parent)
    arrayishAdd(parent.tags, tagName, tag);

  return tag
}

/**
 * Loop backward all the parents tree to detect the first custom parent tag
 * @param   { Object } tag - a Tag instance
 * @returns { Object } the instance of the first custom parent tag found
 */
function getImmediateCustomParentTag(tag) {
  let ptag = tag;
  while (ptag.__.isAnonymous) {
    if (!ptag.parent) break
    ptag = ptag.parent;
  }
  return ptag
}

/**
 * Trigger the unmount method on all the expressions
 * @param   { Array } expressions - DOM expressions
 */
function unmountAll(expressions) {
  each(expressions, expr => {
    if (expr.unmount) expr.unmount(true);
    else if (expr.tagName) expr.tag.unmount(true);
    else if (expr.unmount) expr.unmount();
  });
}

/**
 * Get the tag name of any DOM node
 * @param   { Object } dom - DOM node we want to parse
 * @param   { Boolean } skipDataIs - hack to ignore the data-is attribute when attaching to parent
 * @returns { String } name to identify this dom node in riot
 */
function getTagName(dom, skipDataIs) {
  const child = getTag(dom);
  const namedTag = !skipDataIs && getAttr(dom, IS_DIRECTIVE);
  return namedTag && !tmpl.hasExpr(namedTag) ?
    namedTag : child ? child.name : dom.tagName.toLowerCase()
}

/**
 * Set the property of an object for a given key. If something already
 * exists there, then it becomes an array containing both the old and new value.
 * @param { Object } obj - object on which to set the property
 * @param { String } key - property name
 * @param { Object } value - the value of the property to be set
 * @param { Boolean } ensureArray - ensure that the property remains an array
 * @param { Number } index - add the new item in a certain array position
 */
function arrayishAdd(obj, key, value, ensureArray, index) {
  const dest = obj[key];
  const isArr = isArray(dest);
  const hasIndex = !isUndefined(index);

  if (dest && dest === value) return

  // if the key was never set, set it once
  if (!dest && ensureArray) obj[key] = [value];
  else if (!dest) obj[key] = value;
  // if it was an array and not yet set
  else {
    if (isArr) {
      const oldIndex = dest.indexOf(value);
      // this item never changed its position
      if (oldIndex === index) return
      // remove the item from its old position
      if (oldIndex !== -1) dest.splice(oldIndex, 1);
      // move or add the item
      if (hasIndex) {
        dest.splice(index, 0, value);
      } else {
        dest.push(value);
      }
    } else obj[key] = [dest, value];
  }
}

/**
 * Removes an item from an object at a given key. If the key points to an array,
 * then the item is just removed from the array.
 * @param { Object } obj - object on which to remove the property
 * @param { String } key - property name
 * @param { Object } value - the value of the property to be removed
 * @param { Boolean } ensureArray - ensure that the property remains an array
*/
function arrayishRemove(obj, key, value, ensureArray) {
  if (isArray(obj[key])) {
    let index = obj[key].indexOf(value);
    if (index !== -1) obj[key].splice(index, 1);
    if (!obj[key].length) delete obj[key];
    else if (obj[key].length === 1 && !ensureArray) obj[key] = obj[key][0];
  } else if (obj[key] === value)
    delete obj[key]; // otherwise just delete the key
}

/**
 * Mount a tag creating new Tag instance
 * @param   { Object } root - dom node where the tag will be mounted
 * @param   { String } tagName - name of the riot tag we want to mount
 * @param   { Object } opts - options to pass to the Tag instance
 * @param   { Object } ctx - optional context that will be used to extend an existing class ( used in riot.Tag )
 * @returns { Tag } a new Tag instance
 */
function mountTo(root, tagName, opts, ctx) {
  const impl = __TAG_IMPL[tagName];
  const implClass = __TAG_IMPL[tagName].class;
  const context = ctx || (implClass ? Object.create(implClass.prototype) : {});
  // cache the inner HTML to fix #855
  const innerHTML = root._innerHTML = root._innerHTML || root.innerHTML;
  const conf = extend({ root, opts, context }, { parent: opts ? opts.parent : null });
  let tag;

  if (impl && root) tag = createTag(impl, conf, innerHTML);

  if (tag && tag.mount) {
    tag.mount(true);
    // add this tag to the virtualDom variable
    if (!contains(__TAGS_CACHE, tag)) __TAGS_CACHE.push(tag);
  }

  return tag
}

/**
 * makes a tag virtual and replaces a reference in the dom
 * @this Tag
 * @param { tag } the tag to make virtual
 * @param { ref } the dom reference location
 */
function makeReplaceVirtual(tag, ref) {
  const frag = createFrag();
  makeVirtual.call(tag, frag);
  ref.parentNode.replaceChild(frag, ref);
}

/**
 * Adds the elements for a virtual tag
 * @this Tag
 * @param { Node } src - the node that will do the inserting or appending
 * @param { Tag } target - only if inserting, insert before this tag's first child
 */
function makeVirtual(src, target) {
  const head = createDOMPlaceholder();
  const tail = createDOMPlaceholder();
  const frag = createFrag();
  let sib;
  let el;

  this.root.insertBefore(head, this.root.firstChild);
  this.root.appendChild(tail);

  this.__.head = el = head;
  this.__.tail = tail;

  while (el) {
    sib = el.nextSibling;
    frag.appendChild(el);
    this.__.virts.push(el); // hold for unmounting
    el = sib;
  }

  if (target)
    src.insertBefore(frag, target.__.head);
  else
    src.appendChild(frag);
}

/**
 * Return a temporary context containing also the parent properties
 * @this Tag
 * @param { Tag } - temporary tag context containing all the parent properties
 */
function inheritParentProps() {
  if (this.parent) return extend(Object.create(this), this.parent)
  return this
}

/**
 * Move virtual tag and all child nodes
 * @this Tag
 * @param { Node } src  - the node that will do the inserting
 * @param { Tag } target - insert before this tag's first child
 */
function moveVirtual(src, target) {
  let el = this.__.head;
  let sib;
  const frag = createFrag();

  while (el) {
    sib = el.nextSibling;
    frag.appendChild(el);
    el = sib;
    if (el === this.__.tail) {
      frag.appendChild(el);
      src.insertBefore(frag, target.__.head);
      break
    }
  }
}

/**
 * Get selectors for tags
 * @param   { Array } tags - tag names to select
 * @returns { String } selector
 */
function selectTags(tags) {
  // select all tags
  if (!tags) {
    const keys = Object.keys(__TAG_IMPL);
    return keys + selectTags(keys)
  }

  return tags
    .filter(t => !/[^-\w]/.test(t))
    .reduce((list, t) => {
      const name = t.trim().toLowerCase();
      return list + `,[${IS_DIRECTIVE}="${name}"]`
    }, '')
}


var tags = Object.freeze({
	getTag: getTag,
	moveChildTag: moveChildTag,
	initChildTag: initChildTag,
	getImmediateCustomParentTag: getImmediateCustomParentTag,
	unmountAll: unmountAll,
	getTagName: getTagName,
	arrayishAdd: arrayishAdd,
	arrayishRemove: arrayishRemove,
	mountTo: mountTo,
	makeReplaceVirtual: makeReplaceVirtual,
	makeVirtual: makeVirtual,
	inheritParentProps: inheritParentProps,
	moveVirtual: moveVirtual,
	selectTags: selectTags
});

// node_modules/riot/lib/riot.js

/**
 * Riot public api
 */
const settings$1 = settings;
const util = {
  tmpl,
  brackets,
  styleManager,
  vdom: __TAGS_CACHE,
  styleNode: styleManager.styleNode,
  // export the riot internal utils as well
  dom,
  check,
  misc,
  tags
};

var riot$1 = extend({}, core, {
  observable: observable,
  settings: settings$1,
  util,
})

// node_modules/es-is/number.js
// Generated by CoffeeScript 1.12.5
var isNumber;

var isNumber$1 = isNumber = function(value) {
  return toString(value) === '[object Number]';
};

// node_modules/es-is/object.js
// Generated by CoffeeScript 1.12.5
var isObject$1;

var isObject$2 = isObject$1 = function(value) {
  return toString(value) === '[object Object]';
};

// node_modules/es-object-assign/lib/es-object-assign.mjs
// src/index.coffee
var getOwnSymbols;
var objectAssign;
var shouldUseNative;
var toObject;
var slice = [].slice;

getOwnSymbols = Object.getOwnPropertySymbols;

toObject = function(val) {
  if (val === null || val === void 0) {
    throw new TypeError('Object.assign cannot be called with null or undefined');
  }
  return Object(val);
};

shouldUseNative = function() {
  var i, j, k, len, letter, order2, ref, test1, test2, test3;
  try {
    if (!Object.assign) {
      return false;
    }
    test1 = new String('abc');
    test1[5] = 'de';
    if (Object.getOwnPropertyNames(test1)[0] === '5') {
      return false;
    }
    test2 = {};
    for (i = j = 0; j <= 9; i = ++j) {
      test2['_' + String.fromCharCode(i)] = i;
    }
    order2 = Object.getOwnPropertyNames(test2).map(function(n) {
      return test2[n];
    });
    if (order2.join('') !== '0123456789') {
      return false;
    }
    test3 = {};
    ref = 'abcdefghijklmnopqrst'.split('');
    for (k = 0, len = ref.length; k < len; k++) {
      letter = ref[k];
      test3[letter] = letter;
    }
    if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};

var index = objectAssign = (function() {
  if (shouldUseNative()) {
    return Object.assign;
  }
  return function() {
    var from, j, k, key, len, len1, ref, source, sources, symbol, target, to;
    target = arguments[0], sources = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    to = toObject(target);
    for (j = 0, len = sources.length; j < len; j++) {
      source = sources[j];
      from = Object(source);
      for (key in from) {
        if (Object.prototype.hasOwnProperty.call(from, key)) {
          to[key] = from[key];
        }
      }
      if (getOwnSymbols) {
        ref = getOwnSymbols(from);
        for (k = 0, len1 = ref.length; k < len1; k++) {
          symbol = ref[k];
          if (Object.prototype.propIsEnumerable.call(from, symbol)) {
            to[symbol] = from[symbol];
          }
        }
      }
    }
    return to;
  };
})();

// node_modules/referential/lib/referential.mjs

// src/ref.coffee
var Ref;
var nextId;
var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

nextId = (function() {
  var ids;
  ids = 0;
  return function() {
    return ids++;
  };
})();

var Ref$1 = Ref = (function() {
  function Ref(_value, parent, key1) {
    this._value = _value;
    this.parent = parent;
    this.key = key1;
    this._cache = {};
    this._children = {};
    this._numChildren = 0;
    this._id = nextId();
    if (this.parent != null) {
      this.parent._children[this._id] = this;
      this.parent._numChildren++;
    }
    observable(this);
  }

  Ref.prototype._mutate = function(key) {
    var child, id, ref;
    this._cache = {};
    ref = this._children;
    for (id in ref) {
      child = ref[id];
      child._mutate();
    }
    return this;
  };

  Ref.prototype.clear = function() {
    var child, id, ref;
    this._cache = {};
    ref = this._children;
    for (id in ref) {
      child = ref[id];
      child.clear();
    }
    this._children = {};
    this._numChildren = 0;
    this._value = void 0;
    if (this.parent != null) {
      return this.parent.set(this.key, void 0);
    }
  };

  Ref.prototype.destroy = function() {
    var child, id, ref;
    ref = this._children;
    for (id in ref) {
      child = ref[id];
      child.destroy();
    }
    delete this._cache;
    delete this._children;
    this.off('*');
    if (this.parent) {
      delete this.parent._children[this._id];
      this.parent._numChildren--;
    }
    return this;
  };

  Ref.prototype.value = function(state) {
    if (!this.parent) {
      if (state != null) {
        this._value = state;
      }
      return this._value;
    }
    if (state != null) {
      return this.parent.set(this.key, state);
    } else {
      return this.parent.get(this.key);
    }
  };

  Ref.prototype.ref = function(key) {
    if (!key) {
      return this;
    }
    return new Ref(null, this, key);
  };

  Ref.prototype.get = function(key) {
    if (!key) {
      return this.value();
    } else {
      if (this._cache[key]) {
        return this._cache[key];
      }
      return this._cache[key] = this.index(key);
    }
  };

  Ref.prototype.set = function(key, value) {
    var k, oldValue, v;
    if (isObject$2(key)) {
      for (k in key) {
        v = key[k];
        this.set(k, v);
      }
      return this;
    }
    oldValue = this.get(key);
    this._mutate(key);
    if (value == null) {
      if (isObject$2(key)) {
        this.value(index(this.value(), key));
      } else {
        this.index(key, value, false);
      }
    } else {
      this.index(key, value, false);
    }
    this._triggerSet(key, value, oldValue);
    this._triggerSetChildren(key, value, oldValue);
    return this;
  };

  Ref.prototype._triggerSetChildren = function(key, value, oldValue) {
    var child, childKeys, childRemainderKey, i, id, keyPart, keyParts, partialKey, ref, ref1, regExps, results;
    if (this._numChildren === 0) {
      return this;
    }
    key = key + '';
    keyParts = key.split('.');
    partialKey = '';
    childKeys = [];
    regExps = {};
    for (i in keyParts) {
      keyPart = keyParts[i];
      if (partialKey === '') {
        partialKey = keyPart;
      } else {
        partialKey += '.' + keyPart;
      }
      childKeys[i] = partialKey;
      regExps[partialKey] = new RegExp('^' + partialKey + '\.?');
    }
    ref = this._children;
    results = [];
    for (id in ref) {
      child = ref[id];
      if (ref1 = child.key, indexOf.call(childKeys, ref1) >= 0) {
        childRemainderKey = key.replace(regExps[child.key], '');
        child.trigger('set', childRemainderKey, value, oldValue);
        results.push(child._triggerSetChildren(childRemainderKey, value, oldValue));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  Ref.prototype._triggerSet = function(key, value, oldValue) {
    var parentKey;
    this.trigger('set', key, value, oldValue);
    if (this.parent) {
      parentKey = this.key + '.' + key;
      return this.parent._triggerSet(parentKey, value, oldValue);
    }
  };

  Ref.prototype.extend = function(key, value) {
    var clone;
    this._mutate(key);
    if (value == null) {
      this.value(index(this.value(), key));
    } else {
      if (isObject$2(value)) {
        this.value(index((this.ref(key)).get(), value));
      } else {
        clone = this.clone();
        this.set(key, value);
        this.value(index(clone.get(), this.value()));
      }
    }
    return this;
  };

  Ref.prototype.clone = function(key) {
    return new Ref(index({}, this.get(key)));
  };

  Ref.prototype.index = function(key, value, get, obj) {
    var next, prop, props;
    if (get == null) {
      get = true;
    }
    if (obj == null) {
      obj = this.value();
    }
    if (this.parent) {
      return this.parent.index(this.key + '.' + key, value, get);
    }
    if (isNumber$1(key)) {
      key = String(key);
    }
    props = key.split('.');
    if (get) {
      while (prop = props.shift()) {
        if (!props.length) {
          return obj != null ? obj[prop] : void 0;
        }
        obj = obj != null ? obj[prop] : void 0;
      }
      return;
    }
    if (this._value == null) {
      this._value = {};
      if (obj == null) {
        obj = this._value;
      }
    }
    while (prop = props.shift()) {
      if (!props.length) {
        return obj[prop] = value;
      } else {
        next = props[0];
        if (obj[prop] == null) {
          if (isNaN(Number(next))) {
            if (obj[prop] == null) {
              obj[prop] = {};
            }
          } else {
            if (obj[prop] == null) {
              obj[prop] = [];
            }
          }
        }
      }
      obj = obj[prop];
    }
  };

  return Ref;

})();

// src/index.coffee
var methods;
var refer;

methods = ['extend', 'get', 'index', 'ref', 'set', 'value', 'clear', 'destroy', 'on', 'off', 'one', 'trigger'];

refer = function(state, ref) {
  var fn, i, len, method, wrapper;
  if (ref == null) {
    ref = null;
  }
  if (ref == null) {
    ref = new Ref$1(state);
  }
  wrapper = function(key) {
    return ref.get(key);
  };
  fn = function(method) {
    return wrapper[method] = function() {
      return ref[method].apply(ref, arguments);
    };
  };
  for (i = 0, len = methods.length; i < len; i++) {
    method = methods[i];
    fn(method);
  }
  wrapper.refer = function(key) {
    return refer(null, ref.ref(key));
  };
  wrapper.clone = function(key) {
    return refer(null, ref.clone(key));
  };
  return wrapper;
};

refer.Ref = Ref$1;

var refer$1 = refer;

// node_modules/broken/lib/broken.mjs
// src/promise-inspection.coffee
var PromiseInspection;

var PromiseInspection$1 = PromiseInspection = (function() {
  function PromiseInspection(arg) {
    this.state = arg.state, this.value = arg.value, this.reason = arg.reason;
  }

  PromiseInspection.prototype.isFulfilled = function() {
    return this.state === 'fulfilled';
  };

  PromiseInspection.prototype.isRejected = function() {
    return this.state === 'rejected';
  };

  return PromiseInspection;

})();

// src/utils.coffee
var _undefined$1 = void 0;

var _undefinedString$1 = 'undefined';

// src/soon.coffee
var soon;

soon = (function() {
  var bufferSize, callQueue, cqYield, fq, fqStart;
  fq = [];
  fqStart = 0;
  bufferSize = 1024;
  callQueue = function() {
    var err;
    while (fq.length - fqStart) {
      try {
        fq[fqStart]();
      } catch (error) {
        err = error;
        if (typeof console !== 'undefined') {
          console.error(err);
        }
      }
      fq[fqStart++] = _undefined$1;
      if (fqStart === bufferSize) {
        fq.splice(0, bufferSize);
        fqStart = 0;
      }
    }
  };
  cqYield = (function() {
    var dd, mo;
    if (typeof MutationObserver !== _undefinedString$1) {
      dd = document.createElement('div');
      mo = new MutationObserver(callQueue);
      mo.observe(dd, {
        attributes: true
      });
      return function() {
        dd.setAttribute('a', 0);
      };
    }
    if (typeof setImmediate !== _undefinedString$1) {
      return function() {
        setImmediate(callQueue);
      };
    }
    return function() {
      setTimeout(callQueue, 0);
    };
  })();
  return function(fn) {
    fq.push(fn);
    if (fq.length - fqStart === 1) {
      cqYield();
    }
  };
})();

var soon$1 = soon;

// src/promise.coffee
var Promise$1;
var STATE_FULFILLED;
var STATE_PENDING;
var STATE_REJECTED;
var _undefined;
var rejectClient;
var resolveClient;

_undefined = void 0;

STATE_PENDING = _undefined;

STATE_FULFILLED = 'fulfilled';

STATE_REJECTED = 'rejected';

resolveClient = function(c, arg) {
  var err, yret;
  if (typeof c.y === 'function') {
    try {
      yret = c.y.call(_undefined, arg);
      c.p.resolve(yret);
    } catch (error) {
      err = error;
      c.p.reject(err);
    }
  } else {
    c.p.resolve(arg);
  }
};

rejectClient = function(c, reason) {
  var err, yret;
  if (typeof c.n === 'function') {
    try {
      yret = c.n.call(_undefined, reason);
      c.p.resolve(yret);
    } catch (error) {
      err = error;
      c.p.reject(err);
    }
  } else {
    c.p.reject(reason);
  }
};

Promise$1 = (function() {
  function Promise(fn) {
    if (fn) {
      fn((function(_this) {
        return function(arg) {
          return _this.resolve(arg);
        };
      })(this), (function(_this) {
        return function(arg) {
          return _this.reject(arg);
        };
      })(this));
    }
  }

  Promise.prototype.resolve = function(value) {
    var clients, err, first, next;
    if (this.state !== STATE_PENDING) {
      return;
    }
    if (value === this) {
      return this.reject(new TypeError('Attempt to resolve promise with self'));
    }
    if (value && (typeof value === 'function' || typeof value === 'object')) {
      try {
        first = true;
        next = value.then;
        if (typeof next === 'function') {
          next.call(value, (function(_this) {
            return function(ra) {
              if (first) {
                if (first) {
                  first = false;
                }
                _this.resolve(ra);
              }
            };
          })(this), (function(_this) {
            return function(rr) {
              if (first) {
                first = false;
                _this.reject(rr);
              }
            };
          })(this));
          return;
        }
      } catch (error) {
        err = error;
        if (first) {
          this.reject(err);
        }
        return;
      }
    }
    this.state = STATE_FULFILLED;
    this.v = value;
    if (clients = this.c) {
      soon$1((function(_this) {
        return function() {
          var c, i, len;
          for (i = 0, len = clients.length; i < len; i++) {
            c = clients[i];
            resolveClient(c, value);
          }
        };
      })(this));
    }
  };

  Promise.prototype.reject = function(reason) {
    var clients;
    if (this.state !== STATE_PENDING) {
      return;
    }
    this.state = STATE_REJECTED;
    this.v = reason;
    if (clients = this.c) {
      soon$1(function() {
        var c, i, len;
        for (i = 0, len = clients.length; i < len; i++) {
          c = clients[i];
          rejectClient(c, reason);
        }
      });
    } else if (!Promise.suppressUncaughtRejectionError && typeof console !== 'undefined') {
      console.log('Broken Promise, please catch rejections: ', reason, reason ? reason.stack : null);
    }
  };

  Promise.prototype.then = function(onFulfilled, onRejected) {
    var a, client, p, s;
    p = new Promise;
    client = {
      y: onFulfilled,
      n: onRejected,
      p: p
    };
    if (this.state === STATE_PENDING) {
      if (this.c) {
        this.c.push(client);
      } else {
        this.c = [client];
      }
    } else {
      s = this.state;
      a = this.v;
      soon$1(function() {
        if (s === STATE_FULFILLED) {
          resolveClient(client, a);
        } else {
          rejectClient(client, a);
        }
      });
    }
    return p;
  };

  Promise.prototype["catch"] = function(cfn) {
    return this.then(null, cfn);
  };

  Promise.prototype["finally"] = function(cfn) {
    return this.then(cfn, cfn);
  };

  Promise.prototype.timeout = function(ms, msg) {
    msg = msg || 'timeout';
    return new Promise((function(_this) {
      return function(resolve, reject) {
        setTimeout(function() {
          return reject(Error(msg));
        }, ms);
        _this.then(function(val) {
          resolve(val);
        }, function(err) {
          reject(err);
        });
      };
    })(this));
  };

  Promise.prototype.callback = function(cb) {
    if (typeof cb === 'function') {
      this.then(function(val) {
        return cb(null, val);
      });
      this["catch"](function(err) {
        return cb(err, null);
      });
    }
    return this;
  };

  return Promise;

})();

var Promise$2 = Promise$1;

// src/helpers.coffee
var resolve = function(val) {
  var z;
  z = new Promise$2;
  z.resolve(val);
  return z;
};

var reject = function(err) {
  var z;
  z = new Promise$2;
  z.reject(err);
  return z;
};

var all = function(ps) {
  var i, j, len, p, rc, resolvePromise, results, retP;
  results = [];
  rc = 0;
  retP = new Promise$2();
  resolvePromise = function(p, i) {
    if (!p || typeof p.then !== 'function') {
      p = resolve(p);
    }
    p.then(function(yv) {
      results[i] = yv;
      rc++;
      if (rc === ps.length) {
        retP.resolve(results);
      }
    }, function(nv) {
      retP.reject(nv);
    });
  };
  for (i = j = 0, len = ps.length; j < len; i = ++j) {
    p = ps[i];
    resolvePromise(p, i);
  }
  if (!ps.length) {
    retP.resolve(results);
  }
  return retP;
};

var reflect = function(promise) {
  return new Promise$2(function(resolve, reject) {
    return promise.then(function(value) {
      return resolve(new PromiseInspection$1({
        state: 'fulfilled',
        value: value
      }));
    })["catch"](function(err) {
      return resolve(new PromiseInspection$1({
        state: 'rejected',
        reason: err
      }));
    });
  });
};

var settle = function(promises) {
  return all(promises.map(reflect));
};

// src/index.coffee
Promise$2.all = all;

Promise$2.reflect = reflect;

Promise$2.reject = reject;

Promise$2.resolve = resolve;

Promise$2.settle = settle;

Promise$2.soon = soon$1;

// node_modules/es-raf/dist/es-raf.mjs
var browser = (function() {
  var loadTime, now;
  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    now = function() {
      return performance.now();
    };
  } else {
    now = function() {
      return Date.now() - loadTime;
    };
    loadTime = new Date().getTime();
  }
  return now;
})();
var frameDuration;
var id;
var last;
var queue;
var requestAnimationFrame;

frameDuration = 1000 / 60;

id = 0;

last = 0;

queue = [];

var raf = requestAnimationFrame = function(callback) {
  var next, now_;
  if (queue.length === 0) {
    now_ = browser();
    next = Math.max(0, frameDuration - (now_ - last));
    last = next + now_;
    setTimeout(function() {
      var cp, err, i, len, x;
      cp = queue.slice(0);
      queue.length = 0;
      for (i = 0, len = cp.length; i < len; i++) {
        x = cp[i];
        if (!x.cancelled) {
          try {
            x.callback(last);
          } catch (error) {
            err = error;
            setTimeout(function() {
              throw err;
            }, 0);
          }
        }
      }
    }, Math.round(next));
  }
  queue.push({
    handle: ++id,
    callback: callback,
    cancelled: false
  });
  return id;
};

// node_modules/el.js/lib/el.mjs

// src/schedule.coffee
var id$1;
var p;
var rafId;
var scheduleUpdate;
var todos;

todos = {};

rafId = -1;

p = null;

id$1 = 0;

scheduleUpdate = function(tag) {
  var currentTag, parentTag;
  if (!p) {
    p = new Promise$2;
    p.then(function() {
      var _, todo;
      for (_ in todos) {
        todo = todos[_];
        todo.update();
      }
      p = null;
      todos = {};
      return rafId = -1;
    });
  }
  if (todos['*']) {
    return p;
  }
  if (!tag) {
    todos = {
      '*': riot$1
    };
  } else if (tag.update == null) {
    throw new Error('tag has no update routine');
  } else {
    currentTag = tag;
    while (currentTag != null) {
      parentTag = currentTag.parent;
      if (!currentTag._schedulingId) {
        currentTag._schedulingId = id$1++;
      } else if (todos[currentTag.schedulingId] != null) {
        return p;
      }
      currentTag = parentTag;
    }
    todos[tag._schedulingId] = tag;
  }
  if (rafId === -1) {
    rafId = raf(function() {
      return p.resolve();
    });
  }
  return p;
};

// src/views/view.coffee
var View;
var collapsePrototype;
var setPrototypeOf;

setPrototypeOf = (function() {
  var mixinProperties, setProtoOf;
  setProtoOf = function(obj, proto) {
    return obj.__proto__ = proto;
  };
  mixinProperties = function(obj, proto) {
    var prop, results;
    results = [];
    for (prop in proto) {
      if (obj[prop] == null) {
        results.push(obj[prop] = proto[prop]);
      } else {
        results.push(void 0);
      }
    }
    return results;
  };
  if (Object.setPrototypeOf || {
    __proto__: []
  } instanceof Array) {
    return setProtoOf;
  } else {
    return mixinProperties;
  }
})();

collapsePrototype = function(collapse, proto) {
  var parentProto;
  if (proto === View.prototype) {
    return;
  }
  parentProto = Object.getPrototypeOf(proto);
  collapsePrototype(collapse, parentProto);
  return index(collapse, parentProto);
};

View = (function() {
  View.register = function() {
    return new this;
  };

  View.prototype.tag = '';

  View.prototype.html = '';

  View.prototype.css = '';

  View.prototype.attrs = '';

  View.prototype.events = null;

  function View() {
    var newProto;
    newProto = collapsePrototype({}, this);
    this.beforeInit();
    riot$1.tag(this.tag, this.html, this.css, this.attrs, function(opts) {
      var fn, handler, k, name, parent, proto, ref, ref1, self, v;
      if (newProto != null) {
        for (k in newProto) {
          v = newProto[k];
          if (isFunction$1(v)) {
            (function(_this) {
              return (function(v) {
                var oldFn;
                if (_this[k] != null) {
                  oldFn = _this[k];
                  return _this[k] = function() {
                    oldFn.apply(_this, arguments);
                    return v.apply(_this, arguments);
                  };
                } else {
                  return _this[k] = function() {
                    return v.apply(_this, arguments);
                  };
                }
              });
            })(this)(v);
          } else {
            this[k] = v;
          }
        }
      }
      self = this;
      parent = (ref = self.parent) != null ? ref : opts.parent;
      proto = Object.getPrototypeOf(self);
      while (parent && parent !== proto) {
        setPrototypeOf(self, parent);
        self = parent;
        parent = self.parent;
        proto = Object.getPrototypeOf(self);
      }
      if (opts != null) {
        for (k in opts) {
          v = opts[k];
          this[k] = v;
        }
      }
      if (this.events != null) {
        ref1 = this.events;
        fn = (function(_this) {
          return function(name, handler) {
            if (typeof handler === 'string') {
              return _this.on(name, function() {
                return _this[handler].apply(_this, arguments);
              });
            } else {
              return _this.on(name, function() {
                return handler.apply(_this, arguments);
              });
            }
          };
        })(this);
        for (name in ref1) {
          handler = ref1[name];
          fn(name, handler);
        }
      }
      return this.init(opts);
    });
  }

  View.prototype.beforeInit = function() {};

  View.prototype.init = function() {};

  View.prototype.scheduleUpdate = function() {
    return scheduleUpdate(this);
  };

  return View;

})();

var View$1 = View;

// src/views/inputify.coffee
var inputify;
var isRef;

isRef = function(o) {
  return (o != null) && isFunction$1(o.ref);
};

inputify = function(data, configs) {
  var config, fn, inputs, name, ref;
  if (configs == null) {
    configs = {};
  }
  ref = data;
  if (!isRef(ref)) {
    ref = refer$1(data);
  }
  inputs = {};
  fn = function(name, config) {
    var fn1, i, input, len, middleware, middlewareFn, validate;
    middleware = [];
    if (config && config.length > 0) {
      fn1 = function(name, middlewareFn) {
        return middleware.push(function(pair) {
          ref = pair[0], name = pair[1];
          return Promise$2.resolve(pair).then(function(pair) {
            return middlewareFn.call(pair[0], pair[0].get(pair[1]), pair[1], pair[0]);
          }).then(function(v) {
            ref.set(name, v);
            return pair;
          });
        });
      };
      for (i = 0, len = config.length; i < len; i++) {
        middlewareFn = config[i];
        fn1(name, middlewareFn);
      }
    }
    middleware.push(function(pair) {
      ref = pair[0], name = pair[1];
      return Promise$2.resolve(ref.get(name));
    });
    validate = function(ref, name) {
      var j, len1, p;
      p = Promise$2.resolve([ref, name]);
      for (j = 0, len1 = middleware.length; j < len1; j++) {
        middlewareFn = middleware[j];
        p = p.then(middlewareFn);
      }
      return p;
    };
    input = {
      name: name,
      ref: ref,
      config: config,
      validate: validate
    };
    observable(input);
    return inputs[name] = input;
  };
  for (name in configs) {
    config = configs[name];
    fn(name, config);
  }
  return inputs;
};

var inputify$1 = inputify;

// src/views/form.coffee
var Form;
var extend$1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
var hasProp = {}.hasOwnProperty;

Form = (function(superClass) {
  extend$1(Form, superClass);

  function Form() {
    return Form.__super__.constructor.apply(this, arguments);
  }

  Form.prototype.html = '<yield/>';

  Form.prototype.initInputs = function() {
    this.inputs = {};
    if (this.configs != null) {
      return this.inputs = inputify$1(this.data, this.configs);
    }
  };

  Form.prototype.init = function() {
    return this.initInputs();
  };

  Form.prototype.submit = function(e) {
    var input, name, p, pRef, ps, ref;
    ps = [];
    ref = this.inputs;
    for (name in ref) {
      input = ref[name];
      pRef = {};
      input.trigger('validate', pRef);
      if (pRef.p != null) {
        ps.push(pRef.p);
      }
    }
    p = Promise$2.settle(ps).then((function(_this) {
      return function(results) {
        var i, len, result;
        for (i = 0, len = results.length; i < len; i++) {
          result = results[i];
          if (!result.isFulfilled()) {
            return;
          }
        }
        return _this._submit.apply(_this, arguments);
      };
    })(this));
    if (e != null) {
      e.preventDefault();
      e.stopPropagation();
    }
    return p;
  };

  Form.prototype._submit = function() {};

  return Form;

})(View$1);

var Form$1 = Form;

// src/views/input.coffee
var Input;
var extend$1$1 = function(child, parent) { for (var key in parent) { if (hasProp$1.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
var hasProp$1 = {}.hasOwnProperty;

Input = (function(superClass) {
  extend$1$1(Input, superClass);

  function Input() {
    return Input.__super__.constructor.apply(this, arguments);
  }

  Input.prototype.input = null;

  Input.prototype.valid = false;

  Input.prototype.errorMessage = '';

  Input.prototype.init = function() {
    var ref1, ref2;
    if ((this.input == null) && (this.lookup == null) && (this.bind == null)) {
      throw new Error('No input or bind provided');
    }
    if ((this.input == null) && (this.inputs != null)) {
      this.input = this.inputs[(ref1 = this.lookup) != null ? ref1 : this.bind];
    }
    if (this.input == null) {
      this.input = {
        name: (ref2 = this.lookup) != null ? ref2 : this.bind,
        ref: this.data,
        validate: function(ref, name) {
          return Promise.resolve([ref, name]);
        }
      };
      observable(this.input);
    }
    this.input.on('validate', (function(_this) {
      return function(pRef) {
        return _this.validate(pRef);
      };
    })(this));
    return this.input.ref.on('set', (function(_this) {
      return function(n, v1, v2) {
        if (n === _this.input.name && v1 !== v2) {
          _this._change(v1, true);
          return _this.scheduleUpdate();
        }
      };
    })(this));
  };

  Input.prototype.getValue = function(event) {
    return event.target.value;
  };

  Input.prototype.change = function(event) {
    var value;
    value = this.getValue(event);
    return this._change(value);
  };

  Input.prototype._change = function(value, forced) {
    var name, ref, ref1;
    ref1 = this.input, ref = ref1.ref, name = ref1.name;
    if (!forced && value === ref.get(name)) {
      return;
    }
    this.input.ref.set(name, value);
    this.clearError();
    return this.validate();
  };

  Input.prototype.error = function(err) {
    var ref1;
    return this.errorMessage = (ref1 = err != null ? err.message : void 0) != null ? ref1 : err;
  };

  Input.prototype.changed = function() {};

  Input.prototype.clearError = function() {
    return this.errorMessage = '';
  };

  Input.prototype.validate = function(pRef) {
    var p;
    p = this.input.validate(this.input.ref, this.input.name).then((function(_this) {
      return function(value) {
        _this.changed(value);
        _this.valid = true;
        return _this.scheduleUpdate();
      };
    })(this))["catch"]((function(_this) {
      return function(err) {
        _this.error(err);
        _this.valid = false;
        _this.scheduleUpdate();
        throw err;
      };
    })(this));
    if (pRef != null) {
      pRef.p = p;
    }
    return p;
  };

  return Input;

})(View$1);

var Input$1 = Input;

// src/views/index.coffee
var Views;

var Views$1 = Views = {
  Form: Form$1,
  Input: Input$1,
  View: View$1,
  inputify: inputify$1
};

// src/index.coffee
var El;
var fn;
var k$1;
var v;

El = {
  Views: Views$1,
  View: Views$1.View,
  Form: Views$1.Form,
  Input: Views$1.Input,
  ref: refer$1,
  riot: riot$1,
  scheduleUpdate: function() {
    return scheduleUpdate();
  }
};

fn = function(k, v) {
  if (isFunction$1(v)) {
    return El[k] = function() {
      return v.apply(riot$1, arguments);
    };
  }
};
for (k$1 in riot$1) {
  v = riot$1[k$1];
  fn(k$1, v);
}

var El$1 = El;

// src/header-menu.coffee

_default(function() {
  var $scrollableArea, $window;
  $window = _default(window);
  $window.on('DOMContentLoaded scroll', function(e) {
    if ($window.scrollTop() > 10) {
      return _default('header').first().addClass('undocked').removeClass('docked');
    } else {
      return _default('header').first().removeClass('undocked').addClass('docked');
    }
  });
  $scrollableArea = _default('main');
  return $scrollableArea.on('DOMContentLoaded scroll', function(e) {
    if ($scrollableArea.scrollTop() > 10) {
      return _default('header').first().addClass('undocked').removeClass('docked');
    } else {
      return _default('header').first().removeClass('undocked').addClass('docked');
    }
  });
});

// src/header-menu-complex.coffee
var HeaderMenuComplex,
  extend$2 = function(child, parent) { for (var key in parent) { if (hasProp$2.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp$2 = {}.hasOwnProperty;

HeaderMenuComplex = (function(superClass) {
  extend$2(HeaderMenuComplex, superClass);

  function HeaderMenuComplex() {
    return HeaderMenuComplex.__super__.constructor.apply(this, arguments);
  }

  HeaderMenuComplex.prototype.tag = 'header-menu-complex';

  HeaderMenuComplex.prototype.html = '<yield/>';

  HeaderMenuComplex.prototype.menuToShow = '';

  HeaderMenuComplex.prototype.slideDirection = '';

  HeaderMenuComplex.prototype.init = function() {
    var hideMenu;
    HeaderMenuComplex.__super__.init.apply(this, arguments);
    hideMenu = this.hideMenu.bind(this);
    this.on('mount', (function(_this) {
      return function() {
        _this.showMenu({
          target: _default('[data-menu-title]')[0]
        });
        _this.menuToShow = '';
        return _default(document).on('mousemove', hideMenu);
      };
    })(this));
    return this.on('unmount', function() {
      return _default(document).off('mousemove', hideMenu);
    });
  };

  HeaderMenuComplex.prototype.showMenu = function(e) {
    var $el, $menu, $menuToShow, $wrapper, first, isLeftOf, isRightOf, left, title;
    this.slideDirection = '';
    $el = _default(e.target);
    if ($el[0] == null) {
      return;
    }
    first = this.menuToShow === '';
    title = $el.data('menu-title');
    if (!first) {
      isRightOf = _default('[data-menu-title="' + this.menuToShow + '"]').offset().left < $el.offset().left;
      isLeftOf = _default('[data-menu-title="' + this.menuToShow + '"]').offset().left > $el.offset().left;
      if (isRightOf) {
        this.slideDirection = 'right';
      } else if (isLeftOf) {
        this.slideDirection = 'left';
      }
    }
    this.menuToShow = title;
    $menu = $el.closest(this.tag);
    $menuToShow = $menu.find('[data-menu="' + this.menuToShow + '"] .menu-content');
    left = $el.offset().left - $menu.offset().left + (($el.width() - $menuToShow.width()) / 2);
    $wrapper = $menu.find('.menu-wrapper');
    if (first) {
      $wrapper.css({
        transition: $wrapper.css('transition') + ', transform 0s'
      });
      raf(function() {
        return $wrapper.css({
          transition: null
        });
      });
    }
    $wrapper.css({
      transform: 'translateX(' + left + 'px)',
      width: $menuToShow.width() + 'px',
      height: $menuToShow.height() + 'px'
    });
    return console.log('Showing ' + $el.data('menu-title'));
  };

  HeaderMenuComplex.prototype.hideMenu = function(e) {
    if (!_default('[data-menu-title]:hover')[0] && !_default('[data-menu-title]:focus')[0] && !_default('.menu-wrapper:hover')[0]) {
      this.menuToShow = '';
      console.log('Hiding ' + e);
      return this.scheduleUpdate();
    }
  };

  return HeaderMenuComplex;

})(El$1.View);

HeaderMenuComplex.register();

var HeaderMenuComplex$1 = HeaderMenuComplex;

// src/header-menu-mobile.coffee
var HeaderMenuMobile,
  extend$3 = function(child, parent) { for (var key in parent) { if (hasProp$3.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp$3 = {}.hasOwnProperty;

HeaderMenuMobile = (function(superClass) {
  extend$3(HeaderMenuMobile, superClass);

  function HeaderMenuMobile() {
    return HeaderMenuMobile.__super__.constructor.apply(this, arguments);
  }

  HeaderMenuMobile.prototype.tag = 'header-menu-mobile';

  HeaderMenuMobile.prototype.html = '<yield/>';

  HeaderMenuMobile.prototype.init = function() {
    return HeaderMenuMobile.__super__.init.apply(this, arguments);
  };

  return HeaderMenuMobile;

})(El$1.View);

HeaderMenuMobile.register();

var HeaderMenuMobile$1 = HeaderMenuMobile;

// src/header-menu-simple.coffee
var HeaderMenuSimple,
  extend$4 = function(child, parent) { for (var key in parent) { if (hasProp$4.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp$4 = {}.hasOwnProperty;

HeaderMenuSimple = (function(superClass) {
  extend$4(HeaderMenuSimple, superClass);

  function HeaderMenuSimple() {
    return HeaderMenuSimple.__super__.constructor.apply(this, arguments);
  }

  HeaderMenuSimple.prototype.tag = 'header-menu-simple';

  HeaderMenuSimple.prototype.html = '<yield/>';

  HeaderMenuSimple.prototype.init = function() {
    return HeaderMenuSimple.__super__.init.apply(this, arguments);
  };

  return HeaderMenuSimple;

})(El$1.View);

HeaderMenuSimple.register();

var HeaderMenuSimple$1 = HeaderMenuSimple;

// node_modules/es-cookies/lib/cookies.mjs

// src/cookies.coffee
var Cookies;

Cookies = (function() {
  function Cookies(defaults) {
    this.defaults = defaults != null ? defaults : {};
    this.get = (function(_this) {
      return function(key) {
        return _this.read(key);
      };
    })(this);
    this.getJSON = (function(_this) {
      return function(key) {
        try {
          return JSON.parse(_this.read(key));
        } catch (error) {
          return {};
        }
      };
    })(this);
    this.remove = (function(_this) {
      return function(key, attrs) {
        return _this.write(key, '', index({
          expires: -1
        }, attrs));
      };
    })(this);
    this.set = (function(_this) {
      return function(key, value, attrs) {
        return _this.write(key, value, attrs);
      };
    })(this);
  }

  Cookies.prototype.read = function(key) {
    var cookie, cookies, i, kv, len, name, parts, rdecode, result;
    if (!key) {
      result = {};
    }
    cookies = document.cookie ? document.cookie.split('; ') : [];
    rdecode = /(%[0-9A-Z]{2})+/g;
    for (i = 0, len = cookies.length; i < len; i++) {
      kv = cookies[i];
      parts = kv.split('=');
      cookie = parts.slice(1).join('=');
      if (cookie.charAt(0) === '"') {
        cookie = cookie.slice(1, -1);
      }
      try {
        name = parts[0].replace(rdecode, decodeURIComponent);
        cookie = cookie.replace(rdecode, decodeURIComponent);
        if (key === name) {
          return cookie;
        }
        if (!key) {
          result[name] = cookie;
        }
      } catch (error) {
      }
    }
    return result;
  };

  Cookies.prototype.write = function(key, value, attrs) {
    var attr, expires, name, result, strAttrs;
    attrs = index({
      path: '/'
    }, this.defaults, attrs);
    if (isNumber$1(attrs.expires)) {
      expires = new Date;
      expires.setMilliseconds(expires.getMilliseconds() + attrs.expires * 864e+5);
      attrs.expires = expires;
    }
    attrs.expires = attrs.expires ? attrs.expires.toUTCString() : '';
    try {
      result = JSON.stringify(value);
      if (/^[\{\[]/.test(result)) {
        value = result;
      }
    } catch (error) {
    }
    value = encodeURIComponent(String(value)).replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
    key = encodeURIComponent(String(key));
    key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
    key = key.replace(/[\(\)]/g, escape);
    strAttrs = '';
    for (name in attrs) {
      attr = attrs[name];
      if (!attr) {
        continue;
      }
      strAttrs += '; ' + name;
      if (attr === true) {
        continue;
      }
      strAttrs += '=' + attr;
    }
    return document.cookie = key + '=' + value + strAttrs;
  };

  return Cookies;

})();

var Cookies$1 = Cookies;

// src/index.coffee
var index$1 = new Cookies$1();

// node_modules/es-md5/dist/md5.mjs
var binl2rstr;
var binlMD5;
var bitRotateLeft;
var hexHMACMD5;
var hexMD5;
var md5;
var md5cmn;
var md5ff;
var md5gg;
var md5hh;
var md5ii;
var rawHMACMD5;
var rawMD5;
var rstr2binl;
var rstr2hex;
var rstrHMACMD5;
var rstrMD5;
var safeAdd;
var str2rstrUTF8;

safeAdd = function(x, y) {
  var lsw, msw;
  lsw = (x & 0xFFFF) + (y & 0xFFFF);
  msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return msw << 16 | lsw & 0xFFFF;
};

bitRotateLeft = function(num, cnt) {
  return num << cnt | num >>> 32 - cnt;
};

md5cmn = function(q, a, b, x, s, t) {
  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
};

md5ff = function(a, b, c, d, x, s, t) {
  return md5cmn(b & c | ~b & d, a, b, x, s, t);
};

md5gg = function(a, b, c, d, x, s, t) {
  return md5cmn(b & d | c & ~d, a, b, x, s, t);
};

md5hh = function(a, b, c, d, x, s, t) {
  return md5cmn(b ^ c ^ d, a, b, x, s, t);
};

md5ii = function(a, b, c, d, x, s, t) {
  return md5cmn(c ^ (b | ~d), a, b, x, s, t);
};

binlMD5 = function(x, len) {

  /* append padding */
  var a, b, c, d, i, olda, oldb, oldc, oldd;
  x[len >> 5] |= 0x80 << len % 32;
  x[(len + 64 >>> 9 << 4) + 14] = len;
  i = void 0;
  olda = void 0;
  oldb = void 0;
  oldc = void 0;
  oldd = void 0;
  a = 1732584193;
  b = -271733879;
  c = -1732584194;
  d = 271733878;
  i = 0;
  while (i < x.length) {
    olda = a;
    oldb = b;
    oldc = c;
    oldd = d;
    a = md5ff(a, b, c, d, x[i], 7, -680876936);
    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, x[i], 20, -373897302);
    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, x[i], 11, -358537222);
    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
    a = md5ii(a, b, c, d, x[i], 6, -198630844);
    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
    i += 16;
  }
  return [a, b, c, d];
};

binl2rstr = function(input) {
  var i, length32, output;
  i = void 0;
  output = '';
  length32 = input.length * 32;
  i = 0;
  while (i < length32) {
    output += String.fromCharCode(input[i >> 5] >>> i % 32 & 0xFF);
    i += 8;
  }
  return output;
};

rstr2binl = function(input) {
  var i, length8, output;
  i = void 0;
  output = [];
  output[(input.length >> 2) - 1] = void 0;
  i = 0;
  while (i < output.length) {
    output[i] = 0;
    i += 1;
  }
  length8 = input.length * 8;
  i = 0;
  while (i < length8) {
    output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << i % 32;
    i += 8;
  }
  return output;
};

rstrMD5 = function(s) {
  return binl2rstr(binlMD5(rstr2binl(s), s.length * 8));
};

rstrHMACMD5 = function(key, data) {
  var bkey, hash, i, ipad, opad;
  i = void 0;
  bkey = rstr2binl(key);
  ipad = [];
  opad = [];
  hash = void 0;
  ipad[15] = opad[15] = void 0;
  if (bkey.length > 16) {
    bkey = binlMD5(bkey, key.length * 8);
  }
  i = 0;
  while (i < 16) {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
    i += 1;
  }
  hash = binlMD5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
  return binl2rstr(binlMD5(opad.concat(hash), 512 + 128));
};

rstr2hex = function(input) {
  var hexTab, i, output, x;
  hexTab = '0123456789abcdef';
  output = '';
  x = void 0;
  i = void 0;
  i = 0;
  while (i < input.length) {
    x = input.charCodeAt(i);
    output += hexTab.charAt(x >>> 4 & 0x0F) + hexTab.charAt(x & 0x0F);
    i += 1;
  }
  return output;
};

str2rstrUTF8 = function(input) {
  return unescape(encodeURIComponent(input));
};

rawMD5 = function(s) {
  return rstrMD5(str2rstrUTF8(s));
};

hexMD5 = function(s) {
  return rstr2hex(rawMD5(s));
};

rawHMACMD5 = function(k, d) {
  return rstrHMACMD5(str2rstrUTF8(k), str2rstrUTF8(d));
};

hexHMACMD5 = function(k, d) {
  return rstr2hex(rawHMACMD5(k, d));
};

var index$2 = md5 = function(string, key, raw) {
  if (!key) {
    if (!raw) {
      return hexMD5(string);
    }
    return rawMD5(string);
  }
  if (!raw) {
    return hexHMACMD5(key, string);
  }
  return rawHMACMD5(key, string);
};

// node_modules/akasha/lib/akasha.mjs

// src/cookie-storage.coffee
var cookieStorage = (function() {
  var key, postFix;
  postFix = index$2(window.location.host);
  key = function(k) {
    return k + "_" + postFix;
  };
  return {
    get: function(k) {
      return index$1.getJSON(key(k));
    },
    set: function(k, v, opts) {
      var ks, ref;
      ks = (ref = index$1.getJSON(key('_keys'))) != null ? ref : [];
      ks.push(k);
      index$1.set(key('_keys'), ks);
      return index$1.set(key(k, opts), v);
    },
    remove: function(k) {
      return index$1.remove(key(k));
    },
    clear: function() {
      var i, k, ks, len, ref;
      ks = (ref = index$1.getJSON(key('_keys'))) != null ? ref : [];
      for (i = 0, len = ks.length; i < len; i++) {
        k = ks[i];
        index$1.remove(k);
      }
      return index$1.remove(key('_keys'));
    }
  };
})();

// src/storage.coffee
var storage = function(backend) {
  var root, store;
  root = typeof window === 'undefined' ? global : window;
  try {
    store = root[backend + 'Storage'];
  } catch (error) {
    return {
      get: function() {
        return void 0;
      },
      set: function() {
        return void 0;
      },
      remove: function() {
        return void 0;
      },
      clear: function() {
        return void 0;
      }
    };
  }
  return {
    get: function(k) {
      try {
        return JSON.parse(store.getItem(k));
      } catch (error) {
        console.error('Unable to parse', k);
        return void 0;
      }
    },
    set: function(k, v, opts) {
      return store.setItem(k, JSON.stringify(v));
    },
    remove: function(k) {
      return store.removeItem(k);
    },
    clear: function() {
      return store.clear();
    }
  };
};

// src/local-storage.coffee
var localStorage = storage('local');

// src/pretend-storage.coffee
var pretendStorage = (function() {
  var key, postFix, pretendStorage;
  pretendStorage = {};
  postFix = index$2(window.location.host);
  key = function(k) {
    return k + "_" + postFix;
  };
  return {
    get: function(k) {
      return pretendStorage[key(k)];
    },
    set: function(k, v, opts) {
      return pretendStorage[key(k)] = v;
    },
    remove: function(k) {
      return delete pretendStorage[key(k)];
    },
    clear: function() {
      var results;
      results = [];
      for (key in pretendStorage) {
        results.push(delete pretendStorage[key(k)]);
      }
      return results;
    }
  };
})();

// src/index.coffee
var supported;

supported = function(storage) {
  var ok, testStr;
  try {
    testStr = '__akasha__test__';
    storage.set(testStr, testStr);
    ok = (storage.get(testStr)) === testStr;
    storage.remove(testStr);
    return ok;
  } catch (error) {
    return false;
  }
};

var index$3 = (function() {
  if (supported(localStorage)) {
    return localStorage;
  } else if (supported(cookieStorage)) {
    return cookieStorage;
  } else {
    return pretendStorage;
  }
})();

// src/privacy-popup.coffee
var PrivacyPopup,
  extend$5 = function(child, parent) { for (var key in parent) { if (hasProp$5.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp$5 = {}.hasOwnProperty;

PrivacyPopup = (function(superClass) {
  extend$5(PrivacyPopup, superClass);

  function PrivacyPopup() {
    return PrivacyPopup.__super__.constructor.apply(this, arguments);
  }

  PrivacyPopup.prototype.tag = 'privacy-popup';

  PrivacyPopup.prototype.html = '<yield/>';

  PrivacyPopup.prototype.init = function() {
    return PrivacyPopup.__super__.init.apply(this, arguments);
  };

  PrivacyPopup.prototype.accept = function() {
    return index$3.set('site.privacy.accepted', true);
  };

  PrivacyPopup.prototype.accepted = function() {
    return !!(index$3.get('site.privacy.accepted'));
  };

  return PrivacyPopup;

})(El$1.View);

PrivacyPopup.register();

var PrivacyPopup$1 = PrivacyPopup;

// node_modules/es-ua-parser/src/ua-parser.js

//////////////
// Constants
/////////////


var LIBVERSION  = '0.7.14',
    EMPTY       = '',
    UNKNOWN     = '?',
    FUNC_TYPE   = 'function',
    UNDEF_TYPE  = 'undefined',
    OBJ_TYPE    = 'object',
    STR_TYPE    = 'string',
    MAJOR       = 'major', // deprecated
    MODEL       = 'model',
    NAME        = 'name',
    TYPE        = 'type',
    VENDOR      = 'vendor',
    VERSION     = 'version',
    ARCHITECTURE= 'architecture',
    CONSOLE     = 'console',
    MOBILE      = 'mobile',
    TABLET      = 'tablet',
    SMARTTV     = 'smarttv',
    WEARABLE    = 'wearable',
    EMBEDDED    = 'embedded';


///////////
// Helper
//////////


var util$1 = {
    extend : function (regexes, extensions) {
        var margedRegexes = {};
        for (var i in regexes) {
            if (extensions[i] && extensions[i].length % 2 === 0) {
                margedRegexes[i] = extensions[i].concat(regexes[i]);
            } else {
                margedRegexes[i] = regexes[i];
            }
        }
        return margedRegexes;
    },
    has : function (str1, str2) {
      if (typeof str1 === "string") {
        return str2.toLowerCase().indexOf(str1.toLowerCase()) !== -1;
      } else {
        return false;
      }
    },
    lowerize : function (str) {
        return str.toLowerCase();
    },
    major : function (version) {
        return typeof(version) === STR_TYPE ? version.replace(/[^\d\.]/g,'').split(".")[0] : undefined;
    },
    trim : function (str) {
      return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    }
};


///////////////
// Map helper
//////////////


var mapper = {

    rgx : function (ua, arrays) {

        //var result = {},
        var i = 0, j, k, p, q, matches, match;//, args = arguments;

        /*// construct object barebones
        for (p = 0; p < args[1].length; p++) {
            q = args[1][p];
            result[typeof q === OBJ_TYPE ? q[0] : q] = undefined;
        }*/

        // loop through all regexes maps
        while (i < arrays.length && !matches) {

            var regex = arrays[i],       // even sequence (0,2,4,..)
                props = arrays[i + 1];   // odd sequence (1,3,5,..)
            j = k = 0;

            // try matching uastring with regexes
            while (j < regex.length && !matches) {

                matches = regex[j++].exec(ua);

                if (!!matches) {
                    for (p = 0; p < props.length; p++) {
                        match = matches[++k];
                        q = props[p];
                        // check if given property is actually array
                        if (typeof q === OBJ_TYPE && q.length > 0) {
                            if (q.length == 2) {
                                if (typeof q[1] == FUNC_TYPE) {
                                    // assign modified match
                                    this[q[0]] = q[1].call(this, match);
                                } else {
                                    // assign given value, ignore regex match
                                    this[q[0]] = q[1];
                                }
                            } else if (q.length == 3) {
                                // check whether function or regex
                                if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                    // call function (usually string mapper)
                                    this[q[0]] = match ? q[1].call(this, match, q[2]) : undefined;
                                } else {
                                    // sanitize match using given regex
                                    this[q[0]] = match ? match.replace(q[1], q[2]) : undefined;
                                }
                            } else if (q.length == 4) {
                                    this[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined;
                            }
                        } else {
                            this[q] = match ? match : undefined;
                        }
                    }
                }
            }
            i += 2;
        }
        //console.log(this);
        //return this;
    },

    str : function (str, map) {

        for (var i in map) {
            // check if array
            if (typeof map[i] === OBJ_TYPE && map[i].length > 0) {
                for (var j = 0; j < map[i].length; j++) {
                    if (util$1.has(map[i][j], str)) {
                        return (i === UNKNOWN) ? undefined : i;
                    }
                }
            } else if (util$1.has(map[i], str)) {
                return (i === UNKNOWN) ? undefined : i;
            }
        }
        return str;
    }
};


///////////////
// String map
//////////////


var maps = {

    browser : {
        oldsafari : {
            version : {
                '1.0'   : '/8',
                '1.2'   : '/1',
                '1.3'   : '/3',
                '2.0'   : '/412',
                '2.0.2' : '/416',
                '2.0.3' : '/417',
                '2.0.4' : '/419',
                '?'     : '/'
            }
        }
    },

    device : {
        amazon : {
            model : {
                'Fire Phone' : ['SD', 'KF']
            }
        },
        sprint : {
            model : {
                'Evo Shift 4G' : '7373KT'
            },
            vendor : {
                'HTC'       : 'APA',
                'Sprint'    : 'Sprint'
            }
        }
    },

    os : {
        windows : {
            version : {
                'ME'        : '4.90',
                'NT 3.11'   : 'NT3.51',
                'NT 4.0'    : 'NT4.0',
                '2000'      : 'NT 5.0',
                'XP'        : ['NT 5.1', 'NT 5.2'],
                'Vista'     : 'NT 6.0',
                '7'         : 'NT 6.1',
                '8'         : 'NT 6.2',
                '8.1'       : 'NT 6.3',
                '10'        : ['NT 6.4', 'NT 10.0'],
                'RT'        : 'ARM'
            }
        }
    }
};


//////////////
// Regex map
/////////////


var regexes = {

    browser : [[

        // Presto based
        /(opera\smini)\/([\w\.-]+)/i,                                       // Opera Mini
        /(opera\s[mobiletab]+).+version\/([\w\.-]+)/i,                      // Opera Mobi/Tablet
        /(opera).+version\/([\w\.]+)/i,                                     // Opera > 9.80
        /(opera)[\/\s]+([\w\.]+)/i                                          // Opera < 9.80
        ], [NAME, VERSION], [

        /(opios)[\/\s]+([\w\.]+)/i                                          // Opera mini on iphone >= 8.0
        ], [[NAME, 'Opera Mini'], VERSION], [

        /\s(opr)\/([\w\.]+)/i                                               // Opera Webkit
        ], [[NAME, 'Opera'], VERSION], [

        // Mixed
        /(kindle)\/([\w\.]+)/i,                                             // Kindle
        /(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?([\w\.]+)*/i,
                                                                            // Lunascape/Maxthon/Netfront/Jasmine/Blazer

        // Trident based
        /(avant\s|iemobile|slim|baidu)(?:browser)?[\/\s]?([\w\.]*)/i,
                                                                            // Avant/IEMobile/SlimBrowser/Baidu
        /(?:ms|\()(ie)\s([\w\.]+)/i,                                        // Internet Explorer

        // Webkit/KHTML based
        /(rekonq)\/([\w\.]+)*/i,                                            // Rekonq
        /(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser)\/([\w\.-]+)/i
                                                                            // Chromium/Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS/Bowser
        ], [NAME, VERSION], [

        /(trident).+rv[:\s]([\w\.]+).+like\sgecko/i                         // IE11
        ], [[NAME, 'IE'], VERSION], [

        /(edge)\/((\d+)?[\w\.]+)/i                                          // Microsoft Edge
        ], [NAME, VERSION], [

        /(yabrowser)\/([\w\.]+)/i                                           // Yandex
        ], [[NAME, 'Yandex'], VERSION], [

        /(puffin)\/([\w\.]+)/i                                              // Puffin
        ], [[NAME, 'Puffin'], VERSION], [

        /((?:[\s\/])uc?\s?browser|(?:juc.+)ucweb)[\/\s]?([\w\.]+)/i
                                                                            // UCBrowser
        ], [[NAME, 'UCBrowser'], VERSION], [

        /(comodo_dragon)\/([\w\.]+)/i                                       // Comodo Dragon
        ], [[NAME, /_/g, ' '], VERSION], [

        /(micromessenger)\/([\w\.]+)/i                                      // WeChat
        ], [[NAME, 'WeChat'], VERSION], [

        /(QQ)\/([\d\.]+)/i                                                  // QQ, aka ShouQ
        ], [NAME, VERSION], [

        /m?(qqbrowser)[\/\s]?([\w\.]+)/i                                    // QQBrowser
        ], [NAME, VERSION], [

        /xiaomi\/miuibrowser\/([\w\.]+)/i                                   // MIUI Browser
        ], [VERSION, [NAME, 'MIUI Browser']], [

        /;fbav\/([\w\.]+);/i                                                // Facebook App for iOS & Android
        ], [VERSION, [NAME, 'Facebook']], [

        /(headlesschrome) ([\w\.]+)/i                                       // Chrome Headless
        ], [VERSION, [NAME, 'Chrome Headless']], [

        /\swv\).+(chrome)\/([\w\.]+)/i                                      // Chrome WebView
        ], [[NAME, /(.+)/, '$1 WebView'], VERSION], [

        /((?:oculus|samsung)browser)\/([\w\.]+)/i
        ], [[NAME, /(.+(?:g|us))(.+)/, '$1 $2'], VERSION], [                // Oculus / Samsung Browser

        /android.+version\/([\w\.]+)\s+(?:mobile\s?safari|safari)*/i        // Android Browser
        ], [VERSION, [NAME, 'Android Browser']], [

        /(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?([\w\.]+)/i
                                                                            // Chrome/OmniWeb/Arora/Tizen/Nokia
        ], [NAME, VERSION], [

        /(dolfin)\/([\w\.]+)/i                                              // Dolphin
        ], [[NAME, 'Dolphin'], VERSION], [

        /((?:android.+)crmo|crios)\/([\w\.]+)/i                             // Chrome for Android/iOS
        ], [[NAME, 'Chrome'], VERSION], [

        /(coast)\/([\w\.]+)/i                                               // Opera Coast
        ], [[NAME, 'Opera Coast'], VERSION], [

        /fxios\/([\w\.-]+)/i                                                // Firefox for iOS
        ], [VERSION, [NAME, 'Firefox']], [

        /version\/([\w\.]+).+?mobile\/\w+\s(safari)/i                       // Mobile Safari
        ], [VERSION, [NAME, 'Mobile Safari']], [

        /version\/([\w\.]+).+?(mobile\s?safari|safari)/i                    // Safari & Safari Mobile
        ], [VERSION, NAME], [

        /webkit.+?(mobile\s?safari|safari)(\/[\w\.]+)/i                     // Safari < 3.0
        ], [NAME, [VERSION, mapper.str, maps.browser.oldsafari.version]], [

        /(konqueror)\/([\w\.]+)/i,                                          // Konqueror
        /(webkit|khtml)\/([\w\.]+)/i
        ], [NAME, VERSION], [

        // Gecko based
        /(navigator|netscape)\/([\w\.-]+)/i                                 // Netscape
        ], [[NAME, 'Netscape'], VERSION], [
        /(swiftfox)/i,                                                      // Swiftfox
        /(icedragon|iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?([\w\.\+]+)/i,
                                                                            // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
        /(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix)\/([\w\.-]+)/i,
                                                                            // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
        /(mozilla)\/([\w\.]+).+rv\:.+gecko\/\d+/i,                          // Mozilla

        // Other
        /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir)[\/\s]?([\w\.]+)/i,
                                                                            // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Sleipnir
        /(links)\s\(([\w\.]+)/i,                                            // Links
        /(gobrowser)\/?([\w\.]+)*/i,                                        // GoBrowser
        /(ice\s?browser)\/v?([\w\._]+)/i,                                   // ICE Browser
        /(mosaic)[\/\s]([\w\.]+)/i                                          // Mosaic
        ], [NAME, VERSION]

        /* /////////////////////
        // Media players BEGIN
        ////////////////////////

        , [

        /(apple(?:coremedia|))\/((\d+)[\w\._]+)/i,                          // Generic Apple CoreMedia
        /(coremedia) v((\d+)[\w\._]+)/i
        ], [NAME, VERSION], [

        /(aqualung|lyssna|bsplayer)\/((\d+)?[\w\.-]+)/i                     // Aqualung/Lyssna/BSPlayer
        ], [NAME, VERSION], [

        /(ares|ossproxy)\s((\d+)[\w\.-]+)/i                                 // Ares/OSSProxy
        ], [NAME, VERSION], [

        /(audacious|audimusicstream|amarok|bass|core|dalvik|gnomemplayer|music on console|nsplayer|psp-internetradioplayer|videos)\/((\d+)[\w\.-]+)/i,
                                                                            // Audacious/AudiMusicStream/Amarok/BASS/OpenCORE/Dalvik/GnomeMplayer/MoC
                                                                            // NSPlayer/PSP-InternetRadioPlayer/Videos
        /(clementine|music player daemon)\s((\d+)[\w\.-]+)/i,               // Clementine/MPD
        /(lg player|nexplayer)\s((\d+)[\d\.]+)/i,
        /player\/(nexplayer|lg player)\s((\d+)[\w\.-]+)/i                   // NexPlayer/LG Player
        ], [NAME, VERSION], [
        /(nexplayer)\s((\d+)[\w\.-]+)/i                                     // Nexplayer
        ], [NAME, VERSION], [

        /(flrp)\/((\d+)[\w\.-]+)/i                                          // Flip Player
        ], [[NAME, 'Flip Player'], VERSION], [

        /(fstream|nativehost|queryseekspider|ia-archiver|facebookexternalhit)/i
                                                                            // FStream/NativeHost/QuerySeekSpider/IA Archiver/facebookexternalhit
        ], [NAME], [

        /(gstreamer) souphttpsrc (?:\([^\)]+\)){0,1} libsoup\/((\d+)[\w\.-]+)/i
                                                                            // Gstreamer
        ], [NAME, VERSION], [

        /(htc streaming player)\s[\w_]+\s\/\s((\d+)[\d\.]+)/i,              // HTC Streaming Player
        /(java|python-urllib|python-requests|wget|libcurl)\/((\d+)[\w\.-_]+)/i,
                                                                            // Java/urllib/requests/wget/cURL
        /(lavf)((\d+)[\d\.]+)/i                                             // Lavf (FFMPEG)
        ], [NAME, VERSION], [

        /(htc_one_s)\/((\d+)[\d\.]+)/i                                      // HTC One S
        ], [[NAME, /_/g, ' '], VERSION], [

        /(mplayer)(?:\s|\/)(?:(?:sherpya-){0,1}svn)(?:-|\s)(r\d+(?:-\d+[\w\.-]+){0,1})/i
                                                                            // MPlayer SVN
        ], [NAME, VERSION], [

        /(mplayer)(?:\s|\/|[unkow-]+)((\d+)[\w\.-]+)/i                      // MPlayer
        ], [NAME, VERSION], [

        /(mplayer)/i,                                                       // MPlayer (no other info)
        /(yourmuze)/i,                                                      // YourMuze
        /(media player classic|nero showtime)/i                             // Media Player Classic/Nero ShowTime
        ], [NAME], [

        /(nero (?:home|scout))\/((\d+)[\w\.-]+)/i                           // Nero Home/Nero Scout
        ], [NAME, VERSION], [

        /(nokia\d+)\/((\d+)[\w\.-]+)/i                                      // Nokia
        ], [NAME, VERSION], [

        /\s(songbird)\/((\d+)[\w\.-]+)/i                                    // Songbird/Philips-Songbird
        ], [NAME, VERSION], [

        /(winamp)3 version ((\d+)[\w\.-]+)/i,                               // Winamp
        /(winamp)\s((\d+)[\w\.-]+)/i,
        /(winamp)mpeg\/((\d+)[\w\.-]+)/i
        ], [NAME, VERSION], [

        /(ocms-bot|tapinradio|tunein radio|unknown|winamp|inlight radio)/i  // OCMS-bot/tap in radio/tunein/unknown/winamp (no other info)
                                                                            // inlight radio
        ], [NAME], [

        /(quicktime|rma|radioapp|radioclientapplication|soundtap|totem|stagefright|streamium)\/((\d+)[\w\.-]+)/i
                                                                            // QuickTime/RealMedia/RadioApp/RadioClientApplication/
                                                                            // SoundTap/Totem/Stagefright/Streamium
        ], [NAME, VERSION], [

        /(smp)((\d+)[\d\.]+)/i                                              // SMP
        ], [NAME, VERSION], [

        /(vlc) media player - version ((\d+)[\w\.]+)/i,                     // VLC Videolan
        /(vlc)\/((\d+)[\w\.-]+)/i,
        /(xbmc|gvfs|xine|xmms|irapp)\/((\d+)[\w\.-]+)/i,                    // XBMC/gvfs/Xine/XMMS/irapp
        /(foobar2000)\/((\d+)[\d\.]+)/i,                                    // Foobar2000
        /(itunes)\/((\d+)[\d\.]+)/i                                         // iTunes
        ], [NAME, VERSION], [

        /(wmplayer)\/((\d+)[\w\.-]+)/i,                                     // Windows Media Player
        /(windows-media-player)\/((\d+)[\w\.-]+)/i
        ], [[NAME, /-/g, ' '], VERSION], [

        /windows\/((\d+)[\w\.-]+) upnp\/[\d\.]+ dlnadoc\/[\d\.]+ (home media server)/i
                                                                            // Windows Media Server
        ], [VERSION, [NAME, 'Windows']], [

        /(com\.riseupradioalarm)\/((\d+)[\d\.]*)/i                          // RiseUP Radio Alarm
        ], [NAME, VERSION], [

        /(rad.io)\s((\d+)[\d\.]+)/i,                                        // Rad.io
        /(radio.(?:de|at|fr))\s((\d+)[\d\.]+)/i
        ], [[NAME, 'rad.io'], VERSION]

        //////////////////////
        // Media players END
        ////////////////////*/

    ],

    cpu : [[

        /(?:(amd|x(?:(?:86|64)[_-])?|wow|win)64)[;\)]/i                     // AMD64
        ], [[ARCHITECTURE, 'amd64']], [

        /(ia32(?=;))/i                                                      // IA32 (quicktime)
        ], [[ARCHITECTURE, util$1.lowerize]], [

        /((?:i[346]|x)86)[;\)]/i                                            // IA32
        ], [[ARCHITECTURE, 'ia32']], [

        // PocketPC mistakenly identified as PowerPC
        /windows\s(ce|mobile);\sppc;/i
        ], [[ARCHITECTURE, 'arm']], [

        /((?:ppc|powerpc)(?:64)?)(?:\smac|;|\))/i                           // PowerPC
        ], [[ARCHITECTURE, /ower/, '', util$1.lowerize]], [

        /(sun4\w)[;\)]/i                                                    // SPARC
        ], [[ARCHITECTURE, 'sparc']], [

        /((?:avr32|ia64(?=;))|68k(?=\))|arm(?:64|(?=v\d+;))|(?=atmel\s)avr|(?:irix|mips|sparc)(?:64)?(?=;)|pa-risc)/i
                                                                            // IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
        ], [[ARCHITECTURE, util$1.lowerize]]
    ],

    device : [[

        /\((ipad|playbook);[\w\s\);-]+(rim|apple)/i                         // iPad/PlayBook
        ], [MODEL, VENDOR, [TYPE, TABLET]], [

        /applecoremedia\/[\w\.]+ \((ipad)/                                  // iPad
        ], [MODEL, [VENDOR, 'Apple'], [TYPE, TABLET]], [

        /(apple\s{0,1}tv)/i                                                 // Apple TV
        ], [[MODEL, 'Apple TV'], [VENDOR, 'Apple']], [

        /(archos)\s(gamepad2?)/i,                                           // Archos
        /(hp).+(touchpad)/i,                                                // HP TouchPad
        /(hp).+(tablet)/i,                                                  // HP Tablet
        /(kindle)\/([\w\.]+)/i,                                             // Kindle
        /\s(nook)[\w\s]+build\/(\w+)/i,                                     // Nook
        /(dell)\s(strea[kpr\s\d]*[\dko])/i                                  // Dell Streak
        ], [VENDOR, MODEL, [TYPE, TABLET]], [

        /(kf[A-z]+)\sbuild\/[\w\.]+.*silk\//i                               // Kindle Fire HD
        ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [
        /(sd|kf)[0349hijorstuw]+\sbuild\/[\w\.]+.*silk\//i                  // Fire Phone
        ], [[MODEL, mapper.str, maps.device.amazon.model], [VENDOR, 'Amazon'], [TYPE, MOBILE]], [

        /\((ip[honed|\s\w*]+);.+(apple)/i                                   // iPod/iPhone
        ], [MODEL, VENDOR, [TYPE, MOBILE]], [
        /\((ip[honed|\s\w*]+);/i                                            // iPod/iPhone
        ], [MODEL, [VENDOR, 'Apple'], [TYPE, MOBILE]], [

        /(blackberry)[\s-]?(\w+)/i,                                         // BlackBerry
        /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[\s_-]?([\w-]+)*/i,
                                                                            // BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Meizu/Motorola/Polytron
        /(hp)\s([\w\s]+\w)/i,                                               // HP iPAQ
        /(asus)-?(\w+)/i                                                    // Asus
        ], [VENDOR, MODEL, [TYPE, MOBILE]], [
        /\(bb10;\s(\w+)/i                                                   // BlackBerry 10
        ], [MODEL, [VENDOR, 'BlackBerry'], [TYPE, MOBILE]], [
                                                                            // Asus Tablets
        /android.+(transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+|nexus 7|padfone)/i
        ], [MODEL, [VENDOR, 'Asus'], [TYPE, TABLET]], [

        /(sony)\s(tablet\s[ps])\sbuild\//i,                                  // Sony
        /(sony)?(?:sgp.+)\sbuild\//i
        ], [[VENDOR, 'Sony'], [MODEL, 'Xperia Tablet'], [TYPE, TABLET]], [
        /android.+\s([c-g]\d{4}|so[-l]\w+)\sbuild\//i
        ], [MODEL, [VENDOR, 'Sony'], [TYPE, MOBILE]], [

        /\s(ouya)\s/i,                                                      // Ouya
        /(nintendo)\s([wids3u]+)/i                                          // Nintendo
        ], [VENDOR, MODEL, [TYPE, CONSOLE]], [

        /android.+;\s(shield)\sbuild/i                                      // Nvidia
        ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, CONSOLE]], [

        /(playstation\s[34portablevi]+)/i                                   // Playstation
        ], [MODEL, [VENDOR, 'Sony'], [TYPE, CONSOLE]], [

        /(sprint\s(\w+))/i                                                  // Sprint Phones
        ], [[VENDOR, mapper.str, maps.device.sprint.vendor], [MODEL, mapper.str, maps.device.sprint.model], [TYPE, MOBILE]], [

        /(lenovo)\s?(S(?:5000|6000)+(?:[-][\w+]))/i                         // Lenovo tablets
        ], [VENDOR, MODEL, [TYPE, TABLET]], [

        /(htc)[;_\s-]+([\w\s]+(?=\))|\w+)*/i,                               // HTC
        /(zte)-(\w+)*/i,                                                    // ZTE
        /(alcatel|geeksphone|lenovo|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]+)*/i
                                                                            // Alcatel/GeeksPhone/Lenovo/Nexian/Panasonic/Sony
        ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [

        /(nexus\s9)/i                                                       // HTC Nexus 9
        ], [MODEL, [VENDOR, 'HTC'], [TYPE, TABLET]], [

        /d\/huawei([\w\s-]+)[;\)]/i,
        /(nexus\s6p)/i                                                      // Huawei
        ], [MODEL, [VENDOR, 'Huawei'], [TYPE, MOBILE]], [

        /(microsoft);\s(lumia[\s\w]+)/i                                     // Microsoft Lumia
        ], [VENDOR, MODEL, [TYPE, MOBILE]], [

        /[\s\(;](xbox(?:\sone)?)[\s\);]/i                                   // Microsoft Xbox
        ], [MODEL, [VENDOR, 'Microsoft'], [TYPE, CONSOLE]], [
        /(kin\.[onetw]{3})/i                                                // Microsoft Kin
        ], [[MODEL, /\./g, ' '], [VENDOR, 'Microsoft'], [TYPE, MOBILE]], [

                                                                            // Motorola
        /\s(milestone|droid(?:[2-4x]|\s(?:bionic|x2|pro|razr))?(:?\s4g)?)[\w\s]+build\//i,
        /mot[\s-]?(\w+)*/i,
        /(XT\d{3,4}) build\//i,
        /(nexus\s6)/i
        ], [MODEL, [VENDOR, 'Motorola'], [TYPE, MOBILE]], [
        /android.+\s(mz60\d|xoom[\s2]{0,2})\sbuild\//i
        ], [MODEL, [VENDOR, 'Motorola'], [TYPE, TABLET]], [

        /hbbtv\/\d+\.\d+\.\d+\s+\([\w\s]*;\s*(\w[^;]*);([^;]*)/i            // HbbTV devices
        ], [[VENDOR, util$1.trim], [MODEL, util$1.trim], [TYPE, SMARTTV]], [

        /hbbtv.+maple;(\d+)/i
        ], [[MODEL, /^/, 'SmartTV'], [VENDOR, 'Samsung'], [TYPE, SMARTTV]], [

        /\(dtv[\);].+(aquos)/i                                              // Sharp
        ], [MODEL, [VENDOR, 'Sharp'], [TYPE, SMARTTV]], [

        /android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n\d+|sgh-t8[56]9|nexus 10))/i,
        /((SM-T\w+))/i
        ], [[VENDOR, 'Samsung'], MODEL, [TYPE, TABLET]], [                  // Samsung
        /smart-tv.+(samsung)/i
        ], [VENDOR, [TYPE, SMARTTV], MODEL], [
        /((s[cgp]h-\w+|gt-\w+|galaxy\snexus|sm-\w[\w\d]+))/i,
        /(sam[sung]*)[\s-]*(\w+-?[\w-]*)*/i,
        /sec-((sgh\w+))/i
        ], [[VENDOR, 'Samsung'], MODEL, [TYPE, MOBILE]], [

        /sie-(\w+)*/i                                                       // Siemens
        ], [MODEL, [VENDOR, 'Siemens'], [TYPE, MOBILE]], [

        /(maemo|nokia).*(n900|lumia\s\d+)/i,                                // Nokia
        /(nokia)[\s_-]?([\w-]+)*/i
        ], [[VENDOR, 'Nokia'], MODEL, [TYPE, MOBILE]], [

        /android\s3\.[\s\w;-]{10}(a\d{3})/i                                 // Acer
        ], [MODEL, [VENDOR, 'Acer'], [TYPE, TABLET]], [

        /android.+([vl]k\-?\d{3})\s+build/i                                 // LG Tablet
        ], [MODEL, [VENDOR, 'LG'], [TYPE, TABLET]], [
        /android\s3\.[\s\w;-]{10}(lg?)-([06cv9]{3,4})/i                     // LG Tablet
        ], [[VENDOR, 'LG'], MODEL, [TYPE, TABLET]], [
        /(lg) netcast\.tv/i                                                 // LG SmartTV
        ], [VENDOR, MODEL, [TYPE, SMARTTV]], [
        /(nexus\s[45])/i,                                                   // LG
        /lg[e;\s\/-]+(\w+)*/i,
        /android.+lg(\-?[\d\w]+)\s+build/i
        ], [MODEL, [VENDOR, 'LG'], [TYPE, MOBILE]], [

        /android.+(ideatab[a-z0-9\-\s]+)/i                                  // Lenovo
        ], [MODEL, [VENDOR, 'Lenovo'], [TYPE, TABLET]], [

        /linux;.+((jolla));/i                                               // Jolla
        ], [VENDOR, MODEL, [TYPE, MOBILE]], [

        /((pebble))app\/[\d\.]+\s/i                                         // Pebble
        ], [VENDOR, MODEL, [TYPE, WEARABLE]], [

        /android.+;\s(oppo)\s?([\w\s]+)\sbuild/i                            // OPPO
        ], [VENDOR, MODEL, [TYPE, MOBILE]], [

        /crkey/i                                                            // Google Chromecast
        ], [[MODEL, 'Chromecast'], [VENDOR, 'Google']], [

        /android.+;\s(glass)\s\d/i                                          // Google Glass
        ], [MODEL, [VENDOR, 'Google'], [TYPE, WEARABLE]], [

        /android.+;\s(pixel c)\s/i                                          // Google Pixel C
        ], [MODEL, [VENDOR, 'Google'], [TYPE, TABLET]], [

        /android.+;\s(pixel xl|pixel)\s/i                                   // Google Pixel
        ], [MODEL, [VENDOR, 'Google'], [TYPE, MOBILE]], [

        /android.+(\w+)\s+build\/hm\1/i,                                    // Xiaomi Hongmi 'numeric' models
        /android.+(hm[\s\-_]*note?[\s_]*(?:\d\w)?)\s+build/i,               // Xiaomi Hongmi
        /android.+(mi[\s\-_]*(?:one|one[\s_]plus|note lte)?[\s_]*(?:\d\w)?)\s+build/i    // Xiaomi Mi
        ], [[MODEL, /_/g, ' '], [VENDOR, 'Xiaomi'], [TYPE, MOBILE]], [

        /android.+;\s(m[1-5]\snote)\sbuild/i                                // Meizu Tablet
        ], [MODEL, [VENDOR, 'Meizu'], [TYPE, TABLET]], [

        /android.+a000(1)\s+build/i                                         // OnePlus
        ], [MODEL, [VENDOR, 'OnePlus'], [TYPE, MOBILE]], [

        /android.+[;\/]\s*(RCT[\d\w]+)\s+build/i                            // RCA Tablets
        ], [MODEL, [VENDOR, 'RCA'], [TYPE, TABLET]], [

        /android.+[;\/]\s*(Venue[\d\s]*)\s+build/i                          // Dell Venue Tablets
        ], [MODEL, [VENDOR, 'Dell'], [TYPE, TABLET]], [

        /android.+[;\/]\s*(Q[T|M][\d\w]+)\s+build/i                         // Verizon Tablet
        ], [MODEL, [VENDOR, 'Verizon'], [TYPE, TABLET]], [

        /android.+[;\/]\s+(Barnes[&\s]+Noble\s+|BN[RT])(V?.*)\s+build/i     // Barnes & Noble Tablet
        ], [[VENDOR, 'Barnes & Noble'], MODEL, [TYPE, TABLET]], [

        /android.+[;\/]\s+(TM\d{3}.*\b)\s+build/i                           // Barnes & Noble Tablet
        ], [MODEL, [VENDOR, 'NuVision'], [TYPE, TABLET]], [

        /android.+[;\/]\s*(zte)?.+(k\d{2})\s+build/i                        // ZTE K Series Tablet
        ], [[VENDOR, 'ZTE'], MODEL, [TYPE, TABLET]], [

        /android.+[;\/]\s*(gen\d{3})\s+build.*49h/i                         // Swiss GEN Mobile
        ], [MODEL, [VENDOR, 'Swiss'], [TYPE, MOBILE]], [

        /android.+[;\/]\s*(zur\d{3})\s+build/i                              // Swiss ZUR Tablet
        ], [MODEL, [VENDOR, 'Swiss'], [TYPE, TABLET]], [

        /android.+[;\/]\s*((Zeki)?TB.*\b)\s+build/i                         // Zeki Tablets
        ], [MODEL, [VENDOR, 'Zeki'], [TYPE, TABLET]], [

        /(android).+[;\/]\s+([YR]\d{2}x?.*)\s+build/i,
        /android.+[;\/]\s+(Dragon[\-\s]+Touch\s+|DT)(.+)\s+build/i          // Dragon Touch Tablet
        ], [[VENDOR, 'Dragon Touch'], MODEL, [TYPE, TABLET]], [

        /android.+[;\/]\s*(NS-?.+)\s+build/i                                // Insignia Tablets
        ], [MODEL, [VENDOR, 'Insignia'], [TYPE, TABLET]], [

        /android.+[;\/]\s*((NX|Next)-?.+)\s+build/i                         // NextBook Tablets
        ], [MODEL, [VENDOR, 'NextBook'], [TYPE, TABLET]], [

        /android.+[;\/]\s*(Xtreme\_?)?(V(1[045]|2[015]|30|40|60|7[05]|90))\s+build/i
        ], [[VENDOR, 'Voice'], MODEL, [TYPE, MOBILE]], [                    // Voice Xtreme Phones

        /android.+[;\/]\s*(LVTEL\-?)?(V1[12])\s+build/i                     // LvTel Phones
        ], [[VENDOR, 'LvTel'], MODEL, [TYPE, MOBILE]], [

        /android.+[;\/]\s*(V(100MD|700NA|7011|917G).*\b)\s+build/i          // Envizen Tablets
        ], [MODEL, [VENDOR, 'Envizen'], [TYPE, TABLET]], [

        /android.+[;\/]\s*(Le[\s\-]+Pan)[\s\-]+(.*\b)\s+build/i             // Le Pan Tablets
        ], [VENDOR, MODEL, [TYPE, TABLET]], [

        /android.+[;\/]\s*(Trio[\s\-]*.*)\s+build/i                         // MachSpeed Tablets
        ], [MODEL, [VENDOR, 'MachSpeed'], [TYPE, TABLET]], [

        /android.+[;\/]\s*(Trinity)[\-\s]*(T\d{3})\s+build/i                // Trinity Tablets
        ], [VENDOR, MODEL, [TYPE, TABLET]], [

        /android.+[;\/]\s*TU_(1491)\s+build/i                               // Rotor Tablets
        ], [MODEL, [VENDOR, 'Rotor'], [TYPE, TABLET]], [

        /android.+(KS(.+))\s+build/i                                        // Amazon Kindle Tablets
        ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [

        /android.+(Gigaset)[\s\-]+(Q.+)\s+build/i                           // Gigaset Tablets
        ], [VENDOR, MODEL, [TYPE, TABLET]], [

        /\s(tablet|tab)[;\/]/i,                                             // Unidentifiable Tablet
        /\s(mobile)(?:[;\/]|\ssafari)/i                                     // Unidentifiable Mobile
        ], [[TYPE, util$1.lowerize], VENDOR, MODEL], [

        /(android.+)[;\/].+build/i                                          // Generic Android Device
        ], [MODEL, [VENDOR, 'Generic']]


    /*//////////////////////////
        // TODO: move to string map
        ////////////////////////////

        /(C6603)/i                                                          // Sony Xperia Z C6603
        ], [[MODEL, 'Xperia Z C6603'], [VENDOR, 'Sony'], [TYPE, MOBILE]], [
        /(C6903)/i                                                          // Sony Xperia Z 1
        ], [[MODEL, 'Xperia Z 1'], [VENDOR, 'Sony'], [TYPE, MOBILE]], [

        /(SM-G900[F|H])/i                                                   // Samsung Galaxy S5
        ], [[MODEL, 'Galaxy S5'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
        /(SM-G7102)/i                                                       // Samsung Galaxy Grand 2
        ], [[MODEL, 'Galaxy Grand 2'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
        /(SM-G530H)/i                                                       // Samsung Galaxy Grand Prime
        ], [[MODEL, 'Galaxy Grand Prime'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
        /(SM-G313HZ)/i                                                      // Samsung Galaxy V
        ], [[MODEL, 'Galaxy V'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
        /(SM-T805)/i                                                        // Samsung Galaxy Tab S 10.5
        ], [[MODEL, 'Galaxy Tab S 10.5'], [VENDOR, 'Samsung'], [TYPE, TABLET]], [
        /(SM-G800F)/i                                                       // Samsung Galaxy S5 Mini
        ], [[MODEL, 'Galaxy S5 Mini'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
        /(SM-T311)/i                                                        // Samsung Galaxy Tab 3 8.0
        ], [[MODEL, 'Galaxy Tab 3 8.0'], [VENDOR, 'Samsung'], [TYPE, TABLET]], [

        /(T3C)/i                                                            // Advan Vandroid T3C
        ], [MODEL, [VENDOR, 'Advan'], [TYPE, TABLET]], [
        /(ADVAN T1J\+)/i                                                    // Advan Vandroid T1J+
        ], [[MODEL, 'Vandroid T1J+'], [VENDOR, 'Advan'], [TYPE, TABLET]], [
        /(ADVAN S4A)/i                                                      // Advan Vandroid S4A
        ], [[MODEL, 'Vandroid S4A'], [VENDOR, 'Advan'], [TYPE, MOBILE]], [

        /(V972M)/i                                                          // ZTE V972M
        ], [MODEL, [VENDOR, 'ZTE'], [TYPE, MOBILE]], [

        /(i-mobile)\s(IQ\s[\d\.]+)/i                                        // i-mobile IQ
        ], [VENDOR, MODEL, [TYPE, MOBILE]], [
        /(IQ6.3)/i                                                          // i-mobile IQ IQ 6.3
        ], [[MODEL, 'IQ 6.3'], [VENDOR, 'i-mobile'], [TYPE, MOBILE]], [
        /(i-mobile)\s(i-style\s[\d\.]+)/i                                   // i-mobile i-STYLE
        ], [VENDOR, MODEL, [TYPE, MOBILE]], [
        /(i-STYLE2.1)/i                                                     // i-mobile i-STYLE 2.1
        ], [[MODEL, 'i-STYLE 2.1'], [VENDOR, 'i-mobile'], [TYPE, MOBILE]], [

        /(mobiistar touch LAI 512)/i                                        // mobiistar touch LAI 512
        ], [[MODEL, 'Touch LAI 512'], [VENDOR, 'mobiistar'], [TYPE, MOBILE]], [

        /////////////
        // END TODO
        ///////////*/

    ],

    engine : [[

        /windows.+\sedge\/([\w\.]+)/i                                       // EdgeHTML
        ], [VERSION, [NAME, 'EdgeHTML']], [

        /(presto)\/([\w\.]+)/i,                                             // Presto
        /(webkit|trident|netfront|netsurf|amaya|lynx|w3m)\/([\w\.]+)/i,     // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m
        /(khtml|tasman|links)[\/\s]\(?([\w\.]+)/i,                          // KHTML/Tasman/Links
        /(icab)[\/\s]([23]\.[\d\.]+)/i                                      // iCab
        ], [NAME, VERSION], [

        /rv\:([\w\.]+).*(gecko)/i                                           // Gecko
        ], [VERSION, NAME]
    ],

    os : [[

        // Windows based
        /microsoft\s(windows)\s(vista|xp)/i                                 // Windows (iTunes)
        ], [NAME, VERSION], [
        /(windows)\snt\s6\.2;\s(arm)/i,                                     // Windows RT
        /(windows\sphone(?:\sos)*)[\s\/]?([\d\.\s]+\w)*/i,                  // Windows Phone
        /(windows\smobile|windows)[\s\/]?([ntce\d\.\s]+\w)/i
        ], [NAME, [VERSION, mapper.str, maps.os.windows.version]], [
        /(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i
        ], [[NAME, 'Windows'], [VERSION, mapper.str, maps.os.windows.version]], [

        // Mobile/Embedded OS
        /\((bb)(10);/i                                                      // BlackBerry 10
        ], [[NAME, 'BlackBerry'], VERSION], [
        /(blackberry)\w*\/?([\w\.]+)*/i,                                    // Blackberry
        /(tizen)[\/\s]([\w\.]+)/i,                                          // Tizen
        /(android|webos|palm\sos|qnx|bada|rim\stablet\sos|meego|contiki)[\/\s-]?([\w\.]+)*/i,
                                                                            // Android/WebOS/Palm/QNX/Bada/RIM/MeeGo/Contiki
        /linux;.+(sailfish);/i                                              // Sailfish OS
        ], [NAME, VERSION], [
        /(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]+)*/i                 // Symbian
        ], [[NAME, 'Symbian'], VERSION], [
        /\((series40);/i                                                    // Series 40
        ], [NAME], [
        /mozilla.+\(mobile;.+gecko.+firefox/i                               // Firefox OS
        ], [[NAME, 'Firefox OS'], VERSION], [

        // Console
        /(nintendo|playstation)\s([wids34portablevu]+)/i,                   // Nintendo/Playstation

        // GNU/Linux based
        /(mint)[\/\s\(]?(\w+)*/i,                                           // Mint
        /(mageia|vectorlinux)[;\s]/i,                                       // Mageia/VectorLinux
        /(joli|[kxln]?ubuntu|debian|[open]*suse|gentoo|(?=\s)arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk|linpus)[\/\s-]?(?!chrom)([\w\.-]+)*/i,
                                                                            // Joli/Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware
                                                                            // Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus
        /(hurd|linux)\s?([\w\.]+)*/i,                                       // Hurd/Linux
        /(gnu)\s?([\w\.]+)*/i                                               // GNU
        ], [NAME, VERSION], [

        /(cros)\s[\w]+\s([\w\.]+\w)/i                                       // Chromium OS
        ], [[NAME, 'Chromium OS'], VERSION],[

        // Solaris
        /(sunos)\s?([\w\.]+\d)*/i                                           // Solaris
        ], [[NAME, 'Solaris'], VERSION], [

        // BSD based
        /\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]+)*/i                   // FreeBSD/NetBSD/OpenBSD/PC-BSD/DragonFly
        ], [NAME, VERSION],[

        /(haiku)\s(\w+)/i                                                  // Haiku
        ], [NAME, VERSION],[

        /cfnetwork\/.+darwin/i,
        /ip[honead]+(?:.*os\s([\w]+)*\slike\smac|;\sopera)/i                // iOS
        ], [[VERSION, /_/g, '.'], [NAME, 'iOS']], [

        /(mac\sos\sx)\s?([\w\s\.]+\w)*/i,
        /(macintosh|mac(?=_powerpc)\s)/i                                    // Mac OS
        ], [[NAME, 'Mac OS'], [VERSION, /_/g, '.']], [

        // Other
        /((?:open)?solaris)[\/\s-]?([\w\.]+)*/i,                            // Solaris
        /(aix)\s((\d)(?=\.|\)|\s)[\w\.]*)*/i,                               // AIX
        /(plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos|openvms)/i,
                                                                            // Plan9/Minix/BeOS/OS2/AmigaOS/MorphOS/RISCOS/OpenVMS
        /(unix)\s?([\w\.]+)*/i                                              // UNIX
        ], [NAME, VERSION]
    ]
};


/////////////////
// Constructor
////////////////
/*
var Browser = function (name, version) {
    this[NAME] = name;
    this[VERSION] = version;
};
var CPU = function (arch) {
    this[ARCHITECTURE] = arch;
};
var Device = function (vendor, model, type) {
    this[VENDOR] = vendor;
    this[MODEL] = model;
    this[TYPE] = type;
};
var Engine = Browser;
var OS = Browser;
*/
var UAParser = function (uastring, extensions) {

    if (typeof uastring === 'object') {
        extensions = uastring;
        uastring = undefined;
    }

    if (!(this instanceof UAParser)) {
        return new UAParser(uastring, extensions).getResult();
    }

    var ua = uastring || ((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : EMPTY);
    var rgxmap = extensions ? util$1.extend(regexes, extensions) : regexes;
    //var browser = new Browser();
    //var cpu = new CPU();
    //var device = new Device();
    //var engine = new Engine();
    //var os = new OS();

    this.getBrowser = function () {
        var browser = { name: undefined, version: undefined };
        mapper.rgx.call(browser, ua, rgxmap.browser);
        browser.major = util$1.major(browser.version); // deprecated
        return browser;
    };
    this.getCPU = function () {
        var cpu = { architecture: undefined };
        mapper.rgx.call(cpu, ua, rgxmap.cpu);
        return cpu;
    };
    this.getDevice = function () {
        var device = { vendor: undefined, model: undefined, type: undefined };
        mapper.rgx.call(device, ua, rgxmap.device);
        return device;
    };
    this.getEngine = function () {
        var engine = { name: undefined, version: undefined };
        mapper.rgx.call(engine, ua, rgxmap.engine);
        return engine;
    };
    this.getOS = function () {
        var os = { name: undefined, version: undefined };
        mapper.rgx.call(os, ua, rgxmap.os);
        return os;
    };
    this.getResult = function () {
        return {
            ua      : this.getUA(),
            browser : this.getBrowser(),
            engine  : this.getEngine(),
            os      : this.getOS(),
            device  : this.getDevice(),
            cpu     : this.getCPU()
        };
    };
    this.getUA = function () {
        return ua;
    };
    this.setUA = function (uastring) {
        ua = uastring;
        //browser = new Browser();
        //cpu = new CPU();
        //device = new Device();
        //engine = new Engine();
        //os = new OS();
        return this;
    };
    return this;
};

UAParser.VERSION = LIBVERSION;
UAParser.BROWSER = {
    NAME    : NAME,
    MAJOR   : MAJOR, // deprecated
    VERSION : VERSION
};
UAParser.CPU = {
    ARCHITECTURE : ARCHITECTURE
};
UAParser.DEVICE = {
    MODEL   : MODEL,
    VENDOR  : VENDOR,
    TYPE    : TYPE,
    CONSOLE : CONSOLE,
    MOBILE  : MOBILE,
    SMARTTV : SMARTTV,
    TABLET  : TABLET,
    WEARABLE: WEARABLE,
    EMBEDDED: EMBEDDED
};
UAParser.ENGINE = {
    NAME    : NAME,
    VERSION : VERSION
};
UAParser.OS = {
    NAME    : NAME,
    VERSION : VERSION
};
//UAParser.Utils = util;

///////////
// Export
//////////

window.UAParser = UAParser;

// jQuery/Zepto specific (optional)
// Note:
//   In AMD env the global scope should be kept clean, but jQuery is an exception.
//   jQuery always exports to global scope, unless jQuery.noConflict(true) is used,
//   and we should catch that.
var $$1 = window && (window.jQuery || window.Zepto);
if (typeof $$1 !== UNDEF_TYPE) {
    var parser = new UAParser();
    $$1.ua = parser.getResult();
    $$1.ua.get = function () {
        return parser.getUA();
    };
    $$1.ua.set = function (uastring) {
        parser.setUA(uastring);
        var result = parser.getResult();
        for (var prop in result) {
            $$1.ua[prop] = result[prop];
        }
    };
}

//  commonjsHelpers

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var jsUuid = createCommonjsModule(function (module) {
// node_modules/js-uuid/js-uuid.js
// Written by Robert Kieffer – https://github.com/broofa/node-uuid
// MIT License - http://opensource.org/licenses/mit-license.php
// The wrapped node-uuid library is at version 1.4.7

function UUID () {

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng, _mathRNG, _whatwgRNG;

  // Allow for MSIE11 msCrypto
  var _crypto = window.crypto || window.msCrypto;

  if (!_rng && _crypto && _crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    try {
      var _rnds8 = new Uint8Array(16);
      _whatwgRNG = _rng = function whatwgRNG() {
        _crypto.getRandomValues(_rnds8);
        return _rnds8;
      };
      _rng();
    } catch(e) {}
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var  _rnds = new Array(16);
    _mathRNG = _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) { r = Math.random() * 0x100000000; }
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
    if ('undefined' !== typeof console && console.warn) {
      console.warn('[SECURITY] node-uuid: crypto not usable, falling back to insecure Math.random()');
    }
  }

  // Buffer class to use
  var BufferClass = ('function' === typeof Buffer) ? Buffer : Array;

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // **`parse()` - Parse a UUID into it's component bytes**
  function parse(s, buf, offset) {
    var i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
      if (ii < 16) { // Don't overflow!
        buf[i + ii++] = _hexToByte[oct];
      }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
      buf[i + ii++] = 0;
    }

    return buf;
  }

  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
  function unparse(buf, offset) {
    var i = offset || 0, bth = _byteToHex;
    return  bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
  }

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  // random #'s we need to init node and clockseq
  var _seedBytes = _rng();

  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
  var _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
  ];

  // Per 4.2.2, randomize (14 bit) clockseq
  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

  // Previous uuid creation time
  var _lastMSecs = 0, _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};

    var clockseq = (options.clockseq != null) ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = (options.msecs != null) ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = (options.nsecs != null) ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    var node = options.node || _nodeId;
    for (var n = 0; n < 6; n++) {
      b[i + n] = node[n];
    }

    return buf ? buf : unparse(b);
  }

  // **`v4()` - Generate random UUID**

  // See https://github.com/broofa/node-uuid for API details
  function v4(options, buf, offset) {
    // Deprecated - 'format' argument, as supported in v1.2
    var i = buf && offset || 0;

    if (typeof(options) === 'string') {
      buf = (options === 'binary') ? new BufferClass(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ii++) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || unparse(rnds);
  }

  // Export public API
  var uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;
  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;
  uuid._rng = _rng;
  uuid._mathRNG = _mathRNG;
  uuid._whatwgRNG = _whatwgRNG;

  return uuid;
}

// check for Module/AMD support, otherwise call the uuid function to setup the angular module.
if ('object' !== 'undefined' && module.exports) {
  module.exports = new UUID();

} else if (typeof undefined !== 'undefined' && undefined.amd) {
  // AMD. Register as an anonymous module.
  undefined (function() {
    return new UUID();
  });
  
} else {
  window.uuid = UUID();
}
});

// node_modules/hanzo-analytics/lib/hanzo-analytics.mjs

// node_modules/es-tostring/index.mjs
var toString$1 = function(obj) {
  return Object.prototype.toString.call(obj)
};

// node_modules/es-is/number.js
// Generated by CoffeeScript 1.12.5
var isNumber$2;

var isNumber$1$1 = isNumber$2 = function(value) {
  return toString$1(value) === '[object Number]';
};

// node_modules/es-object-assign/lib/es-object-assign.mjs
// src/index.coffee
var getOwnSymbols$1;
var objectAssign$1;
var shouldUseNative$1;
var toObject$1;
var slice$1 = [].slice;

getOwnSymbols$1 = Object.getOwnPropertySymbols;

toObject$1 = function(val) {
  if (val === null || val === void 0) {
    throw new TypeError('Object.assign cannot be called with null or undefined');
  }
  return Object(val);
};

shouldUseNative$1 = function() {
  var i, j, k, len, letter, order2, ref, test1, test2, test3;
  try {
    if (!Object.assign) {
      return false;
    }
    test1 = new String('abc');
    test1[5] = 'de';
    if (Object.getOwnPropertyNames(test1)[0] === '5') {
      return false;
    }
    test2 = {};
    for (i = j = 0; j <= 9; i = ++j) {
      test2['_' + String.fromCharCode(i)] = i;
    }
    order2 = Object.getOwnPropertyNames(test2).map(function(n) {
      return test2[n];
    });
    if (order2.join('') !== '0123456789') {
      return false;
    }
    test3 = {};
    ref = 'abcdefghijklmnopqrst'.split('');
    for (k = 0, len = ref.length; k < len; k++) {
      letter = ref[k];
      test3[letter] = letter;
    }
    if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};

var index$1$1 = objectAssign$1 = (function() {
  if (shouldUseNative$1()) {
    return Object.assign;
  }
  return function() {
    var from, j, k, key, len, len1, ref, source, sources, symbol, target, to;
    target = arguments[0], sources = 2 <= arguments.length ? slice$1.call(arguments, 1) : [];
    to = toObject$1(target);
    for (j = 0, len = sources.length; j < len; j++) {
      source = sources[j];
      from = Object(source);
      for (key in from) {
        if (Object.prototype.hasOwnProperty.call(from, key)) {
          to[key] = from[key];
        }
      }
      if (getOwnSymbols$1) {
        ref = getOwnSymbols$1(from);
        for (k = 0, len1 = ref.length; k < len1; k++) {
          symbol = ref[k];
          if (Object.prototype.propIsEnumerable.call(from, symbol)) {
            to[symbol] = from[symbol];
          }
        }
      }
    }
    return to;
  };
})();

// node_modules/es-cookies/lib/cookies.mjs
// src/cookies.coffee
var Cookies$2;

Cookies$2 = (function() {
  function Cookies(defaults) {
    this.defaults = defaults != null ? defaults : {};
    this.get = (function(_this) {
      return function(key) {
        return _this.read(key);
      };
    })(this);
    this.getJSON = (function(_this) {
      return function(key) {
        try {
          return JSON.parse(_this.read(key));
        } catch (error) {
          return {};
        }
      };
    })(this);
    this.remove = (function(_this) {
      return function(key, attrs) {
        return _this.write(key, '', index$1$1({
          expires: -1
        }, attrs));
      };
    })(this);
    this.set = (function(_this) {
      return function(key, value, attrs) {
        return _this.write(key, value, attrs);
      };
    })(this);
  }

  Cookies.prototype.read = function(key) {
    var cookie, cookies, i, kv, len, name, parts, rdecode, result;
    if (!key) {
      result = {};
    }
    cookies = document.cookie ? document.cookie.split('; ') : [];
    rdecode = /(%[0-9A-Z]{2})+/g;
    for (i = 0, len = cookies.length; i < len; i++) {
      kv = cookies[i];
      parts = kv.split('=');
      cookie = parts.slice(1).join('=');
      if (cookie.charAt(0) === '"') {
        cookie = cookie.slice(1, -1);
      }
      try {
        name = parts[0].replace(rdecode, decodeURIComponent);
        cookie = cookie.replace(rdecode, decodeURIComponent);
        if (key === name) {
          return cookie;
        }
        if (!key) {
          result[name] = cookie;
        }
      } catch (error) {
      }
    }
    return result;
  };

  Cookies.prototype.write = function(key, value, attrs) {
    var attr, expires, name, result, strAttrs;
    attrs = index$1$1({
      path: '/'
    }, this.defaults, attrs);
    if (isNumber$1$1(attrs.expires)) {
      expires = new Date;
      expires.setMilliseconds(expires.getMilliseconds() + attrs.expires * 864e+5);
      attrs.expires = expires;
    }
    attrs.expires = attrs.expires ? attrs.expires.toUTCString() : '';
    try {
      result = JSON.stringify(value);
      if (/^[\{\[]/.test(result)) {
        value = result;
      }
    } catch (error) {
    }
    value = encodeURIComponent(String(value)).replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
    key = encodeURIComponent(String(key));
    key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
    key = key.replace(/[\(\)]/g, escape);
    strAttrs = '';
    for (name in attrs) {
      attr = attrs[name];
      if (!attr) {
        continue;
      }
      strAttrs += '; ' + name;
      if (attr === true) {
        continue;
      }
      strAttrs += '=' + attr;
    }
    return document.cookie = key + '=' + value + strAttrs;
  };

  return Cookies;

})();

var Cookies$1$1 = Cookies$2;

// src/index.coffee
var index$4 = new Cookies$1$1();

// src/index.coffee
var HanzoAnalytics;
var expirationTime;
var newRecord;
var qs;
var sessionIdCookie;
var userCookie;
var uuidCookie;
var uuidExpirationTime;

HanzoAnalytics = function() {};

expirationTime = 1800;

uuidExpirationTime = 60 * 60 * 24 * 365 * 2;

userCookie = 'hzo';

qs = function(qstr) {
  var a, b, i, j, query, ref;
  if (!qstr) {
    return {};
  }
  query = {};
  a = qstr.split('&');
  for (i = j = 0, ref = a.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
    b = a[i].split('=');
    query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
  }
  return query;
};

if (typeof window !== "undefined" && window !== null) {
  if ((window.console == null) || (window.console.log == null)) {
    window.console.log = function() {};
  }
  uuidCookie = '__cs-uid';
  sessionIdCookie = '__cs-sid';
  newRecord = {
    pageId: '',
    lastPageId: '',
    pageViewId: '',
    lastPageViewId: '',
    count: 0,
    queue: []
  };
  (function() {
    var cachedDomain, cachedPageId, cachedPageViewId, cachedSessionId, cachedUuid, flush, getDomain, getQueryParams, getRecord, getSessionId, getTimestamp, getUserIdFromJWT, getUuid, next, refreshSession, saveRecord, updatePage;
    getUserIdFromJWT = function(jwt) {
      var data, parts, str;
      if (!jwt || typeof jwt !== 'string') {
        return null;
      }
      parts = jwt.split('.');
      if (!parts[1]) {
        return null;
      }
      str = atob(parts[1]);
      try {
        data = JSON.parsestr;
      } catch (error) {
        return null;
      }
      return data['user-id'];
    };
    getTimestamp = function() {
      return (new Date).getMilliseconds();
    };
    cachedDomain = '';
    getDomain = function() {
      if (!cachedDomain) {
        cachedDomain = document.domain !== 'localhost' ? '.' + document.domain : '';
      }
      return cachedDomain;
    };
    getRecord = function() {
      var ref;
      return (ref = index$3.get(getSessionId())) != null ? ref : Object.assign({}, newRecord);
    };
    saveRecord = function(record) {
      return index$3.set(getSessionId(), record);
    };
    cachedUuid = '';
    getUuid = function() {
      var uuid;
      if (cachedUuid) {
        return cachedUuid;
      }
      uuid = index$4.get(uuidCookie);
      if (!uuid) {
        uuid = jsUuid.v4();
        index$4.set(uuidCookie, uuid, {
          domain: getDomain(),
          expires: uuidExpirationTime
        });
      }
      cachedUuid = uuid;
      return uuid;
    };
    cachedSessionId = '';
    getSessionId = function() {
      var record, sessionId;
      if (cachedSessionId) {
        return cachedSessionId;
      }
      sessionId = index$4.get(sessionIdCookie);
      if (!sessionId) {
        sessionId = getUuid() + '_' + getTimestamp();
        index$4.set(sessionIdCookie, sessionId, {
          domain: getDomain(),
          expires: expirationTime
        });
        cachedSessionId = sessionId;
        record = getRecord();
        record.count = 0;
        saveRecord(record);
      }
      cachedSessionId = sessionId;
      return sessionId;
    };
    refreshSession = function() {
      var sessionId;
      sessionId = index$4.get(sessionIdCookie);
      return index$4.set(sessionIdCookie, sessionId, {
        domain: '.' + document.domain,
        expires: expirationTime
      });
    };
    cachedPageId = '';
    cachedPageViewId = '';
    getQueryParams = function() {
      var ref, ref1;
      return qs((ref = (ref1 = window.location.search) != null ? ref1 : window.location.hash.split('?')[1]) != null ? ref : '');
    };
    updatePage = function() {
      var newPageId, record, ua;
      record = getRecord();
      newPageId = window.location.pathname + window.location.hash;
      if (newPageId !== record.pageId) {
        cachedPageId = newPageId;
        cachedPageViewId = cachedPageId + '_' + getTimestamp();
        record = getRecord();
        record.lastPageId = record.pageId;
        record.lastPageViewId = record.pageViewId;
        record.pageId = cachedPageId;
        record.pageViewId = cachedPageViewId;
        saveRecord(record);
        ua = window.navigator.userAgent;
        return HanzoAnalytics('PageView', {
          lastPageId: record.lastPageId,
          lastPageViewId: record.lastPageViewId,
          url: window.location.href,
          protocol: document.location.protocol,
          domain: document.domain,
          referrer: document.referrer,
          queryParams: getQueryParams(),
          ua: UAParser(ua)
        });
      }
    };
    HanzoAnalytics = function(name, data) {
      var r, record, userId;
      record = getRecord();
      r = {
        uuid: getUuid(),
        userId: getUserIdFromJWT(),
        ga: index$4.get('_ga'),
        gid: index$4.get('_gid'),
        fr: index$4.get('fr'),
        sessionId: getSessionId(),
        pageId: record.pageId,
        pageViewId: record.pageViewId,
        timestamp: new Date(),
        event: name,
        referrer: document.referrer,
        data: data,
        count: record.count
      };
      userId = index$4.get(userCookie);
      if (userId) {
        r.userId = userId;
      }
      record.queue.push(r);
      record.count++;
      saveRecord(record);
      return refreshSession();
    };
    flush = function() {
      var data, record, retry, url, xhr;
      record = getRecord();
      if (record.queue.length > 0) {
        HanzoAnalytics.onFlush(record);
        retry = 0;
        data = JSON.stringify(record.queue);
        url = HanzoAnalytics.url + HanzoAnalytics.orgId;
        xhr = new XMLHttpRequest;
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (xhr.status !== 204) {
              retry++;
              if (retry === 3) {
                return console.log('HanzoAnalytics: failed to send', JSON.parse(data));
              } else {
                xhr.open('POST', url);
                xhr.send(data);
                return console.log('HanzoAnalytics: retrying send x' + retry);
              }
            }
          }
        };
        xhr.open('POST', url);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(data);
        record.queue.length = 0;
        return saveRecord(record);
      }
    };
    window.addEventListener('hashchange', updatePage);
    window.addEventListener('popstate', updatePage);
    window.addEventListener('beforeunload', function() {
      return HanzoAnalytics('PageChange');
    });
    next = function() {
      return setTimeout(function() {
        flush();
        return next();
      }, HanzoAnalytics.flushRate || 200);
    };
    setTimeout(function() {
      updatePage();
      flush();
      return next();
    }, 1);
    window.HanzoAnalytics = HanzoAnalytics;
    return window.ha = HanzoAnalytics;
  })();
}

HanzoAnalytics.url = 'https://a.hanzo.io/';

HanzoAnalytics.onFlush = function() {};

HanzoAnalytics.flushRate = 1000;

HanzoAnalytics.orgId = '';

var HanzoAnalytics$1 = HanzoAnalytics;

// src/utils.coffee
var debounce;

debounce = function(func, wait, immediate) {
  var timeout;
  if (wait == null) {
    wait = 10;
  }
  if (immediate == null) {
    immediate = false;
  }
  timeout = null;
  return function() {
    var args, callNow, context, later;
    context = this;
    args = arguments;
    later = function() {
      timeout = null;
      if (!immediate) {
        return func.apply(context, args);
      }
    };
    callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      return func.apply(context, args);
    }
  };
};

// src/_content-annotator.coffee
var Annotator, get$targetAndSelector, getScrollPosition, getSelector, isElementInViewport;

isElementInViewport = function(rect) {
  return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
};

getScrollPosition = function() {
  var isCSS1Compat, supportPageOffset, x, y;
  supportPageOffset = window.pageXOffset !== void 0;
  isCSS1Compat = (document.compatMode || "") === "CSS1Compat";
  x = supportPageOffset ? window.pageXOffset : isCSS1Compat ? document.documentElement.scrollLeft : document.body.scrollLeft;
  y = supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;
  return [x, y];
};

get$targetAndSelector = function(e) {
  var $parent, $target, _selector, target;
  $target = _default(e.target);
  if (!$target.is('[itemscope]')) {
    $parent = $target.closest('[itemscope]');
    if ($parent[0]) {
      $target = $parent;
    }
  }
  target = $target[0];
  _selector = getSelector(target);
  return [$target, _selector];
};

getSelector = function(el) {
  var $el, _selector, clas, id, selector, selectors;
  $el = _default(el);
  selector = el.tagName;
  id = $el.attr('id');
  if (id) {
    selector += '#' + id;
  }
  clas = $el.attr('class');
  if (clas) {
    selector += '.' + clas.replace(/\s/g, '.');
  }
  selectors = [selector];
  _selector = el._selector;
  if (_selector == null) {
    $el.parents().each(function(i, p) {
      var $p;
      $p = _default(p);
      selector = p.tagName;
      id = $p.attr('id');
      if (id) {
        selector += '#' + id;
      }
      clas = $p.attr('class');
      if (clas) {
        selector += '.' + clas.replace(/\s/g, '.');
      }
      return selectors.push(selector);
    });
    _selector = selectors.reverse().join(' > ');
    el._selector = _selector;
  }
  return _selector;
};

Annotator = (function() {
  Annotator.prototype.root = null;

  function Annotator(root) {
    var $link, $node, $p, $root, addedLinkEls, content, json, level, link, node, nodes, p, text, textContent, topLevel, written;
    this.root = root != null ? root : _default(document.createElement('DIV'));
    addedLinkEls = [];
    $root = _default(this.root);
    json = {
      '@type': 'WebsiteSection',
      type: this.tag,
      id: $root.attr('id'),
      "class": $root.attr('class'),
      content: []
    };
    $root.attr('itemscope', '').attr('itemtype', 'WebsiteSection');
    $root.prepend('<meta itemprop="type" content="' + this.tag + '"/>');
    if ($root.attr('id')) {
      $root.prepend('<meta itemprop="id" content="' + $root.attr('id') + '"/>');
    }
    if ($root.attr('class')) {
      $root.prepend('<meta itemprop="class" content="' + $root.attr('class') + '"/>');
    }
    content = {
      '@type': 'WebsiteContent',
      content: []
    };
    written = false;
    topLevel = 5;
    $root.find('h1, h2, h3, h4, small').each(function(i, node) {
      switch (node.tagName) {
        case 'H1':
          topLevel = Math.min(1, topLevel);
          break;
        case 'H2':
          topLevel = Math.min(2, topLevel);
          break;
        case 'H3':
          topLevel = Math.min(3, topLevel);
          break;
        case 'H4':
          topLevel = Math.min(4, topLevel);
          break;
        case 'SMALL':
          topLevel = Math.min(6, topLevel);
          break;
        default:
          topLevel = Math.min(5, topLevel);
      }
      return console.log('tag', node.tagName, topLevel);
    });
    $root.find('a[href]').each(function(i, node) {
      var $node;
      $node = _default(node);
      $node.attr('itemscope', '').attr('itemtype', 'WebsiteLink').attr('itemprop', 'url');
      $node.prepend('<meta itemprop="text" content="' + $node.text() + '"/>');
      if ($node.attr('id')) {
        $node.prepend('<meta itemprop="id" content="' + $node.attr('id') + '"/>');
      }
      if ($node.attr('class')) {
        return $node.prepend('<meta itemprop="class" content="' + $node.attr('class') + '"/>');
      }
    });
    nodes = document.createTreeWalker(this.root, NodeFilter.SHOW_TEXT, null, null);
    while (node = nodes.nextNode()) {
      p = node.parentNode;
      text = node.nodeValue;
      $p = _default(p);
      if ($p.closest('[data-analytics-ignore]')[0]) {
        continue;
      }
      $node = _default(node);
      if ($p.attr('itemtype') === 'WebsiteLink') {
        if (!addedLinkEls.includes(p)) {
          content.content.push({
            '@type': 'WebsiteLink',
            text: $p.text(),
            id: $p.attr('id'),
            "class": $p.attr('class'),
            element: p
          });
          addedLinkEls.push(p);
        }
        continue;
      }
      if ((link = ($p.closest('[itemtype="WebsiteLink"]')[0])) != null) {
        $link = _default(link);
        if (!addedLinkEls.includes(link)) {
          content.content.push({
            '@type': 'WebsiteLink',
            text: $link.text(),
            id: $link.attr('id'),
            "class": $link.attr('class'),
            element: link
          });
          addedLinkEls.push(link);
        }
        continue;
      }
      if (/^\s+$/.test(text)) {
        continue;
      }
      $p.attr('itemscope', '').attr('itemtype', 'WebsiteText').attr('itemprop', 'text');
      if ($p.attr('id')) {
        $p.prepend('<meta itemprop="id" content="' + $node.attr('id') + '"/>');
      }
      if ($p.attr('class')) {
        $p.prepend('<meta itemprop="class" content="' + $node.attr('class') + '"/>');
      }
      level = 5;
      textContent = {
        '@type': 'WebsiteText',
        text: text,
        id: $p.attr('id'),
        "class": $p.attr('class'),
        element: p
      };
      switch (p.tagName) {
        case 'H1':
          level = 1;
          textContent.level = 'h1';
          break;
        case 'H2':
          level = 2;
          textContent.level = 'h2';
          break;
        case 'H3':
          level = 3;
          textContent.level = 'h3';
          break;
        case 'H4':
          level = 4;
          textContent.level = 'h4';
          break;
        case 'SMALL':
          level = 6;
          textContent.level = 'small';
          break;
        default:
          level = 5;
          textContent.level = 'p';
      }
      content.content.push(textContent);
      $p.prepend('<meta itemprop="level" content="' + textContent.level + '"/>');
      if (level === topLevel && written) {
        json.content.push(content);
        content = {
          '@type': 'WebsiteContent',
          content: []
        };
        written = false;
      }
      written = true;
    }
    if (written) {
      json.content.push(content);
    }
    console.log('content', json);
    this.bindEvents();
  }

  Annotator.prototype.bindEvents = function() {
    var $root, scrollFn;
    $root = _default(this.root);
    $root.on('mouseenter', '[itemscope]', function(e) {
      var $target, _selector, rect, ref, x, y;
      ref = get$targetAndSelector(e), $target = ref[0], _selector = ref[1];
      x = getScrollPosition[0], y = getScrollPosition[1];
      rect = e.target.getBoundingClientRect();
      return HanzoAnalytics$1('MouseEnter', {
        selector: _selector,
        type: $target.attr('itemtype'),
        mouseX: e.clientX,
        mouseY: e.clientY,
        scrollX: x,
        scrollY: y,
        contentX: rect.left,
        contentY: rect.top,
        viewportX: document.documentElement.clientHeight,
        viewportY: document.documentElement.clientWidth
      });
    });
    $root.on('mouseleave', '[itemscope]', function(e) {
      var $target, _selector, rect, ref, x, y;
      ref = get$targetAndSelector(e), $target = ref[0], _selector = ref[1];
      x = getScrollPosition[0], y = getScrollPosition[1];
      rect = e.target.getBoundingClientRect();
      return HanzoAnalytics$1('MouseLeave', {
        selector: _selector,
        type: $target.attr('itemtype'),
        mouseX: e.clientX,
        mouseY: e.clientY,
        scrollX: x,
        scrollY: y,
        contentX: rect.left,
        contentY: rect.top,
        viewportX: document.documentElement.clientHeight,
        viewportY: document.documentElement.clientWidth
      });
    });
    scrollFn = debounce((function(_this) {
      return function(e) {
        var $visible;
        $visible = _default(_this.root).find('[itemscope]:visible');
        return $visible.each(function(i, el) {
          var _selector, rect, x, y;
          rect = el.getBoundingClientRect();
          if (!el._inViewport && isElementInViewport(rect)) {
            _selector = getSelector(el);
            x = getScrollPosition[0], y = getScrollPosition[1];
            console.log(_selector, 'entered viewport');
            HanzoAnalytics$1('ViewportEnter', {
              selector: _selector,
              type: _default(el).attr('itemtype'),
              mouseX: e.clientX,
              mouseY: e.clientY,
              scrollX: x,
              scrollY: y,
              contentX: rect.left,
              contentY: rect.top,
              viewportX: document.documentElement.clientHeight,
              viewportY: document.documentElement.clientWidth
            });
            return el._inViewport = true;
          } else if (el._inViewport && !isElementInViewport(rect)) {
            _selector = getSelector(el);
            x = getScrollPosition[0], y = getScrollPosition[1];
            console.log(_selector, 'left viewport');
            HanzoAnalytics$1('ViewportLeave', {
              selector: _selector,
              type: _default(el).attr('itemtype'),
              mouseX: e.clientX,
              mouseY: e.clientY,
              scrollX: x,
              scrollY: y,
              contentX: rect.left,
              contentY: rect.top,
              viewportX: document.documentElement.clientHeight,
              viewportY: document.documentElement.clientWidth
            });
            return el._inViewport = false;
          }
        });
      };
    })(this), 10, true);
    return _default(window).on('DOMContentLoaded load resize scroll', scrollFn);
  };

  return Annotator;

})();

var Annotator$1 = Annotator;

// src/hero.coffee
var Hero,
  extend$6 = function(child, parent) { for (var key in parent) { if (hasProp$6.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp$6 = {}.hasOwnProperty;

Hero = (function(superClass) {
  extend$6(Hero, superClass);

  function Hero() {
    Hero.__super__.constructor.apply(this, arguments);
  }

  return Hero;

})(Annotator$1);

var Hero$1 = Hero;

// src/block.coffee
var Block,
  extend$7 = function(child, parent) { for (var key in parent) { if (hasProp$7.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp$7 = {}.hasOwnProperty;

Block = (function(superClass) {
  extend$7(Block, superClass);

  function Block() {
    Block.__super__.constructor.apply(this, arguments);
  }

  return Block;

})(Annotator$1);

var Block$1 = Block;

// src/cta.coffee
var CTA,
  extend$8 = function(child, parent) { for (var key in parent) { if (hasProp$8.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp$8 = {}.hasOwnProperty;

CTA = (function(superClass) {
  extend$8(CTA, superClass);

  function CTA() {
    CTA.__super__.constructor.apply(this, arguments);
  }

  return CTA;

})(Annotator$1);

// src/animate.coffee
var triggerDist;

triggerDist = 40;

_default.fn.extend = function(obj) {
  return _default.extend(_default.fn, obj);
};

_default.fn.extend({
  animateCss: function(animationName, callback) {
    var animationEnd;
    animationEnd = (function(el) {
      var animations, t;
      animations = {
        animation: 'animationend',
        OAnimation: 'oAnimationEnd',
        MozAnimation: 'mozAnimationEnd',
        WebkitAnimation: 'webkitAnimationEnd'
      };
      for (t in animations) {
        if (el.style[t] !== void 0) {
          return animations[t];
        }
      }
    })(document.createElement('div'));
    this.addClass('animated ' + animationName).one(animationEnd, function() {
      _default(this).removeClass('animated ' + animationName);
      if (typeof callback === 'function') {
        callback();
      }
    });
    return this;
  }
});

_default(function() {
  var $scrollableArea, $window, fn;
  fn = function() {
    var height, ref, ref1, width;
    width = (ref = Math.max(document.documentElement.clientWidth, window.innerWidth)) != null ? ref : 0;
    height = (ref1 = Math.max(document.documentElement.clientHeight, window.innerHeight)) != null ? ref1 : 0;
    _default('[data-animate-in]:not(.animated-in)').each(function() {
      var $el, el, rect;
      el = this;
      $el = _default(el);
      rect = el.getBoundingClientRect();
      if (rect.top < height + triggerDist && rect.bottom > -triggerDist) {
        return $el.animateCss($el.attr('data-animate-in'), function() {
          return $el.addClass('animated-in');
        });
      }
    });
    return _default('.animated-in').each(function() {
      var $el, el, rect;
      el = this;
      $el = _default(el);
      rect = el.getBoundingClientRect();
      if (!$el.attr('data-animate-out')) {
        return;
      }
      if (rect.top >= height + triggerDist * 2 || rect.bottom <= triggerDist * -2) {
        return $el.animateCss($el.attr('data-animate-out'), function() {
          return $el.removeClass('animated-in');
        });
      }
    });
  };
  $window = _default(window);
  $window.on('DOMContentLoaded scroll', fn);
  $scrollableArea = _default('main');
  return $scrollableArea.on('DOMContentLoaded scroll', fn);
});

// src/index.coffee
var start, tagNames;

tagNames = [HeaderMenuComplex$1.prototype.tag.toUpperCase(), HeaderMenuMobile$1.prototype.tag.toUpperCase(), HeaderMenuSimple$1.prototype.tag.toUpperCase(), PrivacyPopup$1.prototype.tag.toUpperCase()];

var index$5 = start = function(orgId, analyticsEnabled) {
  HanzoAnalytics$1.orgId = orgId;
  HanzoAnalytics$1.onFocus = function(record) {
    return console.log('Record', record);
  };
  HanzoAnalytics$1.flushRate = 10000;
  analyticsEnabled = !!analyticsEnabled;
  if (analyticsEnabled) {
    _default('hero, .hero').each(function(i, el) {
      return new Hero$1(el);
    });
    _default('block, .block').each(function(i, el) {
      return new Block$1(el);
    });
  }
  return El$1.mount(tagNames.join(','));
};

return index$5;

}());
//# sourceMappingURL=astley.js.map
