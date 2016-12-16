'use strict';

const chai = require('chai');
chai.should();
chai.use(require('chai3-json-schema'));

const defaults = require('../defaults');
const schema = require('./defaults.schema.json');

describe('Verify completeness of the default configuration options', function() {
  it('should conform to the specified JSON schema', function() {
    defaults.should.be.jsonSchema(schema);
  });
});
