<!-- Repurposed the move tool to act as a graphical delete tool -->
<template lang="html">
  <v-list-tile id="tool-delete">
    <v-tooltip
      id="tooltip"
      right
      open-delay="700">
      <v-btn
        id="tool"
        slot="activator"
        flat
        block
        @click.native="initialiseTool"
      >
        <v-icon
          :class="{'grey--text text--darken-2': !active,
                   'blue--text text--darken-1': active}">
          delete
        </v-icon>
      </v-btn>
      <span> Delete Tool </span>
    </v-tooltip>
  </v-list-tile>
</template>

<script>
import paper from 'paper'
import { mapActions, mapState } from 'vuex'

export default {
  props: {
    active: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      toolDelete: null,
      selectOptions: null,
      strokeWidth: 2
    }
  },

  computed: {
    ...mapState({
      viewportZoom: state => state.image.OSDviewer.viewport.getZoom(true),
      imageWidth: state =>
        state.image.OSDviewer.world.getItemAt(0).getContentSize().x
    })
  },

  created () {
    // Result of user click interaction on PaperJS instance.
    let hitResult = null

    // Array of items that will be selected and the selected group
    let toBeDeleted = []
    let selectedGroup = null

    const toolDown = event => {
      // Get details of the element the user has clicked on.
      hitResult = paper.project.hitTest(event.point, this.selectOptions)

      // If no modiefiers and item has been selected then create the
      // selection group (of one element) to be selected.
      if (
        hitResult &&
        (hitResult.type === 'fill' ||
          hitResult.type === 'stroke' ||
          hitResult.type === 'segment' ||
          hitResult.type === 'bounds')
      ) {
        toBeDeleted = [hitResult.item]
      } else {
        toBeDeleted = []
      }

      // Clean current selection
      paper.project.deselectAll()
      if (selectedGroup) {
        selectedGroup.selected = false
        selectedGroup.bounds.selected = false
        selectedGroup = null
      }

      // If there are items to be selected then setup selection.
      if (toBeDeleted.length > 0) {
        // Check any of the items need to be selected with linked
        // items. For example in the case of the
        // counting rectanlge tool need to select the number, tag
        // and rectangle path.
        for (let item in toBeDeleted) {
          if (toBeDeleted[item].data.selectWith) {
            for (let extraItem in toBeDeleted[item].data.selectWith) {
              toBeDeleted.push(toBeDeleted[item].data.selectWith[extraItem])
            }
          }
        }

        selectedGroup = new paper.Group(toBeDeleted)
        selectedGroup.selected = true
      }
    }

    // Functionality for user dragging select/move tool.
    // Specified action should have been set on the mouseDown event.
    const toolDrag = event => {
      let selectionRect = new paper.Shape.Rectangle(
        event.downPoint,
        event.point
      )
      selectionRect.strokeColor = '#4D88D4'
      selectionRect.fillColor = '#A3C5E8'
      selectionRect.opacity = 0.3
      selectionRect.strokeWidth = this.strokeWidth

      // Constantly update tracking rect by removing it and re-drawing.
      selectionRect.removeOn({
        drag: true,
        down: true,
        up: true
      })

      // Get items inside the selection rectangle.
      toBeDeleted = paper.project.getItems({
        class: 'Path',
        inside: selectionRect.bounds,
        match: this.matchFilter
      })

      // Clean current selection
      paper.project.deselectAll()
      if (selectedGroup) {
        selectedGroup.selected = false
        selectedGroup.bounds.selected = false
        selectedGroup = null
      }

      if (toBeDeleted.length > 0) {
        // Check any of the items need to be selected with linked
        // items. For example in the case of the
        // counting rectanlge tool need to select the number, tag
        // and rectangle path.
        for (let item in toBeDeleted) {
          if (toBeDeleted[item].data.selectWith) {
            for (let extraItem in toBeDeleted[item].data.selectWith) {
              toBeDeleted.push(toBeDeleted[item].data.selectWith[extraItem])
            }
          }
        }

        selectedGroup = new paper.Group(toBeDeleted)
        selectedGroup.selected = true
      }
    }

    // Select the group and provide housekeeping/emit events.
    const toolUp = event => {
      if (selectedGroup) {
        selectedGroup.remove()
      }
    }

    // Assign tool to paper instance.
    this.toolDelete = new paper.Tool()
    this.toolDelete.onMouseDown = toolDown
    this.toolDelete.onMouseDrag = toolDrag
    this.toolDelete.onMouseUp = toolUp
  },

  methods: {
    ...mapActions({
      prepareCanvas: 'annotation/prepareCanvas'
    }),

    initialiseTool () {
      // Prepare PaperJS canvas for interaction.
      this.prepareCanvas()

      // Activate the paperJS tool.
      this.toolDelete.activate()

      // Set tool stroke width and hitTolerance settings.
      this.strokeWidth = this.imageWidth / (this.viewportZoom * 500)
      let hitTolerance = this.strokeWidth * 3

      // Selection options
      this.selectOptions = {
        segments: true,
        stroke: true,
        bounds: true,
        handles: true,
        fill: true,
        tolerance: hitTolerance,
        match: this.matchFilter
      }
    },

    matchFilter (itemToCheck) {
      // When checking a hitResult, need to check under item
      if (itemToCheck.item && itemToCheck.item.layer.name === 'guide') {
        return false
      // When checking from project.getItems(), can check straight under layer
      } else if (itemToCheck.layer && itemToCheck.layer.name === 'guide') {
        return false
      } else {
        return true
      }
    }
  }
}
</script>

<style lang='css'>
#tooltip {
  width: 100%;
}

#tool {
  min-width: 0px;
}

#tool-delete {
  padding: 0px;
}
</style>
