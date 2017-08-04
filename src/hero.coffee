import Annotator from './_content-annotator'

class Hero extends Annotator
  tag: 'hero'

  init: ()->
    super

Hero.register()

export default Hero
