import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Mongo } from 'meteor/mongo';

const ApiHistory = new Mongo.Collection('api_history');

import './main.html';

Template.body.helpers({
  // get the 10 most recent api history records
  apiHistoryRecords() {
    return ApiHistory.find({}, {sort: {timestamp: -1}, limit: 10});
  }
});

Template.apiHistoryNew.events({
  'click button.addHistory'(event, instance) {
    // get all the form fields for a new history record
    var $inputs = instance.$('input');

    // build api history record
    var apiHistory = {};
    $inputs.each((i, input) => {
      apiHistory[input.name] = input.value
    });
    apiHistory.timestamp = new Date();

    // insert api history record
    ApiHistory.insert(apiHistory);

    // clear values of inputs
    $inputs.val('');
  }
});
