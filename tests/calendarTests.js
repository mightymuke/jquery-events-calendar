// Initialisation Tests

(function($) {

    var eventCalendar;

    module("EventCalendar: Initialisation", {
        setup: function() {
            var eventsInline = [{ "date": "1337594400000", "type": "meeting", "title": "Project A meeting", "description": "Lorem Ipsum dolor set", "url": "http://www.event1.com/" }];
            $('#eventCalendarDefault').eventCalendar({
                currentDate : new Date(2010, 11, 12, 13, 14, 15, 16),
                jsonData    : eventsInline
            });
	        eventCalendar = $('#eventCalendarDefault').data('eventCalendar');
        },
        teardown: function() {
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
			var eventsInline = [{ "date": "1337594400000", "type": "meeting", "title": "Project A meeting", "description": "Lorem Ipsum dolor set", "url": "http://www.event1.com/" }];
			$('#eventCalendarDefault').eventCalendar({
				currentDate : new Date(2010, 11, 12, 13, 14, 15, 16),
				jsonData    : eventsInline
			});
			eventCalendar = $('#eventCalendarDefault').data('eventCalendar');
		},
		teardown: function() {
		}
	});

	test("Start date is current", function() {
		equal(eventCalendar.eventIsCurrent({
			startDate: new Date(2013, 03, 03, 00, 00, 00).getTime(),
			endDate: new Date(2013, 03, 08, 00, 00, 00).getTime()
		}, 2013, 03, 03), true, "Start date is current for multi date range");
	});

	test("Start date is current", function() {
		equal(eventCalendar.eventIsCurrent({
			startDate: new Date(2013, 03, 03, 00, 00, 00).getTime(),
			endDate: new Date(2013, 03, 03, 00, 00, 00).getTime()
		}, 2013, 03, 03), true, "Start date is current for single date range");
	});

	test("End date is current", function() {
		equal(eventCalendar.eventIsCurrent({
			startDate: new Date(2013, 03, 03, 00, 00, 00).getTime(),
			endDate: new Date(2013, 03, 08, 00, 00, 00).getTime()
		}, 2013, 03, 08), true, "End  date is current for multi date range");
	});

	test("End date is current", function() {
		equal(eventCalendar.eventIsCurrent({
			startDate: new Date(2013, 03, 08, 00, 00, 00).getTime(),
			endDate: new Date(2013, 03, 08, 00, 00, 00).getTime()
		}, 2013, 03, 08), true, "End  date is current for single date range");
	});

	test("Early date is not current", function() {
		equal(eventCalendar.eventIsCurrent({
			startDate: new Date(2013, 03, 03, 00, 00, 00).getTime(),
			endDate: new Date(2013, 03, 08, 00, 00, 00).getTime()
		}, 2013, 03, 01), false, "Early date is not current for multi date range");
	});

	test("Early date is not current", function() {
		equal(eventCalendar.eventIsCurrent({
			startDate: new Date(2013, 03, 08, 00, 00, 00).getTime(),
			endDate: new Date(2013, 03, 08, 00, 00, 00).getTime()
		}, 2013, 03, 01), false, "Early date is not current for single date range");
	});

	test("Late date is not current", function() {
		equal(eventCalendar.eventIsCurrent({
			startDate: new Date(2013, 03, 03, 00, 00, 00).getTime(),
			endDate: new Date(2013, 03, 08, 00, 00, 00).getTime()
		}, 2013, 03, 10), false, "Late date is not current for multi date range");
	});

	test("Late date is not current", function() {
		equal(eventCalendar.eventIsCurrent({
			startDate: new Date(2013, 03, 08, 00, 00, 00).getTime(),
			endDate: new Date(2013, 03, 08, 00, 00, 00).getTime()
		}, 2013, 03, 10), false, "Late date is not current for single date range");
	});

}(jQuery));

// Event type tests

(function($) {

	var eventCalendar;

	module("Event Type Enum", {
		setup: function() {
			var eventsInline = [{ "date": "1337594400000", "type": "meeting", "title": "Project A meeting", "description": "Lorem Ipsum dolor set", "url": "http://www.event1.com/" }];
			$('#eventCalendarDefault').eventCalendar({
				currentDate : new Date(2010, 11, 12, 13, 14, 15, 16),
				jsonData    : eventsInline
			});
			eventCalendar = $('#eventCalendarDefault').data('eventCalendar');
		},
		teardown: function() {
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
