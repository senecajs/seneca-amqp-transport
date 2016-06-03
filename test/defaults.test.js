'use strict';

const chai = require('chai')
const should = chai.should();
chai.use(require('chai-json-schema'));

const Defaults = require('../defaults');
const Schema = require('./defaults.schema.json');


describe('Verify completeness of the default configuration options', function() {

  it('should conform to the specified JSON schema', function() {

    Defaults.should.be.jsonSchema(Schema);

  });

});
