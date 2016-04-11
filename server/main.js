import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

const ApiHistory = new Mongo.Collection('api_history');

const randomApiHistory = () => {
  return {
    timestamp: new Date(),
    client: 'Bob',
    endpoint: 'GET /users',
    result: 'success'
  };
}

const seedApiHistory = (n) => {
  for (let i = 0; i < n; i++) {
    ApiHistory.insert(randomApiHistory());
  }
}

// seed database with 1000 api history entries on startup
Meteor.startup(() => {
  // console.error('Seeding Api History...');
  // seedApiHistory(100);
  // console.error('Database seed complete');
});
