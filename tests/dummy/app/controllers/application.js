import Ember from 'ember';

export default Ember.Controller.extend({
  webrtc: Ember.inject.service(),
  savedProfiles: Ember.A(JSON.parse(window.localStorage.getItem('savedProfiles') || '[]')),
  actions: {
    openTroubleshoot () {
      alert('troubleshooting!'); // eslint-disable-line
    },
    saveProfiles (profiles) {
      window.localStorage.setItem('savedProfiles', JSON.stringify(profiles));
    }
  }
});
