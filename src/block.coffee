import Annotator from './_content-annotator'

class Block extends Annotator
  tag: 'block'

  init: ()->
    super

Block.register()

export default Block
