// Initialisation Tests

(function($) {

    var eventCalendar;

    module("EventCalendar: Initialisation", {
        setup: function() {
            $('body').append('<div id="eventCalendarDefault" style="visibility: hidden; display: none;"></div>');
            var eventsInline = [{ "date": "1337594400000", "type": "meeting", "title": "Project A meeting", "description": "Lorem Ipsum dolor set", "url": "http://www.event1.com/" }];
            $('#eventCalendarDefault').eventCalendar({
                currentDate : new Date(2010, 11, 12, 13, 14, 15, 16),
                jsonData    : eventsInline
            });
            eventCalendar = $('#eventCalendarDefault').data('eventCalendar');
        },
        teardown: function() {
            $('#eventCalendarDefault').remove();
        }
    });

    test("Calendar is initialised", function() {
        ok(eventCalendar, "Event calendar is null");
    });

    test("Settings are defaulted", function() {
        equal(eventCalendar.settings.textGoToEventUrl, "See the event", "Default option passed in was used");
    });

    test("Settings can be passed in", function() {
        equal(eventCalendar.settings.currentDate.toString(), (new Date(2010, 11, 12, 13, 14, 15, 16)).toString(), "Date option passed in was used");
    });

}(jQuery));

// Date matching tests

(function($) {

    var eventCalendar;

    module("Date Matching", {
        setup: function() {
            $('body').append('<div id="eventCalendarDefault" style="visibility: hidden; display: none;"></div>');
            var eventsInline = [{ "date": "1337594400000", "type": "meeting", "title": "Project A meeting", "description": "Lorem Ipsum dolor set", "url": "http://www.event1.com/" }];
            $('#eventCalendarDefault').eventCalendar({
                currentDate : new Date(2010, 11, 12, 13, 14, 15, 16),
                jsonData    : eventsInline
            });
            eventCalendar = $('#eventCalendarDefault').data('eventCalendar');
        },
        teardown: function() {
            $('#eventCalendarDefault').remove();
        }
    });

    test("Start date is current", function() {
        equal(eventCalendar.eventIsCurrent({
            startDate: new Date(2013, 3, 3, 0, 0, 0).getTime(),
            endDate: new Date(2013, 3, 8, 0, 0, 0).getTime()
        }, 2013, 3, 3), true, "Start date is current for multi date range");
    });

    test("Start date is current", function() {
        equal(eventCalendar.eventIsCurrent({
            startDate: new Date(2013, 3, 3, 0, 0, 0).getTime(),
            endDate: new Date(2013, 3, 3, 0, 0, 0).getTime()
        }, 2013, 3, 3), true, "Start date is current for single date range");
    });

    test("End date is current", function() {
        equal(eventCalendar.eventIsCurrent({
            startDate: new Date(2013, 3, 3, 0, 0, 0).getTime(),
            endDate: new Date(2013, 3, 8, 0, 0, 0).getTime()
        }, 2013, 3, 8), true, "End  date is current for multi date range");
    });

    test("End date is current", function() {
        equal(eventCalendar.eventIsCurrent({
            startDate: new Date(2013, 3, 8, 0, 0, 0).getTime(),
            endDate: new Date(2013, 3, 8, 0, 0, 0).getTime()
        }, 2013, 3, 8), true, "End  date is current for single date range");
    });

    test("Early date is not current", function() {
        equal(eventCalendar.eventIsCurrent({
            startDate: new Date(2013, 3, 3, 0, 0, 0).getTime(),
            endDate: new Date(2013, 3, 8, 0, 0, 0).getTime()
        }, 2013, 3, 1), false, "Early date is not current for multi date range");
    });

    test("Early date is not current", function() {
        equal(eventCalendar.eventIsCurrent({
            startDate: new Date(2013, 3, 8, 0, 0, 0).getTime(),
            endDate: new Date(2013, 3, 8, 0, 0, 0).getTime()
        }, 2013, 3, 1), false, "Early date is not current for single date range");
    });

    test("Late date is not current", function() {
        equal(eventCalendar.eventIsCurrent({
            startDate: new Date(2013, 3, 3, 0, 0, 0).getTime(),
            endDate: new Date(2013, 3, 8, 0, 0, 0).getTime()
        }, 2013, 3, 10), false, "Late date is not current for multi date range");
    });

    test("Late date is not current", function() {
        equal(eventCalendar.eventIsCurrent({
            startDate: new Date(2013, 3, 8, 0, 0, 0).getTime(),
            endDate: new Date(2013, 3, 8, 0, 0, 0).getTime()
        }, 2013, 3, 10), false, "Late date is not current for single date range");
    });

}(jQuery));

