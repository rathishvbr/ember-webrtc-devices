import resolver from './helpers/resolver';
import registerSelectHelper from './helpers/register-select-helper';
import { setResolver } from 'ember-qunit';
import { start } from 'ember-cli-qunit';

registerSelectHelper();
setResolver(resolver);
start();
