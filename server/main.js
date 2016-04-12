import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

const ApiHistory = new Mongo.Collection('api_history');

/**
 * Get Api call history of a given offset
 *
 * @param {Integer} offset
 * @return {Mongo.Cursor}
 */
const getHistory = (offset) => {
  return ApiHistory.find({}, {sort: {timestamp: -1}, limit: 50, skip: offset});
}

// reference to apiHistoryRecent virtual collection handle
var apiHistoryRecent;

// publish 50 most recent api calls at a time
Meteor.publish('apiHistoryRecent', function() {
  var offset = 0;
  var self = apiHistoryRecent = this;

  var handle = getHistory(offset).observeChanges({
    added: function(id, fields) {
      self.added('apiHistoryRecent', id, fields);
    },
    removed: function(id) {
      self.removed(id);
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
    ApiHistory.insert(apiHistory);
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

    /**
     * Generate a random api history record.
     *
     * @param {Integer} i
     * @return {Object}
     */
    const randomApiHistory = (i) => {
      return {
        timestamp: new Date(now + (i * 1000 * 60)), // 1 minute increments
        client: 'Bob ' + i,
        endpoint: 'GET /users',
        result: 'success'
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
