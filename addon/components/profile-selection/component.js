
// import LoggerMixin from 'web-directory/mixins/logger'
import Ember from 'ember';
import layout from './template';

const {computed, Component, inject} = Ember;

export default Component.extend(/* LoggerMixin, */{

  layout: layout,
  classNameBindings: [':profile-selection'],

  selectedMicrophone: null,
  selectedResolution: null,
  selectedOutputDevice: null,
  selectedCamera: null,

  selectedProfile: {},
  previousSelectedProfile: {},
  showEditPart: false,
  savedProfiles: Ember.A(),

  audio: true,
  video: true,
  troubleshoot: true,
  outputDevice: true,
  resolution: true,

  webrtc: inject.service(),
  intl: inject.service(),

  audioCallCapable: computed.reads('webrtc.audioCallCapable'),
  videoCallCapable: computed.reads('webrtc.videoCallCapable'),

  profileFilteredList: computed('savedProfiles.[]', 'webrtc.cameraList', 'webrtc.microphoneList', 'webrtc.outputDeviceList', 'webrtc.resolutionList', function () {
    return this.get('savedProfiles').map((item) => {
      var canBeSelected = true;
      canBeSelected &= item.selectedCamera ? !!this.get('webrtc.cameraList').findBy('deviceId', item.selectedCamera.deviceId) : true;
      canBeSelected &= item.selectedResolution ? !!this.get('webrtc.resolutionList').findBy('presetId', item.selectedResolution.presetId) : true;
      canBeSelected &= item.selectedMicrophone ? !!this.get('webrtc.microphoneList').findBy('deviceId', item.selectedMicrophone.deviceId) : true;
      canBeSelected &= item.selectedOutputDevice ? !!this.get('webrtc.outputDeviceList').findBy('deviceId', item.selectedOutputDevice.deviceId) : true;
      return Object.assign({
        isDisabled: !canBeSelected
      }, item);
    });
  }),

  profileNameLabel: computed(function () {
    return this.get('intl').t('webrtcDevices.profileNameLabel');
  }),

  canEdit: computed('selectedProfile.name', function () {
    return !!this.get('selectedProfile.name');
  }),

  selectedProfileName: computed('selectedProfile.name', function () {
    return this.getWithDefault('selectedProfile.name', this.get('intl').t('webrtcDevices.useComputerSettings'));
  }),

  selectedCameraId: computed('selectedProfile.selectedCamera', function () {
    if (this.get('selectedProfile.selectedCamera')) {
      return this.get('selectedProfile.selectedCamera.deviceId');
    }
    return null;
  }),

  selectedMicrophoneId: computed('selectedProfile.selectedMicrophone', function () {
    if (this.get('selectedProfile.selectedMicrophone')) {
      return this.get('selectedProfile.selectedMicrophone.deviceId');
    }
    return null;
  }),

  selectedResolutionId: computed('selectedProfile.selectedResolution', function () {
    if (this.get('selectedProfile.selectedResolution')) {
      return this.get('selectedProfile.selectedResolution.presetId');
    }
    return null;
  }),

  selectedOutputDeviceId: computed('selectedProfile.selectedOutputDevice', function () {
    if (this.get('selectedProfile.selectedOutputDevice')) {
      return this.get('selectedProfile.selectedOutputDevice.deviceId');
    }
    return null;
  }),

  init () {
    this._super(...arguments);
    setTimeout(() => {
      this.get('webrtc').enumerateDevices();
      this.get('webrtc').enumerateResolutions();
    });
    this.addObserver('profileFilteredList', this, 'profileFilteredListChanged');
    this.addObserver('showEditPart', this, 'onShowEditPartChanged')
  },

  profileFilteredListChanged () {
    if (!this.get('selectedProfile.name')) {
      return;
    }
    const find = this.get('profileFilteredList').find((item) => item.name === this.get('selectedProfile.name'));
    if (!find || find.isDisabled) {
      this.set('selectedProfile', {
        selectedCamera: this.get('webrtc.cameraList').findBy('deviceId', 'default'),
        selectedMicrophone: this.get('webrtc.microphoneList').findBy('deviceId', 'default'),
        selectedOutputDevice: this.get('webrtc.outputDeviceList').findBy('deviceId', 'default'),
        selectedResolution: this.get('webrtc.resolutionList').findBy('presetId', 3)
      });
    }
  },

  onShowEditPartChanged () {
    setTimeout(() => {
      if (this.get('showEditPart')) {
        this.$('input:first').focus();
      } else {
        this.$('button:first').focus();
      }
    });
  },

  showOutputDevicePicker: computed('outputDevice', 'audio', function () {
    return this.get('outputDevice') && this.get('audio');
  }),

  showResolutionPicker: computed('webrtc.resolutionList.length', 'webrtc.cameraList.length', 'video', 'resolution', function () {
    const webrtc = this.get('webrtc');
    return webrtc.get('resolutionList.length') && webrtc.get('cameraList.length') && this.get('video') && this.get('resolution');
  }),

  actions: {
    showEditProfile () {
      this.set('showEditPart', true);
    },

    cancelProfileEdition () {
      this.set('showEditPart', false);
      this.set('selectedProfile', this.get('previousSelectedProfile'));
    },

    saveProfileEdition () {
      this.set('showEditPart', false);
      this.set('selectedProfile.selectedCamera', this.get('selectedCamera'));
      this.set('selectedProfile.selectedMicrophone', this.get('selectedMicrophone'));
      this.set('selectedProfile.selectedOutputDevice', this.get('selectedOutputDevice'));
      this.set('selectedProfile.selectedResolution', this.get('selectedResolution'));
      let profile = this.get('savedProfiles').findBy('name', this.get('selectedProfile.name'));
      if (!profile) {
        this.get('savedProfiles').pushObject(this.get('selectedProfile'));
      }
      if (typeof this.attrs.saveProfiles === 'function') {
        this.attrs.saveProfiles(this.get('savedProfiles.[]'));
      }
    },

    useComputerSettings () {
      this.set('selectedProfile', {});
      this.set('previousSelectedProfile', this.get('selectedProfile'));
      setTimeout(() => {
        this.$('button:first').focus();
      });
    },

    createNewProfile () {
      this.set('showEditPart', true);
      this.set('selectedProfile', {
        selectedCamera: this.get('webrtc.cameraList').findBy('deviceId', 'default'),
        selectedMicrophone: this.get('webrtc.microphoneList').findBy('deviceId', 'default'),
        selectedOutputDevice: this.get('webrtc.outputDeviceList').findBy('deviceId', 'default'),
        selectedResolution: this.get('webrtc.resolutionList').findBy('presetId', 3)
      });
    },

    deleteProfile (profileName) {
      var profileObj = this.get('savedProfiles').findBy('name', profileName);
      this.get('savedProfiles').removeObject(profileObj);
      if (typeof this.attrs.saveProfiles === 'function') {
        this.attrs.saveProfiles(this.get('savedProfiles.[]'));
      }
    },

    changeProfile (profile) {
      this.set('selectedProfile', this.get('savedProfiles').findBy('name', profile.name));
      this.set('previousSelectedProfile', this.get('selectedProfile'));
      setTimeout(() => {
        this.$('button:first').focus();
      });
    },

    changeCamera (id) {
      if (this.get('selectedCamera.deviceId') !== id) {
        this.set('selectedCamera', this.get('webrtc.cameraList').findBy('deviceId', id));
      }
    },

    changeMicrophone (id) {
      if (this.get('selectedMicrophone.deviceId') !== id) {
        this.set('selectedMicrophone', this.get('webrtc.microphoneList').findBy('deviceId', id));
      }
    },

    changeOutputDevice (id) {
      if (this.get('selectedOutputDevice.deviceId') !== id) {
        this.set('selectedOutputDevice', this.get('webrtc.outputDeviceList').findBy('deviceId', id));
      }
    },

    changeResolution (id) {
      if (this.get('selectedResolution.presetId') !== id) {
        this.set('selectedResolution', this.get('webrtc.resolutionList').findBy('presetId', id));
      }
    }
  }
});
