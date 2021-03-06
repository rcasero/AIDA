import axios from 'axios'

export default {
  async getArrayOfImages ({
    commit
  }) {
    try {
      await axios.post(location.origin + '/checkForImages')
      const pathToArrayOfImagesFile = location.origin + '/data/images.json'
      const arrayOfImagesFile = await axios.get(pathToArrayOfImagesFile)
      commit('setAvailableImages', arrayOfImagesFile.data)
    } catch (err) {
      console.log(err)
    }
  },

  async saveAnnotation ({
    dispatch,
    rootState
  }) {
    try {
      // Ensure all the paperJS items are included in the vuex state
      await dispatch('annotation/refreshAnnotationState', null, { root: true })

      // Post API request.
      const postUrl = location.origin + '/save'
      await axios.post(
        postUrl,
        {
          projectImageName: rootState.image.projectImageName,
          annotationData: rootState.annotation.project
        }
      )

      // Activate notification
      dispatch('app/activateSnackbar', {
        text: 'Saved annotation data',
        color: 'success'
      }, { root: true })

    // Handle errors
    } catch (err) {
      console.log(err)
      dispatch('app/activateSnackbar', {
        text: 'Annotation data could not be saved',
        color: 'error'
      }, { root: true })
    }
  },

  async getAnnotation ({
    dispatch,
    rootState
  }) {
    const dataLocation = location.origin + '/annotations/' + rootState.image.projectImageName + '.json'
    try {
      const response = await axios.get(dataLocation)
      dispatch('annotation/loadAnnotation', response.data, { root: true })
    } catch (err) {
      console.log('Annotation data either could not be found or could not be loaded')
    }
  },

  setProjectFileName ({
    commit
  }, payload) {
    commit('setProjectFileName', payload)
  },

  async getProjectImage ({
    state,
    dispatch
  }) {
    // Clear any images in the current vuex state.
    await dispatch('image/clearImages', null, { root: true })

    // Set image type by checking for .dzi in the fileName
    if (state.projectFileName.indexOf('.dzi') > -1) {
      dispatch('image/addOSDImage', {
        name: state.projectFileName,
        fileType: 'dzi',
        source: location.origin + '/images/' + state.projectFileName,
        function: 'project',
        opacity: 1
      }, { root: true })
    } else {
      dispatch('image/addOSDImage', {
        name: state.projectFileName,
        fileType: 'simple',
        source: location.origin + '/images/' + state.projectFileName,
        function: 'project',
        opacity: 1
      }, { root: true })
    }
  }
}
