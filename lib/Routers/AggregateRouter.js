'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AggregateRouter = undefined;

var _ClassesRouter = require('./ClassesRouter');

var _ClassesRouter2 = _interopRequireDefault(_ClassesRouter);

var _rest = require('../rest');

var _rest2 = _interopRequireDefault(_rest);

var _middlewares = require('../middlewares');

var middleware = _interopRequireWildcard(_middlewares);

var _node = require('parse/node');

var _node2 = _interopRequireDefault(_node);

var _UsersRouter = require('./UsersRouter');

var _UsersRouter2 = _interopRequireDefault(_UsersRouter);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const BASE_KEYS = ['where', 'distinct'];

const PIPELINE_KEYS = ['addFields', 'bucket', 'bucketAuto', 'collStats', 'count', 'currentOp', 'facet', 'geoNear', 'graphLookup', 'group', 'indexStats', 'limit', 'listLocalSessions', 'listSessions', 'lookup', 'match', 'out', 'project', 'redact', 'replaceRoot', 'sample', 'skip', 'sort', 'sortByCount', 'unwind'];

const ALLOWED_KEYS = [...BASE_KEYS, ...PIPELINE_KEYS];

class AggregateRouter extends _ClassesRouter2.default {

  handleFind(req) {
    const body = Object.assign(req.body, _ClassesRouter2.default.JSONFromQuery(req.query));
    const options = {};
    let pipeline = [];

    if (Array.isArray(body)) {
      pipeline = body.map(stage => {
        const stageName = Object.keys(stage)[0];
        return this.transformStage(stageName, stage);
      });
    } else {
      const stages = [];
      for (const stageName in body) {
        stages.push(this.transformStage(stageName, body));
      }
      pipeline = stages;
    }
    if (body.distinct) {
      options.distinct = String(body.distinct);
    }
    options.pipeline = pipeline;
    if (typeof body.where === 'string') {
      body.where = JSON.parse(body.where);
    }
    return _rest2.default.find(req.config, req.auth, this.className(req), body.where, options, req.info.clientSDK).then(response => {
      for (const result of response.results) {
        if (typeof result === 'object') {
          _UsersRouter2.default.removeHiddenProperties(result);
        }
      }
      return { response };
    });
  }

  transformStage(stageName, stage) {
    if (ALLOWED_KEYS.indexOf(stageName) === -1) {
      throw new _node2.default.Error(_node2.default.Error.INVALID_QUERY, `Invalid parameter for query: ${stageName}`);
    }
    if (stageName === 'group') {
      if (stage[stageName].hasOwnProperty('_id')) {
        throw new _node2.default.Error(_node2.default.Error.INVALID_QUERY, `Invalid parameter for query: group. Please use objectId instead of _id`);
      }
      if (!stage[stageName].hasOwnProperty('objectId')) {
        throw new _node2.default.Error(_node2.default.Error.INVALID_QUERY, `Invalid parameter for query: group. objectId is required`);
      }
      stage[stageName]._id = stage[stageName].objectId;
      delete stage[stageName].objectId;
    }
    return { [`$${stageName}`]: stage[stageName] };
  }

  mountRoutes() {
    this.route('GET', '/aggregate/:className', middleware.promiseEnforceMasterKeyAccess, req => {
      return this.handleFind(req);
    });
  }
}

exports.AggregateRouter = AggregateRouter;
exports.default = AggregateRouter;
//# sourceMappingURL=AggregateRouter.js.map