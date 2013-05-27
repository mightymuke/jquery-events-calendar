(function( $ ) {

    var eventCalendar;

    module( "EventCalendar: Initialisation", {
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
		equal(eventCalendar.settings.txt_GoToEventUrl, "See the event", "Default option passed in was used");
	});

	test("Settings can be passed in", function() {
		equal(eventCalendar.settings.currentDate.toString(), (new Date(2010, 11, 12, 13, 14, 15, 16)).toString(), "Date option passed in was used");
	});
/*
    test("Current date is initialised", function() {
        equal(eventCalendar.flags.currentDay, 12, "Current Day set correctly");
        equal(eventCalendar.flags.currentMonth, 11, "Month set correctly");
        equal(eventCalendar.flags.currentYear, 2010, "Year set correctly");
    });
*/
   // test("testme", function() {
   //     equal(eventCalendar.publicMethod(), 3, "Current Day set correctly");
   // });

}( jQuery ) );
