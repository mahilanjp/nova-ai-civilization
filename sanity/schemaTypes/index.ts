import {type SchemaTypeDefinition} from 'sanity'
import {citizenType} from './citizen'
import {locationType} from './location'
import {relationshipType} from './relationship'
import {worldEventType} from './worldEvent'
import {reactionType} from './reaction'

export const schema: {types: SchemaTypeDefinition[]} = {
  types: [
    citizenType,
    locationType,
    relationshipType,
    worldEventType,
    reactionType,
  ],
}