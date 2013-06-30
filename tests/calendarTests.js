// Initialisation Tests

(function($) {

    var eventCalendar;
    window.DEBUG = false;

    module("EventCalendar: Initialisation", {
        setup: function() {
            $('body').append('<div id="eventCalendarDefault" style="visibility: hidden; display: none;"></div>');
            var eventsInline = [{ "startDate": "1337594400000", "classDetail": "meeting", "title": "Project A meeting", "description": "Lorem Ipsum dolor set", "url": "http://www.event1.com/" }];
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

    test("Event calendar with data", function() {
        $('#eventCalendarDefault').remove();
        $('body').append('<div id="eventCalendarDefault" style="visibility: hidden; display: none;"></div>');
        var eventValue = new Array();
        var eventItem = {
            "startDate"    : "" + (new Date(2013, 4-1, 27, 0, 0, 0)).getTime(),
            "endDate"      : "" + (new Date("2013", parseInt("8")-1, "11", 0, 0, 0)).getTime(),
            "recurrence"   : { type: 'none', interval: 0 },
            "classDetail"  : "event-test",
            "title"        : "<div onclick='toggleView($(\"#eventDetail-the-paradise-project-sue-cooke\").parent(\"div\")); return selectEvent(\"#accordion\", \"a#eventDetail-the-paradise-project-sue-cooke\");'><div style='float:left;'>The Paradise Project:  Sue Cooke</div><div style='float:right;'><a>View Details</a></div><div style='clear: both;'></div></div><div class='eventTitleDate'>27 Apr - 11 Aug 13</div>",
            "description"  : $("#eventDetail-the-paradise-project-sue-cooke").html(),
            "url"          : ""
        };
        eventValue.push(eventItem);

        eventItem = {
            "startDate"    : "" + (new Date(2013, 6-1, 7, 0, 0, 0)).getTime(),
            "endDate"      : "" + (new Date("2013", parseInt("9")-1, "1", 0, 0, 0)).getTime(),
            "recurrence"   : { type: 'none', interval: 0 },
            "classDetail"  : "event-test",
            "title"        : "<div onclick='toggleView($(\"#eventDetail-eqwrweq\").parent(\"div\")); return selectEvent(\"#accordion\", \"a#eventDetail-eqwrweq\");'><div style='float:left;'> Sarjeant Gallery Te Whare o Rehua o Whanganui</div><div style='float:right;'><a>View Details</a></div><div style='clear: both;'></div></div><div class='eventTitleDate'>07 Jun - 01 Sep 13</div>",
            "description"  : $("#eventDetail-eqwrweq").html(),
            "url"          : ""
        };
        eventValue.push(eventItem);

        $("#eventCalendarDefault").eventCalendar({
            collapsible              : true,
            eventsScrollable         : false,
            eventsLimit              : 200,
            initialEventList         : "day",
            jsonData                 : eventValue,
            showDescription          : false,
            textGoToEventUrl         : "See the Event",
            textNextEvents           : "Upcoming Events:",
            textNoEvents             : "Unfortunately we have not been advised of any events today. Please refer to the lower section of this page for Upcoming Events. Alternatively, check out our Things To Do section.",
            textCalendarTitle        : "Ex\\hibi\\tion\\s for MMMM yyyy",
            textEventHeaderDayView   : "ddS MMMM Li\\s\\ting\\s:",
            textEventHeaderMonthView : "MMMM Li\\s\\ting\\s:",
        });
        eventCalendar = $('#eventCalendarDefault').data('eventCalendar');
        ok(eventCalendar, "Event calendar is null");
    });

}(jQuery));

// Date matching tests
/*
(function($) {

    var eventCalendar;
    window.DEBUG = false;

    module("Date Matching", {
        setup: function() {
            $('body').append('<div id="eventCalendarDefault" style="visibility: hidden; display: none;"></div>');
            var eventsInline = [{ "startDate": "1337594400000", "classDetail": "meeting", "title": "Project A meeting", "description": "Lorem Ipsum dolor set", "url": "http://www.event1.com/" }];
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
*/
// Event Recurrence item

(function($) {

    window.DEBUG = false;

    module("Event Recurrence", {
        setup: function() {
        },
        teardown: function() {
        }
    });

    test("No Recurrence", function() {
        var recurrence = { type: "none", interval: 3 };
        var er = new $.EventRecurrence(recurrence);
        equal(er.type, "none", "No recurrence");
        equal(er.interval, 0, "Number of intervals");
    });

    test("Daily Recurrence", function() {
        var recurrence = { type: "day", interval: 1 };
        var er = new $.EventRecurrence(recurrence);
        equal(er.type, "day", "Daily recurrence");
        equal(er.interval, 1, "Number of intervals");
    });

    test("Weekly Recurrence", function() {
        var recurrence = { type: "week", interval: 2 };
        var er = new $.EventRecurrence(recurrence);
        equal(er.type, "week", "Weekly recurrence");
        equal(er.interval, 2, "Number of intervals");
    });

    test("Monthly Recurrence", function() {
        var recurrence = { type: "month", interval: 3 };
        var er = new $.EventRecurrence(recurrence);
        equal(er.type, "month", "Monthly recurrence");
        equal(er.interval, 3, "Number of intervals");
    });

    test("Annually Recurrence", function() {
        var recurrence = { type: "year", interval: 69 };
        var er = new $.EventRecurrence(recurrence);
        equal(er.type, "year", "Annual recurrence");
        equal(er.interval, 69, "Number of intervals");
    });

    test("Invalid Recurrence", function() {
        var recurrence = { type: "somethingrandom", interval: 4 };
        var er = new $.EventRecurrence(recurrence);
        equal(er.type, "none", "No recurrence");
        equal(er.interval, 0, "Number of intervals");
    });

    test("Invalid Interval", function() {
        var recurrence = { type: "day", interval: "car" };
        var er = new $.EventRecurrence(recurrence);
        equal(er.type, "none", "No recurrence");
        equal(er.interval, 0, "Number of intervals");
    });

    test("Zero Interval", function() {
        var recurrence = { type: "day", interval: 0 };
        var er = new $.EventRecurrence(recurrence);
        equal(er.type, "none", "No recurrence");
        equal(er.interval, 0, "Number of intervals");
    });

    test("Negative Interval", function() {
        var recurrence = { type: "day", interval: -4 };
        var er = new $.EventRecurrence(recurrence);
        equal(er.type, "none", "No recurrence");
        equal(er.interval, 0, "Number of intervals");
    });

}(jQuery));

// Event Item

(function($) {

    window.DEBUG = false;

    module("Event Item", {
        setup: function() {
        },
        teardown: function() {
        }
    });

    test("event with no recurrence", function() {
        var event = {
            startDate  : new Date(2013, 3, 8, 0, 0, 0).getTime(),
            recurrence : {
                type     : 'none',
                interval : 3
            }
        };
        var ei = new $.EventItem(event);
        equal(ei.recurrence.type, "none", "No recurrence");
        equal(ei.recurrence.interval, 0, "Number of intervals");
    });

    test("event with daily recurrence", function() {
        var event = {
            startDate  : new Date(2013, 3, 8, 0, 0, 0).getTime(),
            recurrence : {
                type     : 'day',
                interval : 1
            }
        };
        var ei = new $.EventItem(event);
        equal(ei.recurrence.type, "day", "Daily recurrence");
        equal(ei.recurrence.interval, 1, "Number of intervals");
    });

}(jQuery));
