import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Mongo } from 'meteor/mongo';

const ApiHistoryRecent = new Mongo.Collection('apiHistoryRecent');

import './main.html';

// subscribed to the most recent api calls
Meteor.subscribe('apiHistoryRecent');

Template.body.helpers({
  // get all the records that have been subscribed to
  recentApiHistory() {
    return ApiHistoryRecent.find({}, {sort: {timestamp: -1}});
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

    // insert api history record
    Meteor.call('addApiHistory', apiHistory)

    // clear values of inputs
    $inputs.val('');
  }
});

Template.loadMoreHistory.onCreated(function() {
  this.offset = 0
});

Template.loadMoreHistory.events({
  // load 50 more history records
  'click button.loadMore'(event, instance) {
    instance.offset += 50;
    Meteor.call('loadApiHistory', instance.offset);
  }
});