// Event type tests

(function($) {

    var eventCalendar;

    module("Event Type Enum", {
        setup: function() {
            $('body').append('<div id="eventCalendarDefault" style="visibility: hidden; display: none;"></div>');
            var eventsInline = [{ "date": "1337594400000", "type": "meeting", "title": "Project A meeting", "description": "Lorem Ipsum dolor set", "url": "http://www.event1.com/" }];
            $('#eventCalendarDefault').eventCalendar({
                currentDate : new Date(2010, 11, 12, 13, 14, 15, 16),
                jsonData    : eventsInline
            });
            eventCalendar = $('#eventCalendarDefault').data('eventCalendar');
        },
        teardown: function() {
            $('#eventCalendarDefault').remove();
        }
    });

    test("Event Type: Multi", function() {
        var et = eventCalendar.EventTypes.MULTI;
        equal(et.name, "multi", "Defined multi name is as expected");
    });

    test("Event Type: Single", function() {
        var et = eventCalendar.EventTypes.SINGLE;
        equal(et.name, "single", "Defined single name is as expected");
    });

}(jQuery));

// Event Recurrence item

(function($) {

    module("Event Recurrence", {
        setup: function() {
        },
        teardown: function() {
        }
    });

    test("No Recurrence", function() {
        var recurrence = { type: "none", interval: 3 };
        var er = $('body').eventCalendar.eventRecurrence(recurrence);
        equal(er.type, "none", "No recurrence");
        equal(er.interval, 0, "Number of intervals");
    });

    test("Daily Recurrence", function() {
        var recurrence = { type: "day", interval: 1 };
        var er = $('body').eventCalendar.eventRecurrence(recurrence);
        equal(er.type, "day", "Daily recurrence");
        equal(er.interval, 1, "Number of intervals");
    });

    test("Weekly Recurrence", function() {
        var recurrence = { type: "week", interval: 2 };
        var er = $('body').eventCalendar.eventRecurrence(recurrence);
        equal(er.type, "week", "Weekly recurrence");
        equal(er.interval, 2, "Number of intervals");
    });

    test("Monthly Recurrence", function() {
        var recurrence = { type: "month", interval: 3 };
        var er = $('body').eventCalendar.eventRecurrence(recurrence);
        equal(er.type, "month", "Monthly recurrence");
        equal(er.interval, 3, "Number of intervals");
    });

    test("Annually Recurrence", function() {
        var recurrence = { type: "year", interval: 69 };
        var er = $('body').eventCalendar.eventRecurrence(recurrence);
        equal(er.type, "year", "Annual recurrence");
        equal(er.interval, 69, "Number of intervals");
    });

    test("Invalid Recurrence", function() {
        var recurrence = { type: "somethingrandom", interval: 4 };
        var er = $('body').eventCalendar.eventRecurrence(recurrence);
        equal(er.type, "none", "No recurrence");
        equal(er.interval, 0, "Number of intervals");
    });

    test("Invalid Interval", function() {
        var recurrence = { type: "day", interval: "car" };
        var er = $('body').eventCalendar.eventRecurrence(recurrence);
        equal(er.type, "none", "No recurrence");
        equal(er.interval, 0, "Number of intervals");
    });

    test("Zero Interval", function() {
        var recurrence = { type: "day", interval: 0 };
        var er = $('body').eventCalendar.eventRecurrence(recurrence);
        equal(er.type, "none", "No recurrence");
        equal(er.interval, 0, "Number of intervals");
    });

    test("Negative Interval", function() {
        var recurrence = { type: "day", interval: -4 };
        var er = $('body').eventCalendar.eventRecurrence(recurrence);
        equal(er.type, "none", "No recurrence");
        equal(er.interval, 0, "Number of intervals");
    });

}(jQuery));
