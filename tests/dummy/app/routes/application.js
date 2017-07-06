import Ember from 'ember';
// app/routes/application.js
export default Ember.Route.extend({
  intl: Ember.inject.service(),
  webrtc: Ember.inject.service(),
  beforeModel () {
    Ember.run.next(this, function () {
      window.navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      }).then((stream) => {
        stream.getTracks().forEach((t) => t.stop());
        this.get('webrtc').enumerateDevices();
      });
    });
    return this.get('intl').setLocale('en-us');
  }
});
