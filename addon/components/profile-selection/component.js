
// import LoggerMixin from 'web-directory/mixins/logger'
import Ember from 'ember';
import layout from './template';

const {computed, Component, inject} = Ember;

// generate guid
const guid = () => {
   let s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

export default Component.extend(/* LoggerMixin, */{

  layout: layout,
  classNameBindings: [':profile-selection'],

  selectedProfile: {},
  previousSelectedProfile: {},
  showEditPart: false,
  savedProfiles: Ember.A(),

  audio: true,
  video: true,
  troubleshoot: true,
  outputDevice: true,
  resolution: true,
  canEdit: false,

  selectedMicrophone: null,
  selectedResolution: null,
  selectedOutputDevice: null,
  selectedCamera: null,

  webrtc: inject.service(),
  intl: inject.service(),

  audioCallCapable: computed.reads('webrtc.audioCallCapable'),
  videoCallCapable: computed.reads('webrtc.videoCallCapable'),

  showTroubleshoot: computed('troubleshoot', function () {
    return this.get('troubleshoot') && typeof this.attrs.openTroubleshoot === 'function';
  }),

  profileFilteredList: computed('savedProfiles.[]', 'webrtc.cameraList', 'webrtc.microphoneList', 'webrtc.outputDeviceList', 'webrtc.resolutionList', function () {
    return this.get('savedProfiles').map((item) => {
      var canBeSelected = true;
      canBeSelected &= item.selectedCameraId ? !!this.get('webrtc.cameraList').findBy('deviceId', item.selectedCameraId) : true;
      canBeSelected &= item.selectedResolutionId ? !!this.get('webrtc.resolutionList').findBy('presetId', item.selectedResolutionId) : true;
      canBeSelected &= item.selectedMicrophoneId ? !!this.get('webrtc.microphoneList').findBy('deviceId', item.selectedMicrophoneId) : true;
      canBeSelected &= item.selectedOutputDeviceId ? !!this.get('webrtc.outputDeviceList').findBy('deviceId', item.selectedOutputDeviceId) : true;
      return Object.assign({
        isDisabled: !canBeSelected
      }, item);
    });
  }),

  profileNameLabel: computed(function () {
    return this.get('intl').t('webrtcDevices.profileNameLabel');
  }),

  init () {
    this._super(...arguments);
    setTimeout(() => {
      this.get('webrtc').enumerateDevices();
      this.get('webrtc').enumerateResolutions();
    });
    this.set('selectedProfileName', this.get('intl').t('webrtcDevices.useComputerSettings'))
    this.addObserver('profileFilteredList', this, 'profileFilteredListChanged');
    this.addObserver('showEditPart', this, 'onShowEditPartChanged');
    this.addObserver('selectedProfileId', this, 'onSelectedProfileIdChanged');
    this.addObserver('selectedProfile', this, 'onSelectedProfileChange');
  },

  onSelectedProfileChange () {
    this.setProperties({
      canEdit: !!this.get('selectedProfile.id'),
      selectedProfileName: this.getWithDefault('selectedProfile.name', this.get('intl').t('webrtcDevices.useComputerSettings')),
      selectedCameraId: this.get('selectedProfile.selectedCameraId'),
      selectedMicrophoneId: this.get('selectedProfile.selectedMicrophoneId'),
      selectedOutputDeviceId: this.get('selectedProfile.selectedOutputDeviceId'),
      selectedResolutionId: this.get('selectedProfile.selectedResolutionId'),
    });
  },
  /*
  */
  onSelectedProfileIdChanged () {
    if (!this.get('selectedProfileId')) {
      return;
    }
    const find = this.get('profileFilteredList').find((item) => item.id === this.get('selectedProfileId'));
    if (find) {
      this.set('selectedProfile', find);
      this.send('setProfileAsActive');
    }
  },
  /*
  */
  profileFilteredListChanged () {
    if (!this.get('selectedProfile.id')) {
      return;
    }
    const find = this.get('profileFilteredList').find((item) => item.id === this.get('selectedProfile.id'));
    if (!find || find.isDisabled) {
      this.set('selectedProfile', {
        selectedCameraId: 'default',
        selectedMicrophoneId: 'default',
        selectedOutputDeviceId: 'default',
        selectedResolutionId: 3
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
    setProfileAsActive () {
      this.set('previousSelectedProfile', this.get('selectedProfile'));
      if (typeof this.attrs.selectedProfileChanged === 'function') {
        this.attrs.selectedProfileChanged({
          id: this.get('selectedProfile.id'),
          selectedCamera: this.get('webrtc.cameraList').findBy('deviceId', this.get('selectedProfile.selectedCameraId')),
          selectedResolution: this.get('webrtc.resolutionList').findBy('presetId', this.get('selectedProfile.selectedResolutionId')),
          selectedMicrophone: this.get('webrtc.microphoneList').findBy('deviceId', this.get('selectedProfile.selectedMicrophoneId')),
          selectedOutputDevice: this.get('webrtc.outputDeviceList').findBy('deviceId', this.get('selectedProfile.selectedOutputDeviceId')),
          name: this.get('selectedProfile.name')
        });
      }
    },

    openTroubleshoot () {
      if (typeof this.attrs.openTroubleshoot === 'function') {
        this.attrs.openTroubleshoot();
      }
    },

    showEditProfile () {
      this.set('showEditPart', true);
    },

    cancelProfileEdition () {
      this.set('showEditPart', false);
      this.set('selectedProfile', this.get('previousSelectedProfile'));
    },

    saveProfileEdition () {
      if (!this.get('selectedProfile.name')) {
        // TODO diplay error
        return;
      }

      this.set('showEditPart', false);
      this.set('selectedProfileName', this.get('selectedProfile.name'))
      this.set('selectedProfile.selectedCameraId', this.get('selectedCameraId'));
      this.set('selectedProfile.selectedMicrophoneId', this.get('selectedMicrophoneId'));
      this.set('selectedProfile.selectedOutputDeviceId', this.get('selectedOutputDeviceId'));
      this.set('selectedProfile.selectedResolutionId', this.get('selectedResolutionId'));

      let profile = this.get('savedProfiles').findBy('name', this.get('selectedProfile.name'));
      if (profile && profile.id != this.get('selectedProfile.id')) {
        // TODO display warn
      }
      if (!profile && !this.get('savedProfiles').findBy('id', this.get('selectedProfile.id'))) {
        this.get('savedProfiles').pushObject(this.get('selectedProfile'));
      }
      if (typeof this.attrs.saveProfiles === 'function') {
        this.attrs.saveProfiles(this.get('savedProfiles.[]'));
      }
      this.send('setProfileAsActive');
    },

    useComputerSettings () {
      this.set('selectedProfile', {});
      this.send('setProfileAsActive');
      setTimeout(() => {
        this.$('button:first').focus();
      });
    },

    createNewProfile () {
      this.set('showEditPart', true);
      this.set('selectedProfile', {
        id: guid(),
        selectedCameraId: 'default',
        selectedMicrophoneId: 'default',
        selectedOutputDeviceId: 'default',
        selectedResolutionId: 3
      });
    },

    deleteProfile (profileId) {
      var profileObj = this.get('savedProfiles').findBy('id', profileId);
      this.get('savedProfiles').removeObject(profileObj);
      if (typeof this.attrs.saveProfiles === 'function') {
        this.attrs.saveProfiles(this.get('savedProfiles.[]'));
      }
    },

    changeProfile (profile) {
      this.set('selectedProfile', this.get('savedProfiles').findBy('id', profile.id));
      this.send('setProfileAsActive');
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
