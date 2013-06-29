/**
 * @preserve: jquery.eventCalendar.js
 * @version:  0.60
 * @author:   Jaime Fernandez (@vissit)
 * @company:  Paradigma Tecnologico (@paradigmate)
 * @date:     2013-06-29
 * @website:  http://www.vissit.com/projects/eventCalendar/
 */

/*
    JSON data format:
        startDate        : event start date - either in timestamp format or 'YYYY-MM-DD HH:MM:SS'
        endDate          : event end date - used if event spans a number of days (defaults to startDate)
        listingStartDate : listing start date for this event (defaults to startDate)
        listingEndDate   : listing end date for this event (defaults to endDate)
        recurrence       : event recurring type
                         : - JSON format:
                         :     type - the type of repetition: 'day', 'week', 'month', 'year'
                         :     interval - the interval between events in the "type" units
                         :     day and count2 - define a day of a month (first Monday, third Friday, etc)
                         :     frequency - an array of week days (Sunday is 0)
                         :     end - when the recurrence should end - either 'none' (default), number of times, or a date
                         : - Examples of the rec_type data:
                         :     { type: 'day', interval: 3 } - every three days
                         :     { type: 'month', interval: 2 } - every two months
                         :     { type: 'month', interval: 1, ???? _1_2_ - second Monday of each month
                         :     { type: 'week', interval: 2, frequency: [1,5] } - Monday and Friday of each second week
        classDetail      : event class - used to generate a class for styling the detail section
        title            : event name - becomes the header line
        description      : event description - becomes the detail (optionally hidden)
        url              : url of page containing event details
    Obsolete:
        date             : event date either in timestamp format or 'YYYY-MM-DD HH:MM:SS'
        type             : event class - used to generate a class for styling the detail section
*/

/**
 * Enable debugging
 * - anything contained in a block with a DEBUG check is automatically removed by uglify-js
 *   http://jstarrdewar.com/blog/2013/02/28/use-uglify-to-automatically-strip-debug-messages-from-your-javascript
 *
 * JSLint doesn't like this typeof notation, but we must use this particular check
 * for uglify-js to correctly remove the "dead code". I have searched (for hours) for
 * a way to either remove this particular JSLint check, or to hide this line completely
 * from JSLint, but unfortunately I was unable to do it. If we do it the way JSLint
 * wants then it always throws an exception (as the undefined check doesn't work for
 * global variables) and the only workaround was to explicitly specify the global
 * context (window), but that stopped uglify-js from correctly removing the code.
 */
if (typeof DEBUG === 'undefined') { DEBUG = true; }

/**
 * Event Calendar Plugin
 */
