(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.swagger2har = {}));
})(this, (function (exports) { 'use strict';

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var instantiator = createCommonjsModule(function (module) {

	  // The JSON Object that defines the default values of certain types.

	  var typesInstantiator = {
	    'string': '',
	    'number': 0,
	    'integer': 0,
	    'null': null,
	    'boolean': false, // Always stay positive?
	    'object': {}
	  };

	  /**
	   * Checks whether a variable is a primitive.
	   * @param obj - an object.
	   * @returns {boolean}
	   */
	  function isPrimitive(obj) {
	    var type = obj.type;

	    return typesInstantiator[type] !== undefined;
	  }

	  /**
	   * Checks whether a property is on required array.
	   * @param property - the property to check.
	   * @param requiredArray - the required array
	   * @returns {boolean}
	   */
	  function isPropertyRequired(property, requiredArray) {
	    var found = false;
	    requiredArray = requiredArray || [];
	    requiredArray.forEach(function (requiredProperty) {
	      if (requiredProperty === property) {
	        found = true;
	      }
	    });
	    return found;
	  }

	  function shouldVisit(property, obj, options) {
	    return !options.requiredPropertiesOnly || options.requiredPropertiesOnly && isPropertyRequired(property, obj.required);
	  }

	  /**
	   * Instantiate a primitive.
	   * @param val - The object that represents the primitive.
	   * @returns {*}
	   */
	  function instantiatePrimitive(val) {
	    var type = val.type;

	    // Support for default values in the JSON Schema.
	    if (val.default) {
	      return val.default;
	    }

	    return typesInstantiator[type];
	  }

	  /**
	   * Checks whether a variable is an enum.
	   * @param obj - an object.
	   * @returns {boolean}
	   */
	  function isEnum(obj) {
	    return Object.prototype.toString.call(obj.enum) === '[object Array]';
	  }

	  /**
	   * Checks whether a variable is an array.
	   * @param obj - an object.
	   * @returns {boolean}
	   */
	  function isArray(obj) {
	    return Array.isArray(obj);
	  }

	  /**
	   * Extracts the type of the object.
	   * If the type is an array, set type to first in list of types.
	   * If obj.type is not overridden, it will fail the isPrimitive check.
	   * Which internally also checks obj.type.
	   * @param obj - An object.
	  */
	  function getObjectType(obj) {
	    // Check if type is array of types.
	    if (isArray(obj.type)) {
	      obj.type = obj.type[0];
	    }

	    return obj.type;
	  }

	  /**
	   * Instantiate an enum.
	   * @param val - The object that represents the primitive.
	   * @returns {*}
	   */
	  function instantiateEnum(val) {
	    // Support for default values in the JSON Schema.
	    if (val.default) {
	      return val.default;
	    }
	    if (!val.enum.length) {
	      return undefined;
	    }
	    return val.enum[0];
	  }

	  /**
	   * The main function.
	   * Calls sub-objects recursively, depth first, using the sub-function 'visit'.
	   * @param schema - The schema to instantiate.
	   * @returns {*}
	   */
	  function instantiate(schema, options) {
	    options = options || {};

	    /**
	     * Visits each sub-object using recursion.
	     * If it reaches a primitive, instantiate it.
	     * @param obj - The object that represents the schema.
	     * @param name - The name of the current object.
	     * @param data - The instance data that represents the current object.
	     */
	    function visit(obj, name, data) {
	      if (!obj) {
	        return;
	      }

	      var i;
	      var type = getObjectType(obj);

	      // We want non-primitives objects (primitive === object w/o properties).
	      if (type === 'object' && obj.properties) {
	        data[name] = data[name] || {};

	        // Visit each property.
	        for (var property in obj.properties) {
	          if (obj.properties.hasOwnProperty(property)) {
	            if (shouldVisit(property, obj, options)) {
	              visit(obj.properties[property], property, data[name]);
	            }
	          }
	        }
	      } else if (obj.allOf) {
	        for (i = 0; i < obj.allOf.length; i++) {
	          visit(obj.allOf[i], name, data);
	        }
	      } else if (type === 'array') {
	        data[name] = [];
	        var len = 0;
	        if (obj.minItems || obj.minItems > 0) {
	          len = obj.minItems;
	        }

	        // Instantiate 'len' items.
	        for (i = 0; i < len; i++) {
	          visit(obj.items, i, data[name]);
	        }
	      } else if (isEnum(obj)) {
	        data[name] = instantiateEnum(obj);
	      } else if (isPrimitive(obj)) {
	        data[name] = instantiatePrimitive(obj);
	      }
	    }

	    var data = {};
	    visit(schema, 'kek', data);
	    return data['kek'];
	  }

	  // If we're using Node.js, export the module.
	  {
	    module.exports = {
	      instantiate: instantiate
	    };
	  }
	});
	var instantiator_1 = instantiator.instantiate;

	var instantiator$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		'default': instantiator,
		__moduleExports: instantiator,
		instantiate: instantiator_1
	});

	var require$$0 = ( instantiator$1 && instantiator ) || instantiator$1;

	var jsonSchemaInstantiator = require$$0;

	/**
	 * Translates given Swagger 2.0 file to an array of HTTP Archive (HAR) 1.2 Request Object.
	 * See more:
	 *  - http://swagger.io/specification/
	 *  - http://www.softwareishard.com/blog/har-12-spec/#request
	 *
	 * Example HAR Request Object:
	 * "request": {
	 *   "method": "GET",
	 *   "url": "http://www.example.com/path/?param=value",
	 *   "httpVersion": "HTTP/1.1",
	 *   "cookies": [],
	 *   "headers": [],
	 *   "queryString" : [],
	 *   "postData" : {},
	 *   "headersSize" : 150,
	 *   "bodySize" : 0,
	 *   "comment" : ""
	 * }
	 *
	 * Source code initially pulled from: https://github.com/ErikWittern/swagger-snippet/blob/master/swagger-to-har.js
	 */
	const JSONSchemaSampler = require('@stoplight/json-schema-sampler');

	/**
	 * Create HAR Request object for path and method pair described in given swagger.
	 *
	 * @param  {Object} swagger           Swagger document
	 * @param  {string} path              Key of the path
	 * @param  {string} method            Key of the method
	 * @param  {string} baseUrl           Base URL
	 * @param  {string} operation         Key of the operation
	 * @param  {Object} queryParamValues  Optional: Values for the query parameters if present
	 * @return {Object}                   HAR Request object
	 */

	var createHar = function (swagger, path, method, baseUrl, queryParamValues) {
	  // if the operational parameter is not provided, set it to empty object
	  if (typeof queryParamValues === "undefined") {
	    queryParamValues = {};
	  }

	  var har = {
	    method: method.toUpperCase(),
	    url: baseUrl + path,
	    headers: getHeadersArray(swagger, path, method),
	    queryString: getQueryStrings(swagger, path, method, queryParamValues),
	    httpVersion: "HTTP/1.1",
	    cookies: [],
	    headersSize: 0,
	    bodySize: 0,
	    comment: swagger.paths[path][method].summary

	    // get payload data, if available:
	  };var postData = getPayload(swagger, path, method);
	  if (postData) har.postData = postData;

	  return har;
	};

	/**
	 * Get the payload definition for the given endpoint (path + method) from the
	 * given OAI specification. References within the payload definition are
	 * resolved.
	 *
	 * @param  {object} swagger
	 * @param  {string} path
	 * @param  {string} method
	 * @return {object}
	 */
	var getPayload = function (swagger, path, method) {
	  if (swagger['openapi'] && swagger['openapi'].startsWith('3')) {
	    if (swagger.paths[path][method].requestBody && swagger.paths[path][method].requestBody.content) {
	      var content = swagger.paths[path][method].requestBody.content;
	      for (var key in content) {
	        if (key === 'application/json') {
	          var schema = content[key].schema;
	          if (schema.$ref) {
	            var ref = schema.$ref.split('/').slice(-1)[0];
	            schema = getResolvedSchema(swagger, swagger.components.schemas[ref]);
	          }
	          var data = JSON.stringify();
	          try {
	            data = JSONSchemaSampler.sample(schema);
	          } catch (error) {
	            data = jsonSchemaInstantiator.instantiate(schema);
	          }
	          return {
	            mimeType: "application/json",
	            text: JSON.stringify(data)
	          };
	        }
	      }
	    }
	  } else if (typeof swagger.paths[path][method].parameters !== "undefined") {
	    for (var i in swagger.paths[path][method].parameters) {
	      var param = swagger.paths[path][method].parameters[i];
	      if (typeof param.in !== "undefined" && param.in.toLowerCase() === "body" && typeof param.schema !== "undefined") {
	        var schema;
	        if (typeof param.schema["$ref"] === "undefined") {
	          schema = param.schema;
	        } else if (/^http/.test(param.schema["$ref"])) ; else {
	          var ref = param.schema["$ref"].split("/").slice(-1)[0];
	          schema = getResolvedSchema(swagger, swagger.definitions[ref]);
	        }

	        var data = JSON.stringify();
	        try {
	          data = JSONSchemaSampler.sample(schema);
	        } catch (error) {
	          data = jsonSchemaInstantiator.instantiate(schema);
	        }
	        return {
	          mimeType: "application/json",
	          text: JSON.stringify(data)
	        };
	      }
	    }
	  }
	  return null;
	};

	/**
	 * Get a complete JSON schema from Swagger, where all references ($ref) are
	 * resolved. $ref appear:
	 * - as properties
	 * - as items
	 *
	 * @param  {[type]} swagger [description]
	 * @param  {[type]} schema  [description]
	 * @param  {[type]} ref     [description]
	 * @return {[type]}         [description]
	 */
	var getResolvedSchema = function (swagger, schema) {
	  if (schema.type === "object") {
	    if (typeof schema.properties !== "undefined") {
	      for (var propKey in schema.properties) {
	        var prop = schema.properties[propKey];
	        if (typeof prop["$ref"] === "string" && !/^http/.test(prop["$ref"])) {
	          var ref = prop["$ref"].split("/").slice(-1)[0];
	          if (swagger.definitions) {
	            schema.properties[propKey] = swagger.definitions[ref];
	          } else {
	            schema.properties[propKey] = swagger.components.schemas[ref];
	          }
	        }
	        getResolvedSchema(swagger, schema.properties[propKey]);
	      }
	    }
	  } else if (schema.type === "array") {
	    if (typeof schema.items !== "undefined") {
	      for (var itemKey in schema.items) {
	        if (itemKey === "$ref" && !/^http/.test(schema.items[itemKey])) {
	          var ref2 = schema.items["$ref"].split("/").slice(-1)[0];
	          if (swagger.definitions) {
	            schema.items = swagger.definitions[ref2];
	          } else {
	            schema.items = swagger.components.schemas[ref2];
	          }
	        }
	        getResolvedSchema(swagger, schema.items);
	      }
	    }
	  }
	  return schema;
	};

	/**
	 * Gets the base URL constructed from the given swagger.
	 *
	 * @param  {Object} swagger Swagger document
	 * @return {string}         Base URL
	 */
	var getBaseUrl = function (swagger) {
	  var baseUrl = "";

	  if (swagger.openapi && swagger.servers) {
	    return swagger.servers[0].url;
	  }

	  if (typeof swagger.schemes !== "undefined") {
	    baseUrl += swagger.schemes[0];
	  } else {
	    baseUrl += "http";
	  }

	  if (swagger.basePath === "/") {
	    baseUrl += "://" + swagger.host;
	  } else if (swagger.basePath) {
	    baseUrl += "://" + swagger.host + swagger.basePath;
	  }

	  return baseUrl;
	};

	/**
	 * Get array of objects describing the query parameters for a path and method pair
	 * described in the given swagger.
	 *
	 * @param  {Object} swagger Swagger document
	 * @param  {string} path    Key of the path
	 * @param  {string} method  Key of the method
	 * @param  {Object} values  Optional: query parameter values to use in the snippet if present
	 * @return {array}          List of objects describing the query strings
	 */
	var getQueryStrings = function (swagger, path, method, values) {
	  // Set the optional parameter if it's not provided
	  if (typeof values === "undefined") {
	    values = {};
	  }

	  var queryStrings = [];

	  if (typeof swagger.paths[path][method].parameters !== "undefined") {
	    for (var i in swagger.paths[path][method].parameters) {
	      var param = swagger.paths[path][method].parameters[i];
	      if (typeof param["$ref"] === "string" && !/^http/.test(param["$ref"])) {
	        param = resolveRef(swagger, param["$ref"]);
	      }
	      if (typeof param.in !== "undefined" && param.in.toLowerCase() === "query") {
	        queryStrings.push({
	          name: param.name,
	          value: typeof values[param.name] === "undefined" ? typeof param.default === "undefined" ? swagger.openapi ? "<SOME_" + (param.schema ? param.schema : { "type": "string" }).type.toUpperCase() + "_VALUE>" : "<SOME_" + param.type.toUpperCase() + "_VALUE>" : param.default + "" : values[param.name] + "" /* adding a empty string to convert to string */
	        });
	      }
	    }
	  }

	  return queryStrings;
	};

	/**
	 * Get an array of objects describing the header for a path and method pair
	 * described in the given swagger.
	 *
	 * @param  {Object} swagger Swagger document
	 * @param  {string} path    Key of the path
	 * @param  {string} method  Key of the method
	 * @return {array}          List of objects describing the header
	 */
	var getHeadersArray = function (swagger, path, method) {
	  var headers = [];

	  var pathObj = swagger.paths[path][method];

	  // 'accept' header:
	  if (typeof pathObj.consumes !== "undefined") {
	    for (var i in pathObj.consumes) {
	      var type = pathObj.consumes[i];
	      headers.push({
	        name: "accept",
	        value: type
	      });
	    }
	  }

	  // 'content-type' header:
	  if (typeof pathObj.produces !== "undefined") {
	    for (var j in pathObj.produces) {
	      var type2 = pathObj.produces[j];
	      headers.push({
	        name: "content-type",
	        value: type2
	      });
	    }
	  }

	  // headers defined in path object:
	  if (typeof pathObj.parameters !== "undefined") {
	    for (var k in pathObj.parameters) {
	      var param = pathObj.parameters[k];
	      if (typeof param.in !== "undefined" && param.in.toLowerCase() === "header") {
	        if (typeof param["$ref"] === "string") {
	          // can't handle this yet
	          if (/^http/.test(param["$ref"])) {
	            continue;
	          }
	          param = resolveRef(swagger, param["$ref"]);
	        }
	        var paramType = swagger.openapi ? param.schema.type : param.type;
	        headers.push({
	          name: param.name,
	          value: "<SOME_" + paramType.toUpperCase() + "_VALUE>"
	        });
	      }
	    }
	  }

	  // security:
	  var basicAuthDef;
	  var apiKeyAuthDef;
	  var oauthDef;

	  var secDefs = swagger.securityDefinitions || swagger.components && swagger.components.securitySchemes;
	  var securityObj = pathObj.security || swagger.security;

	  if (secDefs && securityObj) {
	    for (var l in securityObj) {
	      var secScheme = Object.keys(securityObj[l])[0];

	      var def = secDefs[secScheme];
	      if (!def || !def.type) {
	        continue;
	      }

	      var authType = def.type.toLowerCase();
	      switch (authType) {
	        case "basic":
	          basicAuthDef = secScheme;
	          break;
	        case "apikey":
	          if (def.in === "query") {
	            apiKeyAuthDef = secScheme;
	          }
	          break;
	        case "oauth2":
	          oauthDef = secScheme;
	          break;
	      }
	    }
	  }

	  if (basicAuthDef) {
	    headers.push({
	      name: "Authorization",
	      value: "Basic " + "<USERNAME:PASSWORD>"
	    });
	  } else if (apiKeyAuthDef) {
	    headers.push({
	      name: secDefs[apiKeyAuthDef].name,
	      value: "REPLACE_KEY_VALUE"
	    });
	  } else if (oauthDef) {
	    headers.push({
	      name: "Authorization",
	      value: "Bearer " + "<BEARER_TOKEN>"
	    });
	  }

	  return headers;
	};

	/**
	 * Produces array of HAR files for given Swagger document
	 *
	 * @param  {object} swagger A swagger JSON document
	 * @param  {String} [selectedServer] Optional selected server to use for har
	 * @param  {Function} callback
	 */
	var swagger2har = function (swagger, selectedServer) {

	  try {
	    // determine basePath:
	    var baseUrl = selectedServer || getBaseUrl(swagger);

	    var harList = [];
	    // iterate over Swagger paths and create HAR objects
	    Object.keys(swagger.paths).forEach(path => {
	      Object.keys(swagger.paths[path]).forEach(operation => {
	        var url = baseUrl + path;
	        var har = createHar(swagger, path, operation, baseUrl);
	        harList.push({
	          path,
	          method: operation.toUpperCase(),
	          url: url,
	          description: swagger.paths[path][operation].description || "No description available",
	          har: har
	        });
	      });
	    });

	    return harList;
	  } catch (e) {
	    console.error(e);
	    return null;
	  }
	};

	/**
	 * Returns the value referenced in the given reference string
	 *
	 * @param  {object} oai
	 * @param  {string} ref A reference string
	 * @return {any}
	 */
	var resolveRef = function (oai, ref) {
	  var parts = ref.split("/");

	  if (parts.length <= 1) return {}; // = 3

	  var recursive = function (obj, index) {
	    if (index + 1 < parts.length) {
	      // index = 1
	      var newCount = index + 1;
	      return recursive(obj[parts[index]], newCount);
	    } else {
	      return obj[parts[index]];
	    }
	  };
	  return recursive(oai, 1);
	};

	exports.createHar = createHar;
	exports.swagger2har = swagger2har;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
