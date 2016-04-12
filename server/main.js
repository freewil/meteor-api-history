import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

const d = function (str) {
  console.error(str);
};

const ApiHistory = new Mongo.Collection('api_history');

const ONE_MIN = 60 * 1000;

/**
 * Get Api call history of a given offset
 *
 * @param {Integer} offset
 * @return {Mongo.Cursor}
 */
const getHistory = (offset) => {
  return ApiHistory.find({}, {sort: {timestamp: -1}, limit: 50, skip: offset});
};

// reference to apiHistoryRecent virtual collection handle
var apiHistoryRecent;

// publish 50 most recent api calls at a time
Meteor.publish('apiHistoryRecent', function() {
  var self = apiHistoryRecent = this;

  var handle = getHistory(0).observeChanges({
    added: function(id, fields) {
      d('added: ' + id);
      self.added('apiHistoryRecent', id, fields);
    },
    removed: function(id) {
      d('removed: ' + id);
      self.removed('apiHistoryRecent', id);
    }
  });

  // mark subscription as ready
  this.ready();

  // stop observing cursor when client unsubscribes
  this.onStop(() => {
    handle.stop();
  });

});

Meteor.methods({

  /**
   * Allow client to create a new API history record.
   */
  addApiHistory: (apiHistory) => {
    // make sure time is at least 1 min since most recent record
    var last = ApiHistory.findOne({}, {sort: {timestamp: -1}});
    if (last) {
      var time = last.timestamp.getTime() + ONE_MIN;
    } else {
      var time = Date.now();
    }
    apiHistory.timestamp = new Date(time);
    d('addApiHistory', apiHistory);

    // insert it!
    var id = ApiHistory.insert(apiHistory);
    d('insert: ' + id);
  },

  /**
   * Loads more api call history records into virtual `apiHistoryRecent` collection.
   */
  loadApiHistory: (offset) => {
    getHistory(offset).fetch().forEach((record) => {
      apiHistoryRecent.added('apiHistoryRecent', record._id, record);
    });
  }

});

Meteor.startup(() => {
  // seed dev database with dummy data if it's empty
  if (process.env.NODE_ENV === 'development') {
    const now = Date.now();

    const clients = ['Firefox/3.1', 'Chrome/101', 'curl/7.43.0', 'lynx/2.8'];
    const endpoints = [
      'GET /',
      'GET /customers',
      'GET /customers/1',
      'DELETE /customers/2',
      'POST /customers',
      'PUT /customers/6'
    ];
    const results = ['success', 'error'];
    const rand = (array) => {
      var min = 0;
      var maxExclusive = array.length;
      var i = Math.floor(Math.random() * (maxExclusive - min)) + min;
      return array[i];
    };

    /**
     * Generate a random api history record.
     *
     * @param {Integer} i
     * @return {Object}
     */
    const randomApiHistory = (i) => {
      return {
        timestamp: new Date(now + (i * ONE_MIN)), // 1 minute increments
        client: rand(clients),
        endpoint: rand(endpoints),
        result: rand(results)
      };
    };

    /**
     * Seed API History collection with dummy data records.
     *
     * @param {Integer} n
     * @return {Void}
     */
    const seed = (n) => {
      // don't seed database if there are records already in it
      var count = ApiHistory.find({}).count();
      if (count > 0) {
        console.error(`Database already seeded (${count} records)`);
        return;
      }

      // seed database with `n` records
      for (let i = 0; i < n; i++) {
        ApiHistory.insert(randomApiHistory(i));
      }
      console.error(`Seeded ${n} api_history records.`);
    };

    seed(1000);
  }
});