(function($) {
    "use strict";

    /**
     * EventRecurrence - defines recurrence functionality for an event
     * @param {object} recurrence          JSON object defining recurrence properties
     * @param {function(string)=} onError  Function to call should an error occur
     * @constructor
     */
    function EventRecurrence(recurrence, onError) {
        var $EventRecurrence = this;
        var _error = false;

        $EventRecurrence.type = 'none';
        $EventRecurrence.interval = 0;

        // TODO - add support for the following:
        //   day and count2 - define a day of a month (first Monday, third Friday, etc)
        //   frequency - an array of week days (Sunday is 0)
        //   end - when the recurrence should end - either 'none' (default), number of times, or a date

        /**
         * Initialises the recurrence properties to no recurrence
         * @private
         */
        var _setRecurrenceToNone = function() {
            $EventRecurrence.type = 'none';
            $EventRecurrence.interval = 0;
        };

        /**
         * Runs the error callback if provided, and puts the recurrence into an error state
         * @param {string} msg   Error message
         * @private
         */
        var _recurrenceError = function(msg) {
            if (msg && onError) { onError(msg); }
            _setRecurrenceToNone();
            _error = true;
        };

        /**
         * Initialises the recurrence object from the JSON properties provided
         * @private
         */
        var _initialise = function() {
            _setRecurrenceToNone();
            if ((!recurrence) || (!recurrence.type)) {
                _recurrenceError("No recurrence data provided");
                return;
            }

            if (DEBUG) { console.log("Defining new recurrence: " + JSON.stringify(recurrence)); }
            var recurType = recurrence.type.toLowerCase();
            if (recurType === 'none') { return; }
            if ($.inArray(recurType, ['day', 'week', 'month', 'year']) < 0) {
                _recurrenceError("Invalid recurrence type: " + recurType);
                return;
            }

            $EventRecurrence.type = recurType;
            $EventRecurrence.interval = recurrence.interval ? parseInt(recurrence.interval, 10) : 0;
            if ((!$EventRecurrence.interval) || ($EventRecurrence.interval < 1)) {
                _recurrenceError("Invalid recurrence interval: " + $EventRecurrence.interval);
                return;
            }
        };

        _initialise();
    }

    /**
     * Simple DTO type object to contain details of an event
     * @constructor
     */
    function EventInstance() {
        var $EventInstance = this;

        $EventInstance.type = 'none';
        $EventInstance.eventStartDate = null;
        $EventInstance.eventEndDate = null;
        $EventInstance.listingStartDate = null;
        $EventInstance.listingEndDate = null;
    }

    /**
     * EventItem - defines a calendar event
     * @param {object} event               JSON object defining the event properties
     * @param {string=} dateFormat         Date format used for the event dates
     * @param {function(string)=} onError  Function to call should an error occur
     * @constructor
     */
    function EventItem(event, dateFormat, onError) {
        var $EventItem = this;
        var _index = 0;
        var _error = false;

        $EventItem.type = 'none';
        $EventItem.recurrence = null;
        $EventItem.eventStartDate = null;
        $EventItem.eventEndDate = null;
        $EventItem.listingStartDate = null;
        $EventItem.listingEndDate = null;

        /**
         * Gets the recurrence for this event (if no recurrence, returns the event)
         * @param  {string=} month   The month to constrain the events to
         * @return {EventInstance}   The first instance of the event
         */
        var _getEvent = function(month) {
            if (_index < 0) { _index = 0; }
            if ((_index > 0) && ((!$EventItem.recurrence) || ($EventItem.recurrence.type === 'none'))) {
                return null;
            }

            var eventDate = new Date($EventItem.date);
            var eventStartDate = new Date($EventItem.startDate);
            var eventEndDate = new Date($EventItem.endDate);

            // DEBT: We should probably do this properly with subclasses
            var i = 0;
            while (i < _index) {
                switch ($EventItem.recurrence.type) {
                case 'day':
                    eventDate = eventDate ? eventDate.addDays($EventItem.recurrence.interval) : null;
                    eventStartDate = eventStartDate ? eventStartDate.addDays($EventItem.recurrence.interval) : null;
                    eventEndDate = eventEndDate ? eventEndDate.addDays($EventItem.recurrence.interval) : null;
                    break;
                case 'week':
                    eventDate = eventDate ? eventDate.addWeeks($EventItem.recurrence.interval) : null;
                    eventStartDate = eventStartDate ? eventStartDate.addWeeks($EventItem.recurrence.interval) : null;
                    eventEndDate = eventEndDate ? eventEndDate.addWeeks($EventItem.recurrence.interval) : null;
                    break;
                case 'month':
                    eventDate = eventDate ? eventDate.addMonths($EventItem.recurrence.interval) : null;
                    eventStartDate = eventStartDate ? eventStartDate.addMonths($EventItem.recurrence.interval) : null;
                    eventEndDate = eventEndDate ? eventEndDate.addMonths($EventItem.recurrence.interval) : null;
                    break;
                case 'year':
                    eventDate = eventDate ? eventDate.addYears($EventItem.recurrence.interval) : null;
                    eventStartDate = eventStartDate ? eventStartDate.addYears($EventItem.recurrence.interval) : null;
                    eventEndDate = eventEndDate ? eventEndDate.addYears($EventItem.recurrence.interval) : null;
                    break;
                }
                i += 1;
            }

            var ei = new EventInstance();
            ei.type = $EventItem.type;
            ei.eventStartDate = eventStartDate;
            ei.eventEndDate = eventEndDate;
            ei.listingStartDate = eventStartDate;
            ei.listingEndDate = eventEndDate;
            return ei;
        };

        /**
         * Initialises the recurrence properties to no recurrence
         * @private
         */
        var _setEventToNone = function() {
            $EventItem.recurrence = null;
            $EventItem.eventStartDate = null;
            $EventItem.eventEndDate = null;
            $EventItem.listingStartDate = null;
            $EventItem.listingEndDate = null;
        };

        /**
         * Runs the error callback if provided, and puts the event item into an error state
         * @param {string} msg Error message
         * @private
         */
        var _eventItemError = function(msg) {
            if (msg && onError) { onError(msg); }
            _setEventToNone();
            _error = true;
        };

        /**
         * Creates a new date object from the date argument
         * @param {Date|number|string} date  Date to be converted to a "real boy"
         * @returns {Date}                   Date object representing date argument
         * @private
         */
        var _newDate = function (date) {
            var newDate;
            if (typeof date === "object" && date.getMonth) {
                newDate = new Date(date);
            } else if (typeof date === 'number') {
                newDate = new Date(parseInt(date, 10));
            } else {
                newDate = Date.parseExact(date, dateFormat);
            }
            return newDate;
        };

        /**
         * Initialises the event object from the event JSON object
         * @private
         */
        var _initialise = function() {
            _setEventToNone();
            if (!event) {
                _eventItemError("No event data provided");
                return;
            }

            $EventItem.recurrence = new EventRecurrence(event.recurrence);

            $EventItem.eventStartDate = event.startDate ? _newDate(event.startDate) : null;
            // Cater for obsolete date property
            if (!$EventItem.eventStartDate) {
                $EventItem.eventStartDate = event.date ? _newDate(event.date) : null;
            }
            $EventItem.eventEndDate = event.endDate ? _newDate(event.endDate) : _newDate($EventItem.eventStartDate);
            $EventItem.listingStartDate = event.listingStartDate ? _newDate(event.listingStartDate) : _newDate($EventItem.eventStartDate);
            $EventItem.listingEndDate = event.listingEndDate ? _newDate(event.listingEndDate) : _newDate($EventItem.eventEndDate);

            // Cater for obsolete type property
            if (!event.classDetail || event.classDetail.length < 1) {
                event.classDetail = event.type;
            }
        };

        /**
         * Gets the first recurrence for this event (if no recurrence, returns the event)
         * @param  {string=} month  The month to constrain the events to [Optional]
         * @return {EventInstance}  The first instance of the event
         */
        $EventItem.getFirstEvent = function(month) {
            _index = 0;
            return _getEvent(month);
        };

        /**
         * Gets the next recurrence for this recurrence event (if no recurrence and index > 0 returns null)
         * @param  {string=} month  The month to constrain the events to [Optional]
         * @return {EventInstance}  The next instance of the event
         */
        $EventItem.getNextEvent = function(month) {
            _index += 1;
            return _getEvent(month);
        };

        _initialise();
    }

    /**
     * Event Calendar - the main calendar class
     * @param {object} element   The element in the DOM that the calendar is to be attached to
     * @param {object=} options  Parameter overrides - see defaults for complete list
     */
    $.eventCalendar = function(element, options) {
        var $element = $(element);
        var plugin = this;
        var directionLeftMove = "300";
        var eventsJson = {};

        /* ========================================== */
        /* The following still needs to be refactored */
        /* ========================================== */

        var dateSlider = function(show, year, month) {
            var $eventsCalendarSlider = $("<div class='eventsCalendar-slider'></div>");
            var $eventsCalendarMonthWrap = $("<div class='eventsCalendar-monthWrap'></div>");
            var $eventsCalendarTitle = $("<div class='eventsCalendar-currentTitle'><a href='#' class='monthTitle'></a></div>");
            var $eventsCalendarArrows = $("<a href='#' class='arrow prev'><span>" + plugin.settings.textPrevious + "</span></a><a href='#' class='arrow next'><span>" + plugin.settings.textNext + "</span></a>");
            var $eventsCalendarDaysList = $("<ul class='eventsCalendar-daysList'></ul>");
            var date = new Date();
            var day;
            var dayCount;

            if (!$element.find('.eventsCalendar-slider').size()) {
                $element.prepend($eventsCalendarSlider);
                $eventsCalendarSlider.append($eventsCalendarMonthWrap);
            } else {
                $element.find('.eventsCalendar-slider').append($eventsCalendarMonthWrap);
            }

            $element.find('.eventsCalendar-monthWrap.currentMonth').removeClass('currentMonth').addClass('oldMonth');
            $eventsCalendarMonthWrap.addClass('currentMonth').append($eventsCalendarTitle, $eventsCalendarDaysList);

            // if current show current month & day
            if (show === "current") {
                day = date.getDate();
                $eventsCalendarSlider.append($eventsCalendarArrows);

            } else {
                date = new Date($element.attr('data-current-year'), $element.attr('data-current-month'),1,0,0,0); // current visible month
                day = 0; // not show current day in days list

                var moveOfMonth = 1;
                if (show === "prev") {
                    moveOfMonth = -1;
                }
                date.setMonth(date.getMonth() + moveOfMonth);

                var tmpDate = new Date();
                if (date.getMonth() === tmpDate.getMonth()) {
                    day = tmpDate.getDate();
                }
            }

            // get date portions
            var year = date.getFullYear(), // year of the events
                currentYear = (new Date).getFullYear(), // current year
                month = date.getMonth(), // 0-11
                monthToShow = month + 1;

            if (show != "current") {
                // month change
                getEvents(plugin.settings.eventsLimit, year, month, false, show);
            }

            $element
                .attr('data-current-month', month)
                .attr('data-current-year', year);

            // add current date info
            var displayDate = new Date(year, month, day, 0, 0, 0);
            $eventsCalendarTitle.find('.monthTitle').html(displayDate.toString(plugin.settings.textCalendarTitle));

            // print all month days
            var daysOnTheMonth = 32 - new Date(year, month, 32).getDate();
            var daysList = [];
            if (plugin.settings.showDayAsWeeks) {
                $eventsCalendarDaysList.addClass('showAsWeek');

                var i;
                // show day name in top of calendar
                if (plugin.settings.showDayNameInCalendar) {
                    $eventsCalendarDaysList.addClass('showDayNames');

                    var dayOfWeek = Date.today().moveToDayOfWeek(plugin.settings.startWeekOnMonday ? 1 : 0);
                    for (i = 0; i < 7; i += 1) {
                        daysList.push('<li class="eventsCalendar-day-header">' + dayOfWeek.toString(plugin.settings.dayNameFormat) + '</li>');
                        dayOfWeek.addDays(1);
                    }
                }

                var dt = new Date(year, month, 1);
                var weekDay = dt.getDay(); // day of the week where month starts

                if (plugin.settings.startWeekOnMonday) {
                    weekDay = dt.getDay() - 1;
                }
                if (weekDay < 0) { weekDay = 6; } // if -1 is because day starts on sunday(0) and week starts on monday
                for (i = weekDay; i > 0; i--) {
                    daysList.push('<li class="eventsCalendar-day empty"></li>');
                }
            }
            for (dayCount = 1; dayCount <= daysOnTheMonth; dayCount++) {
                var dayClass = "";

                if (day > 0 && dayCount === day && year === currentYear) {
                    dayClass = "today";
                }
                daysList.push('<li id="dayList_' + dayCount + '" rel="'+dayCount+'" class="eventsCalendar-day '+dayClass+'"><a href="#">' + dayCount + '</a></li>');
            }
            $eventsCalendarDaysList.append(daysList.join(''));

            $eventsCalendarSlider.css('height',$eventsCalendarMonthWrap.height()+'px');
        };

        var getEvents = function(limit, year, month, day, direction) {
            var limit = limit || 0;
            var year = year || '';
            var day = day || '';

            // to avoid problem with january (month = 0)

            if (typeof month != 'undefined') {
                var month = month;
            } else {
                var month = '';
            }

            $element.find('.eventsCalendar-loading').fadeIn();

            if (plugin.settings.jsonData) {
                // user send a json in the plugin params
                plugin.settings.cacheJson = true;

                eventsJson = plugin.settings.jsonData;
                getEventsData(eventsJson, limit, year, month, day, direction);

            } else if (!plugin.settings.cacheJson || !direction) {
                // first load: load json and save it to future filters
                $.getJSON(plugin.settings.eventsjson + "?limit=" + limit + "&year=" + year + "&month=" + month + "&day=" + day, function(data) {
                    eventsJson = data; // save data to future filters
                    getEventsData(eventsJson, limit, year, month, day, direction);
                }).error(function() {
                        showError("error getting json: ");
                    });
            } else {
                // filter previous saved json
                getEventsData(eventsJson, limit, year, month, day, direction);
            }

            $element.find('.current').removeClass('current');
            if (day > '') {
                $element.find('#dayList_'+day).addClass('current');
            }
        };

        var _highlightDays = function (eventDetails, highlighter) {
            var dateToBeChecked = new Date(eventDetails.startDate);
            var endDate = new Date(eventDetails.endDate);
            var currentYear = parseInt($element.attr('data-current-year'), 10);
            var currentMonth = parseInt($element.attr('data-current-month'), 10);
            while (dateToBeChecked.compareTo(endDate) <= 0) {
                if (dateToBeChecked.getFullYear() === currentYear && dateToBeChecked.getMonth() === currentMonth) {
                    highlighter(dateToBeChecked.getDate());
                }
                dateToBeChecked.addDays(1);
            }
        };

        /**
         * Highlights days on the calendar that contain an event
         * @param {EventItem} eventItem           The event to add to the calendar
         * @param {function(number)} highlighter  Callback to process when a day needs to be highlighted
         * @param {string=} month                 The month to constrain the events to [Optional]
         */
        plugin.highlightCalenderDays = function(eventItem, highlighter, month) {
            if ((!event) || (!highlighter)) { return; }

            var eventInstance = eventItem.getFirstEvent(month);
            while (eventInstance) {
                _highlightDays(eventInstance, highlighter);
                eventInstance = eventItem.getNextEvent(month);
            }
        };

        var getEventsData = function(data, limit, year, month, day, direction) {
            var directionLeftMove = "-=" + plugin.directionLeftMove;
            var eventContentHeight = "auto";

            var subtitle = $element.find('.eventsCalendar-list-wrap .eventsCalendar-subtitle')
            if (!direction) {
                // first load
                subtitle.html(plugin.settings.textNextEvents);
                eventContentHeight = "auto";
                directionLeftMove = "-=0";
            } else {
                var displayDate = new Date(year, month, day, 0, 0, 0);
                var headerText = (day !== '') ? displayDate.toString(plugin.settings.textEventHeaderDayView) : displayDate.toString(plugin.settings.textEventHeaderMonthView);
                subtitle.html(headerText);

                if (direction === 'prev') {
                    directionLeftMove = "+=" + plugin.directionLeftMove;
                } else if (direction === 'day' || direction === 'month') {
                    directionLeftMove = "+=0";
                    eventContentHeight = 0;
                }
            }

            $element.find('.eventsCalendar-list').animate({
                opacity: plugin.settings.moveOpacity,
                left: directionLeftMove,
                height: eventContentHeight
            }, plugin.settings.moveSpeed, function() {
                $element.find('.eventsCalendar-list').css({'left':0, 'height': 'auto'}).hide();

                var events = [];

                data = $(data).sort(sortJson); // sort event by dates

                // each event
                if (data.length) {

                    // show or hide event description
                    var eventDescClass = '';
                    if(!plugin.settings.showDescription) {
                        eventDescClass = 'hidden';
                    }
                    var eventLinkTarget = "_self";
                    if(plugin.settings.openEventInNewWindow) {
                        eventLinkTarget = '_target';
                    }

                    var i = 0;
                    $.each(data, function(key, event) {
                        if (limit === 0 || limit > i) {
                            // if month or day exist then only show matched events

                            if (plugin.eventIsCurrent(event, year, month, day)) {
                                // if initial load then load only future events
                                if (month === false && event.eventDate < new Date()) {

                                } else {
                                    var eventStringDate = event.eventDay + "/" + event.eventMonthToShow + "/" + event.eventYear;
                                    var eventTitleStyle = (plugin.eventIsToday(event, year, month, day)) ? "current" : "";
                                    if (event.url) {
                                        var eventTitle = '<a href="' + event.url + '" target="' + eventLinkTarget + '" class="eventTitle ' + eventTitleStyle + '">' + event.title + '</a>';
                                    } else {
                                        var eventTitle = '<span class="eventTitle ' + eventTitleStyle + '">' + event.title + '</span>';
                                    }
                                    events.push('<li id="' + key + '" class="' + event.classDetail + '"><time datetime="' + event.eventDate + '"><em>' + eventStringDate + '</em><small>' + event.eventHour + ":" + event.eventMinute + '</small></time>' + eventTitle + '<div class="eventDesc ' + eventDescClass + '">' + event.description + '</div></li>');
                                    i++;
                                }
                            }
                        }
                        var eventItem = new EventItem(event, plugin.settings.jsonDateFormat);
                        plugin.highlightCalenderDays(eventItem, function(dayOfMonth) {
                            $element.find('.currentMonth .eventsCalendar-daysList #dayList_' + dayOfMonth).addClass('dayWithEvents');
                        }, month);
                    });
                }

                // there is no events on this period
                if (!events.length) {
                    events.push('<li class="eventsCalendar-noEvents"><p>' + plugin.settings.textNoEvents + '</p></li>');
                }
                $element.find('.eventsCalendar-loading').hide();

                $element.find('.eventsCalendar-list')
                    .html(events.join(''));

                if (plugin.settings.collapsible)
                    $element.find('.eventDesc').hide();

                $element.find('.eventsCalendar-list').animate({
                    opacity: 1,
                    height: "toggle"
                }, plugin.settings.moveSpeed);
            });
            setCalendarWidth();
        };

        var changeMonth = function() {
            $element.find('.arrow').click(function(e){
                e.preventDefault();

                var lastMonthMove;
                if ($(this).hasClass('next')) {
                    dateSlider("next");
                    lastMonthMove = '-=' + directionLeftMove;
                } else {
                    dateSlider("prev");
                    lastMonthMove = '+=' + directionLeftMove;
                }

                $element.find('.eventsCalendar-monthWrap.oldMonth').animate({
                    opacity : plugin.settings.moveOpacity,
                    left    : lastMonthMove
                }, plugin.settings.moveSpeed, function() {
                    $element.find('.eventsCalendar-monthWrap.oldMonth').remove();
                });
            });
        };

        var sortJson = function(a, b){
            var aDate = (a.eventType === plugin.EventTypes.MULTI.name) ? a.startDate : a.date;
            var bDate = (b.eventType === plugin.EventTypes.MULTI.name) ? b.startDate : b.date;
            if (plugin.settings.sortAscending) {
                return aDate.toLowerCase() > bDate.toLowerCase() ? 1 : -1;
            } else {
                return aDate.toLowerCase() < bDate.toLowerCase() ? 1 : -1;
            }
        };

        var showError = function(msg) {
            $element.find('.eventsCalendar-list-wrap')
                .html("<span class='eventsCalendar-loading error'>" +
                    msg +
                    " " +
                    plugin.settings.eventsjson +
                    "</span>");
        };

        /* ========================================== */
        /* The above still needs to be refactored     */
        /* ========================================== */

        var eventIsWithinDateRange = function (startDate, endDate, year, month, day) {
            var start = 0;
            var end = 0;
            var dateToCheck = 0;

            // Check Year
            if (year != "") {
                start += startDate.getFullYear() * 10000;
                end += endDate.getFullYear() * 10000;
                dateToCheck += parseInt(year, 10) * 10000;
            }

            // Check Month
            if (month !== false) {
                start += startDate.getMonth() * 100;
                end += endDate.getMonth() * 100;
                dateToCheck += month * 100;
            }

            // Check Day
            if (day != "") {
                start += startDate.getDate();
                end += endDate.getDate();
                dateToCheck += parseInt(day, 10);
            }

            return ((dateToCheck >= start) && (dateToCheck <= end));
        };

        plugin.EventTypes = {
            SINGLE : { value: 0, name: "single" },
            MULTI  : { value: 1, name: "multi" }
        };
        if (Object.freeze) { Object.freeze(plugin.EventTypes); }

        plugin.settings = {};

        plugin.eventIsToday = function (event, year, month, day) {
            var startDate = (event.eventType === plugin.EventTypes.MULTI.name) ? event.startDate : event.date;
            if (!startDate.getMonth) startDate = new Date(parseInt(startDate, 10));
            var endDate = (event.eventType === plugin.EventTypes.MULTI.name) ? event.endDate : event.date;
            if (!endDate.getMonth) endDate = new Date(parseInt(endDate, 10));
            return eventIsWithinDateRange(startDate, endDate, year, month, day);
        };

        plugin.eventIsCurrent = function (event, year, month, day) {
            var startDate = event.startDate ? event.startDate : event.date;
            if (!startDate.getMonth) startDate = new Date(parseInt(startDate, 10));
            var endDate = event.endDate ? event.endDate : event.date;
            if (!endDate.getMonth) endDate = new Date(parseInt(endDate, 10));
            return eventIsWithinDateRange(startDate, endDate, year, month, day);
        };

        // Resize calendar width on window resize
        var setCalendarWidth = function() {
            directionLeftMove = $element.width();
            $element.find('.eventsCalendar-monthWrap').width($element.width() + 'px');
            $element.find('.eventsCalendar-list-wrap').width($element.width() + 'px');
        };

        plugin._initialiseCalendarWidth = function() {
            setCalendarWidth();
            $(window).resize(function () {
                setCalendarWidth();
            });
        };

        plugin._initialiseContentSrolling = function() {
            if (plugin.settings.eventsScrollable) {
                $element.find('.eventsCalendar-list-content').addClass('scrollable');
            }
        };

        plugin._initialiseLoadingMessage = function() {
            $element.addClass('eventCalendar-wrap').append("<div class='eventsCalendar-list-wrap'><p class='eventsCalendar-subtitle'></p><span class='eventsCalendar-loading'>loading...</span><div class='eventsCalendar-list-content'><ul class='eventsCalendar-list'></ul></div></div>");
        };

        var _initialise = function() {
            plugin.settings = $.extend({}, $.fn.eventCalendar.defaults, options);

            plugin._initialiseLoadingMessage();
            plugin._initialiseContentSrolling();
            plugin._initialiseCalendarWidth();

            // show current month
            dateSlider("current");

            var year = $element.attr('data-current-year');
            var month = $element.attr('data-current-month');
            var date = new Date();
            var day = "" + date.getDate();

            if (plugin.settings.initialEventList && plugin.settings.initialEventList === 'day') {
                getEvents(plugin.settings.eventsLimit, year, month, day, "day");
            } else if (plugin.settings.initialEventList && plugin.settings.initialEventList === "month") {
                getEvents(plugin.settings.eventsLimit, year, month, false, "month");
            } else {
                getEvents(plugin.settings.eventsLimit, false, false, false, false);
            }

            changeMonth();

            $element.on('click', '.eventsCalendar-day a', function (e) {
                e.preventDefault();
                var year = $element.attr('data-current-year');
                var month = $element.attr('data-current-month');
                var day = $(this).parent().attr('rel');

                getEvents(false, year, month, day, "day");
            });

            $element.on('click', '.monthTitle', function (e) {
                e.preventDefault();
                var year = $element.attr('data-current-year');
                var month = $element.attr('data-current-month');

                getEvents(plugin.settings.eventsLimit, year, month, false, "month");
            });

            $element.find('.eventsCalendar-list').on('click', '.eventTitle', function(e){
                if (plugin.settings.collapsible && plugin.settings.showDescription) {
                    e.preventDefault();
                    var desc = $(this).parent().find('.eventDesc');

                    if (!desc.find('a').size()) {
                        var eventUrl = $(this).attr('href');
                        var eventTarget = $(this).attr('target');

                        // create a button to go to event url
                        if (eventUrl && eventUrl.length > 0) {
                            desc.append('<a href="' + eventUrl + '" target="'+eventTarget+'" class="bt">'+plugin.settings.textGoToEventUrl+'</a>');
                        }
                    }

                    if (desc.is(':visible')) {
                        desc.slideUp();
                    } else {
                        if(plugin.settings.onlyOneDescription) {
                            $element.find('.eventDesc').slideUp();
                        }
                        desc.slideDown();
                    }
                }
            });
        };

        _initialise();
    };

    //noinspection JSUnresolvedVariable
    /**
     * Event Calendar Plugin
     * @param {object=} options  Parameter overrides - see defaults for complete list
     * @returns {*}
     */
    $.fn.eventCalendar = function(options) {
        return this.each(function()
        {
            var element = $(this);

            // Return early if this element already has a plugin instance
            if (element.data('eventCalendar')) { return; }

            // pass options to plugin constructor
            var eventCalendar = new $.eventCalendar(this, options);

            // Store plugin object in this element's data
            element.data('eventCalendar', eventCalendar);
        });
    };

    //noinspection JSUnresolvedVariable
    /**
     * Defines the default values for the function parameters
     * @type {{eventsJson: string, jsonDateFormat: string, jsonData: string, cacheJson: boolean, sortAscending: boolean, eventsLimit: number, dayNameFormat: string, textCalendarTitle: string, textEventHeaderDayView: string, textEventHeaderMonthView: string, textNoEvents: string, textNext: string, textPrevious: string, textNextEvents: string, textGoToEventUrl: string, showDayAsWeeks: boolean, startWeekOnMonday: boolean, showDayNameInCalendar: boolean, showDescription: boolean, collapsible: boolean, onlyOneDescription: boolean, openEventInNewWindow: boolean, eventsScrollable: boolean, initialEventList: boolean, currentDate: Date, moveSpeed: number, moveOpacity: number}}
     */
    $.fn.eventCalendar.defaults = {
        eventsJson               : "js/events.json",
        jsonDateFormat           : "timestamp", // either timestamp or a format as specified here: https://code.google.com/p/datejs/wiki/FormatSpecifiers
        jsonData                 : "",          // to load and inline json (not ajax calls)
        cacheJson                : true,        // if true plugin get a json only first time and after plugin filter events
                                                // if false plugin get a new json on each date change
        sortAscending            : true,        // false to sort descending
        eventsLimit              : 4,
        dayNameFormat            : "ddd",
        textCalendarTitle        : "MMMM yyyy",
        textEventHeaderDayView   : "MMMM ddS even\\t\\s:",
        textEventHeaderMonthView : "MMMM even\\t\\s:",
        textNoEvents             : "There are no events in this period",
        textNext                 : "next",
        textPrevious             : "prev",
        textNextEvents           : "Next events:",
        textGoToEventUrl         : "See the event",
        showDayAsWeeks           : true,
        startWeekOnMonday        : true,
        showDayNameInCalendar    : true,
        showDescription          : false,
        collapsible              : false,
        onlyOneDescription       : true,
        openEventInNewWindow     : false,
        eventsScrollable         : false,
        initialEventList         : false,       // false for upcoming, 'day' for today, or 'month' for this month.
        currentDate              : new Date(),
        moveSpeed                : 500,         // speed of month move when you click on a new date
        moveOpacity              : 0.15         // month and events fadeOut to this opacity
    };

    /**
     * Make classes available for unit testing
     */
    $.EventRecurrence = EventRecurrence;
    $.EventInstance = EventInstance;
    $.EventItem = EventItem;

}(jQuery));