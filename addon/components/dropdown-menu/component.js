import Ember from 'ember';
import layout from './template';

const getParent = ($this) => {
    var selector = $this.attr('data-target');

    if (!selector) {
      selector = $this.attr('href');
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
    }

    var $parent = selector && $(selector);

    return $parent && $parent.length ? $parent : $this.parent();
  };

export default Ember.Component.extend({
    classNames: ['dropdown-menu-view'],
    layout: layout,
    showMenu: false,

    actions: {
        toggleMenu() {
            this.toggleProperty('showMenu');
        }
    },

    didInsertElement() {
        const id = this.get('elementId');
        Ember.$(window).on(`click.${id}`, (event) => {
            Ember.run(() => {
                const target = $(event.target);
                const parents = target.parents('.dropdown-menu-view');
                const targetOutside = !parents.length || id !== parents.attr('id');
                const targetInput = target.parent('.input').length;
                const listItem = target.prop('tagName') === 'LI' || target.prop('tagName') === 'A';
                if (targetOutside || targetInput || listItem) {
                    this.set('showMenu', false);
                }
            });
        });
        Ember.$('#'+id).on(`keydown.${id}`, (event) => {
            if (!/(38|40|27|32|13)/.test(event.which)) {
                return;
            }

            event.stopPropagation();
            event.preventDefault();

            var $this = $(event.target).closest('.dropdown-menu-view');

            if ($this.is('.disabled, :disabled')) {
                return;
            }
            var $parent  = getParent($this);
            var isActive = this.get('showMenu');

            if (!isActive && event.which != 27 || isActive && event.which == 27) {
                if (event.which == 27) {
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

            if (event.which == 38 && index > 0)  {
                index--; // up
            }
            if (event.which == 40 && index < $items.length - 1) {
                index++; // down
            }
            if (!~index) {
                index = 0;
            }
            $items.eq(index).trigger('focus');
            if (isActive && (event.which == 13 || event.which == 32))  {
                setTimeout(() => {$items.eq(index).click();});
                $parent.find('.btn-toggle').trigger('focus');
            }
        });
    },

    willDestroyElement() {
        Ember.$(window).off(`.${this.get('elementId')}`);
    }

});

/*
Dropdown.prototype.keydown = function (e) {
    if (!/(38|40|27|32)/.test(e.which) || /input|textarea/i.test(e.target.tagName)) return;

    var $this = $(this);

    e.preventDefault();
    e.stopPropagation();

    if ($this.is('.disabled, :disabled')) return;

    var $parent  = getParent($this);
    var isActive = $parent.hasClass('open');

    if (!isActive && e.which != 27 || isActive && e.which == 27) {
      if (e.which == 27) $parent.find(toggle).trigger('focus');
      return $this.trigger('click');
    }

    var desc = ' li:not(.disabled):visible a';
    var desc2 = ' li:not(.disabled):visible button';
    var $items = $parent.find('.dropdown-menu' + desc + ', .dropdown-menu' + desc2);

    if (!$items.length) return;

    var index = $items.index(e.target);

    if (e.which == 38 && index > 0)                 index--;         // up
    if (e.which == 40 && index < $items.length - 1) index++;         // down
    if (!~index)                                    index = 0;

    $items.eq(index).trigger('focus');
  };
*/
