import Ember from 'ember';
import layout from './template';

const UP_KEYCODE = 38;
const DOWN_KEYCODE = 40;
const ESC_KEYCODE = 27;
const SPACE_KEYCODE = 32;
const ENTER_KEYCODE = 13;

const getParent = ($this) => {
  var selector = $this.attr('data-target');
  if (!selector) {
    selector = $this.attr('href');
    selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
  }
  var $parent = selector && Ember.$(selector);
  return $parent && $parent.length ? $parent : $this.parent();
};

export default Ember.Component.extend({
  classNames: ['dropdown-menu-view'],
  layout: layout,
  showMenu: false,

  actions: {
    toggleMenu () {
      this.toggleProperty('showMenu');
    }
  },

  didInsertElement () {
    const id = this.get('elementId');
    Ember.$(window).on(`click.${id}`, (event) => {
      Ember.run(() => {
        const target = Ember.$(event.target);
        const parents = target.parents('.dropdown-menu-view');
        const targetOutside = !parents.length || id !== parents.attr('id');
        const targetInput = target.parent('.input').length;
        const listItem = target.prop('tagName') === 'LI' || target.prop('tagName') === 'A';
        if (targetOutside || targetInput || listItem) {
          this.set('showMenu', false);
        }
      });
    });
    Ember.$('#' + id).on(`keydown.${id}`, (event) => {
      var regxp = new RegExp(`${UP_KEYCODE}|${DOWN_KEYCODE}|${ESC_KEYCODE}|${SPACE_KEYCODE}|${ENTER_KEYCODE}`);
      if (!regxp.test(event.which)) {
        return;
      }

      event.stopPropagation();
      event.preventDefault();

      var $this = Ember.$(event.target).closest('.dropdown-menu-view');

      if ($this.is('.disabled, :disabled')) {
        return;
      }
      var $parent = getParent($this);
      var isActive = this.get('showMenu');

      if (!isActive && event.which !== ESC_KEYCODE || isActive && event.which === ESC_KEYCODE) {
        if (event.which === ESC_KEYCODE) {
          $parent.find('.btn-toggle').trigger('focus');
          return this.set('showMenu', false);
        }
        return this.set('showMenu', true);
      }
      var desc = ' li:not(.disabled):visible > a';
      var $items = $parent.find('.dropdown-menu' + desc);

      if (!$items.length) {
        return;
      }

      var index = $items.index(event.target);

      if (event.which === UP_KEYCODE && index > 0) {
        index--; // up
      }
      if (event.which === DOWN_KEYCODE && index < $items.length - 1) {
        index++; // down
      }
      if (!~index) {
        index = 0;
      }
      $items.eq(index).trigger('focus');
      if (isActive && (event.which === ENTER_KEYCODE || event.which === SPACE_KEYCODE)) {
        setTimeout(() => { $items.eq(index).click(); });
        $parent.find('.btn-toggle').trigger('focus');
      }
    });
  },

  willDestroyElement () {
    Ember.$(window).off(`.${this.get('elementId')}`);
  }

});
