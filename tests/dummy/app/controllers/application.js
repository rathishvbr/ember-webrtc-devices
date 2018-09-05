import Ember from 'ember';

export default Ember.Controller.extend({
  webrtc: Ember.inject.service(),
  savedProfiles: Ember.A(JSON.parse(localStorage.getItem('savedProfiles'))),
  actions: {
    openTroubleshoot () {
      alert('troubleshooting!'); // eslint-disable-line
    },
    saveProfiles (profiles) {
      localStorage.setItem('savedProfiles', JSON.stringify(profiles));
    }
  }
});
