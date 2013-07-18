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
        startDate           : event start date - either in timestamp format or 'YYYY-MM-DD HH:MM:SS'
        endDate             : event end date - used if event spans a number of days (defaults to startDate)
        listingStartOffset  : number of days offset to start the event listing from (-'ve is previous, 0 is event date, +'ve is future) (defaults to 0)
        listingNumberOfDays : number of days to display listing for this event (-'ve is invalid, 0 is no display, 1 is default)
        recurrence          : event recurring type
                            : - JSON format:
                            :     type     - the type of repetition: 'day', 'week', 'month', 'year'
                            :     interval - the interval between events in the "type" units
                            :     end      - when the recurrence should end - either 'none' (default), number of times, or a date
                            : coming...
                            :     day and count2 - define a day of a month (first Monday, third Friday, etc)
                            :     frequency - an array of week days (Sunday is 0)
                            : - Examples of the rec_type data:
                            :     { type: 'day', interval: 3 } - every three days
                            :     { type: 'month', interval: 2 } - every two months
                            :     { type: 'month', interval: 1, ???? _1_2_ - second Monday of each month
                            :     { type: 'week', interval: 2, frequency: [1,5] } - Monday and Friday of each second week
        classEvent          : event class - used for styling the event (no default)
        classTitle          : title class - used for styling the event title (additional to eventTitle)
        classDescription    : description class - used for styling the event description (additional to eventDescription)
        title               : event name - becomes the header line
        description         : event description - becomes the detail (optionally hidden)
        url                 : url of page containing event details
    Obsolete:
        date                : event date either in timestamp format or 'YYYY-MM-DD HH:MM:SS'
        type                : event class - used to generate a class for styling the detail section
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
     * @param {string=} dateFormat         Date format used for the event dates [Optional]
     * @param {function(string)=} onError  Function to call should an error occur
     * @constructor
     */
    function EventRecurrence(recurrence, dateFormat, onError) {
        var $EventRecurrence = this;
        var _error = false;

        $EventRecurrence.type = 'none';
        $EventRecurrence.interval = 0;
        $EventRecurrence.end = 'none';
        $EventRecurrence._index = 0;

        // TODO - add support for the following:
        //   day and count2 - define a day of a month (first Monday, third Friday, etc)
        //   frequency - an array of week days (Sunday is 0)

        /**
         * Initialises the recurrence properties to no recurrence
         * @private
         */
        var _setRecurrenceToNone = function() {
            $EventRecurrence.type = 'none';
            $EventRecurrence.interval = 0;
            $EventRecurrence.end = 'none';
            $EventRecurrence._index = 0;
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
                _recurrenceError("Invalid recurrence interval: " + recurrence.interval);
                return;
            }

            if (recurrence.end === undefined) {
                $EventRecurrence.end = 'none';
            } else if (typeof recurrence.end === 'object' && recurrence.end.getMonth) {
                $EventRecurrence.end = recurrence.end.clone();
            } else if (typeof recurrence.end === 'number') {
                $EventRecurrence.end = parseInt(recurrence.end, 10);
            } else if (typeof recurrence.end === 'string') {
                $EventRecurrence.end = recurrence.end.toLowerCase();
                if ($EventRecurrence.end === '') {
                    $EventRecurrence.end = 'none';
                } else if ($EventRecurrence.end !== 'none') {
                    if (dateFormat) {
                        $EventRecurrence.end = (dateFormat.toLowerCase() === 'timestamp') ? new Date(parseInt(recurrence.end, 10)) : Date.parseExact(recurrence.end, dateFormat);
                    }
                    if (!$EventRecurrence.end) {
                        $EventRecurrence.end = Date.parse(recurrence.end);
                    }
                }
            }
            if (!$EventRecurrence.end) {
                _recurrenceError("Invalid end recurrence: " + recurrence.end);
                return;
            }

            if (DEBUG) { console.log("Recurrence created: " + JSON.stringify($EventRecurrence)); }
        };

        /**
         * Returns the specific occurrence of a recurrence, starting from date
         * @param {Date} date      Starting date of recurrence
         * @param {number=} index  Number of iterations to index to (defaults to 0) [Optional]
         * @returns {Date}
         */
        $EventRecurrence.getRecurrenceDate = function (date, index) {
            if (!index) { index = 0; }
            if ((!date) || (index < 0)) { return null; }

            var recurDate = new Date(date);
            $EventRecurrence._index = 0;
            var i = 0;
            while (i < index) {
                recurDate = $EventRecurrence.getNextRecurrenceDate(recurDate);
                if (!recurDate) { break; }
                i += 1;
            }

            $EventRecurrence._index = i;
            return recurDate;
        };

        /**
         * Returns the next recurrence date in the series, starting from date
         * @param {Date} date Starting date of recurrence
         * @returns {Date}
         */
        $EventRecurrence.getNextRecurrenceDate = function (date) {
            if (!date) { return null; }

            var recurDate = new Date(date);
            switch ($EventRecurrence.type) {
            case 'day':
                recurDate = recurDate.addDays($EventRecurrence.interval);
                $EventRecurrence._index += 1;
                break;
            case 'week':
                recurDate = recurDate.addWeeks($EventRecurrence.interval);
                $EventRecurrence._index += 1;
                break;
            case 'month':
                recurDate = recurDate.addMonths($EventRecurrence.interval);
                $EventRecurrence._index += 1;
                break;
            case 'year':
                recurDate = recurDate.addYears($EventRecurrence.interval);
                $EventRecurrence._index += 1;
                break;
            default:
                recurDate = null;
                break;
            }

            // Check if past end recurrence
            if ((recurDate !== null) && ($EventRecurrence.end !== 'none')) {
                if (typeof $EventRecurrence.end === 'object' && $EventRecurrence.end.getMonth) {
                    if (recurDate.isAfter($EventRecurrence.end)) { recurDate = null; }
                } else if (typeof $EventRecurrence.end === 'number') {
                    if ($EventRecurrence._index >= $EventRecurrence.end) { recurDate = null; }
                }
            }

            return recurDate;
        };

        _initialise();
    }

    /**
     * Simple DTO type object to contain details of an event
     * @constructor
     */
    function EventInstance() {
        var $EventInstance = this;

        $EventInstance.startDate = null;
        $EventInstance.endDate = null;
        $EventInstance.listingStartOffset = 0;
        $EventInstance.listingNumberOfDays = 1;
        $EventInstance.title = null;
        $EventInstance.description = null;
        $EventInstance.url = null;
        $EventInstance.classEvent = null;
        $EventInstance.classTitle = null;
        $EventInstance.classDescription = null;
    }

    /**
     * EventItem - defines a calendar event
     * @param {object} event               JSON object defining the event properties
     * @param {string=} dateFormat         Date format used for the event dates [Optional]
     * @param {function(string)=} onError  Function to call should an error occur [Optional]
     * @constructor
     */
    function EventItem(event, dateFormat, onError) {
        var $EventItem = this;
        var _index = 0;
        var _error = false;

        $EventItem.recurrence = null;
        $EventItem.startDate = null;
        $EventItem.endDate = null;
        $EventItem.listingStartOffset = 0;
        $EventItem.listingNumberOfDays = 1;
        $EventItem.title = null;
        $EventItem.description = null;
        $EventItem.url = null;
        $EventItem.classEvent = null;
        $EventItem.classTitle = null;
        $EventItem.classDescription = null;

        var _MS_PER_DAY = 1000 * 60 * 60 * 24;

        /**
         * Returns the difference (in days) between two dates ignoring daylight savings
         * @param  {Date} aDate   The date to compare to
         * @param  {Date} bDate   The date to compate with
         * @return {number}       The number of days between the two dates
         * @private
         */
        var _dateDiffInDays = function (aDate, bDate) {
            // Discard the time and time-zone information.
            var utc1 = Date.UTC(aDate.getFullYear(), aDate.getMonth(), aDate.getDate());
            var utc2 = Date.UTC(bDate.getFullYear(), bDate.getMonth(), bDate.getDate());

            return Math.floor((utc2 - utc1) / _MS_PER_DAY);
        };

        /**
         * Gets the recurrence for this event (if no recurrence, returns the event)
         * @param  {number=} year    The year to constrain the events to (All Years=-1) [Optional]
         * @param  {number=} month   The month to constrain the events to (Jan=0, All Months=-1) [Optional]
         * @return {EventInstance}   The first instance of the event
         * @private
         */
        var _getEvent = function(year, month) {
            if (_index < 0) { _index = 0; }
            if ((_index > 0) && ((!$EventItem.recurrence) || ($EventItem.recurrence.type === 'none'))) {
                return null;
            }
            var specificYear = (year !== undefined) ? year : -1;
            var specificMonth = (month !== undefined) ? month : -1;

            // Get initial event dates
            var eventStartDate = $EventItem.recurrence.getRecurrenceDate($EventItem.startDate, _index);
            if (eventStartDate) {
                var dateDifference = _dateDiffInDays($EventItem.startDate, eventStartDate);
                var eventEndDate = (new Date($EventItem.endDate)).addDays(dateDifference);

                // Check event dates are within required period
                if (eventStartDate && (specificYear >= 0 || specificMonth >= 0)) {
                    while (!EventItem.datePeriodIsCurrent(eventStartDate, eventEndDate, specificYear, specificMonth)) {
                        eventStartDate = $EventItem.recurrence.getNextRecurrenceDate(eventStartDate);
                        if (!eventStartDate) { break; }
                        dateDifference = _dateDiffInDays($EventItem.startDate, eventStartDate);
                        eventEndDate = (new Date($EventItem.endDate)).addDays(dateDifference);
                    }
                }
            }

            // Create return object
            var ei = null;
            if (eventStartDate) {
                ei = new EventInstance();
                ei.startDate = eventStartDate;
                ei.endDate = eventEndDate;
                ei.listingStartOffset = $EventItem.listingStartOffset;
                ei.listingNumberOfDays = $EventItem.listingNumberOfDays;
                ei.title = $EventItem.title;
                ei.description = $EventItem.description;
                ei.url = $EventItem.url;
                ei.classEvent = $EventItem.classEvent;
                ei.classTitle = $EventItem.classTitle;
                ei.classDescription = $EventItem.classDescription;
            }

            return ei;
        };

        /**
         * Initialises the recurrence properties to no recurrence
         * @private
         */
        var _setEventToNone = function() {
            $EventItem.recurrence = null;
            $EventItem.startDate = null;
            $EventItem.endDate = null;
            $EventItem.listingStartOffset = 0;
            $EventItem.listingNumberOfDays = 1;
            $EventItem.title = null;
            $EventItem.description = null;
            $EventItem.url = null;
            $EventItem.classEvent = null;
            $EventItem.classTitle = null;
            $EventItem.classDescription = null;
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
         * @param {string=} dateFormat       Date format used for the event dates [Optional]
         * @returns {Date}                   Date object representing date argument
         * @private
         */
        var _newDate = function (date, dateFormat) {
            if (!date) { return null; }

            var newDate = null;
            if (typeof date === "object" && date.getMonth) {
                newDate = date.clone();
            } else if (typeof date === 'number') {
                newDate = new Date(date);
            } else if ((typeof date === 'string') && dateFormat) {
                newDate = (dateFormat.toLowerCase() === 'timestamp') ? new Date(parseInt(date, 10)) : Date.parseExact(date, dateFormat);
            }
            if (!newDate) {
                newDate = Date.parse(date);
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

            $EventItem.recurrence = new EventRecurrence(event.recurrence, dateFormat);

            $EventItem.startDate = event.startDate ? _newDate(event.startDate, dateFormat) : null;
            // Cater for obsolete date property
            if (!$EventItem.startDate) {
                $EventItem.startDate = event.date ? _newDate(event.date, dateFormat) : null;
            }
            $EventItem.endDate = event.endDate ? _newDate(event.endDate, dateFormat) : _newDate($EventItem.startDate);
            $EventItem.listingStartOffset = event.listingStartOffset || 0;
            $EventItem.listingNumberOfDays = event.listingNumberOfDays || 1;

            $EventItem.title = event.title;
            $EventItem.description = event.description;
            $EventItem.url = event.url;

            $EventItem.classEvent = event.classEvent;
            $EventItem.classTitle = event.classTitle;
            $EventItem.classDescription = event.classDescription || event.type;
        };

        /**
         * Gets the first recurrence for this event (if no recurrence, returns the event)
         * @param  {number=} year    The year to constrain the events to (All Years=-1) [Optional]
         * @param  {number=} month   The month to constrain the events to (Jan=0, All Months=-1) [Optional]
         * @return {EventInstance}   The first instance of the event
         */
        $EventItem.getFirstEventInstance = function(year, month) {
            _index = 0;
            return _getEvent(year, month);
        };

        /**
         * Gets the next recurrence for this recurrence event (if no recurrence and index > 0 returns null)
         * @param  {number=} year    The year to constrain the events to (All Years=-1) [Optional]
         * @param  {number=} month   The month to constrain the events to (Jan=0, All Months=-1) [Optional]
         * @return {EventInstance}   The next instance of the event
         */
        $EventItem.getNextEventInstance = function(year, month) {
            _index += 1;
            return _getEvent(year, month);
        };

        _initialise();
    }

    /**
     * Returns true if this event instance is in the required month / year
     * @param  {Date} startDate  The start date of the range to validate
     * @param  {Date} endDate    The end date of the range to validate
     * @param  {number=} year    The year to constrain the events to (All Years=-1) [Optional]
     * @param  {number=} month   The month to constrain the events to (Jan=0, All Months=-1) [Optional]
     * @param  {number=} day     The day to constrain the events to (Sun=0, All Days=-1) [Optional]
     * @returns {boolean}
     */
    EventItem.datePeriodIsCurrent = function(startDate, endDate, year, month, day) {
        var start = 0;
        var end = 0;
        var dateToCheck = 0;

        // Check Year
        if (year >= 0) {
            start += startDate.getFullYear() * 10000;
            end += endDate.getFullYear() * 10000;
            dateToCheck += year * 10000;
        }

        // Check Month
        if (month >= 0) {
            start += startDate.getMonth() * 100;
            end += endDate.getMonth() * 100;
            dateToCheck += month * 100;
        }

        // Check Day
        if (day >= 0) {
            start += startDate.getDate();
            end += endDate.getDate();
            dateToCheck += day;
        }

        return ((dateToCheck >= start) && (dateToCheck <= end));
    };

    /**
     * Returns true if this event instance is after the required month / year
     * @param  {EventInstance} eventInstance  The event instance to check
     * @param  {number=} year                 The year to compare the event to (All Years=-1) [Optional]
     * @param  {number=} month                The month to compare the event to (Jan=0, All Months=-1) [Optional]
     * @param  {number=} day                  The day to compare the event to (Sun=0, All Days=-1) [Optional]
     * @returns {boolean}
     */
    EventItem.datePeriodIsInTheFuture = function(eventInstance, year, month, day) {
        var listingStartDate = eventInstance.startDate.clone();
        listingStartDate = listingStartDate.addDays(eventInstance.listingStartOffset);

        var earliestEventDate = eventInstance.startDate.isBefore(listingStartDate) ? eventInstance.startDate : listingStartDate;
        var start = 0;
        var check = 0;

        // Check Year
        if (year >= 0) {
            start += earliestEventDate.getFullYear() * 10000;
            check += year * 10000;
        }

        // Check Month
        if (month >= 0) {
            start += earliestEventDate.getMonth() * 100;
            check += month * 100;
        }

        // Check Day
        if (day >= 0) {
            start += earliestEventDate.getDate();
            check += day;
        }

        return (check < start);
    };

    /**
     * Event Calendar - the main calendar class
     * @param {object} element   The element in the DOM that the calendar is to be attached to
     * @param {object=} options  Parameter overrides - see defaults for complete list [Optional]
     */
    function EventCalendar(element, options) {
        var $EventCalendar = this;
        var $element = $(element);
        var directionLeftMove = "300";
        var eventsJson = {};

        var showError = function(msg) {
            $element.find('.eventsCalendar-list-wrap')
                .html("<span class='eventsCalendar-loading error'>" +
                    msg +
                    " " +
                    $EventCalendar.settings.eventsjson +
                    "</span>");
        };

        /**
         * Resize calendar width on window resize
         * @private
         */
        var _setCalendarWidth = function() {
            directionLeftMove = $element.width();
            $element.find('.eventsCalendar-monthWrap').width($element.width() + 'px');
            $element.find('.eventsCalendar-list-wrap').width($element.width() + 'px');
        };

        var _initialiseCalendarWidth = function() {
            _setCalendarWidth();
            $(window).resize(function () {
                _setCalendarWidth();
            });
        };

        var getEventsData = function(data, limit, year, month, day, direction) {
            var directionLeftMove = "-=" + $EventCalendar.directionLeftMove;
            var eventContentHeight = "auto";

            var subtitle = $element.find('.eventsCalendar-list-wrap .eventsCalendar-subtitle');
            if (!direction) {
                // first load
                subtitle.html($EventCalendar.settings.textNextEvents);
                eventContentHeight = "auto";
                directionLeftMove = "-=0";
            } else {
                var displayDate = new Date(year, month, (day !== '') ? day : 1, 0, 0, 0);
                var headerText = (day !== '') ? displayDate.toString($EventCalendar.settings.textEventHeaderDayView) : displayDate.toString($EventCalendar.settings.textEventHeaderMonthView);
                subtitle.html(headerText);

                if (direction === 'prev') {
                    directionLeftMove = "+=" + $EventCalendar.directionLeftMove;
                } else if (direction === 'day' || direction === 'month') {
                    directionLeftMove = "+=0";
                    eventContentHeight = 0;
                }
            }

            $element.find('.eventsCalendar-list').animate({
                opacity: $EventCalendar.settings.moveOpacity,
                left: directionLeftMove,
                height: eventContentHeight
            }, $EventCalendar.settings.moveSpeed, function() {
                $element.find('.eventsCalendar-list').css({'left': 0, 'height': 'auto'}).hide();

                var events = [];

                data = $(data).sort(function(aDate, bDate) {
                    var compare;
                    if ($EventCalendar.settings.sortAscending) {
                        compare = aDate.startDate.toLowerCase() > bDate.startDate.toLowerCase() ? 1 : -1;
                    } else {
                        compare = aDate.startDate.toLowerCase() < bDate.startDate.toLowerCase() ? 1 : -1;
                    }
                    return compare;
                }); // sort event by dates

                // Add each event to the calendar
                if (data.length) {

                    var itemsInList = 0;
                    $.each(data, function(key, event) {
                        var eventItem = new EventItem(event, $EventCalendar.settings.jsonDateFormat);

                        // Add to calendar
                        $EventCalendar.addEventToCalendar(
                            eventItem,
                            function(eventInstance, dayOfMonth) {
                                $element.find('.currentMonth .eventsCalendar-daysList #dayList_' + dayOfMonth).addClass('dayWithEvents');
                            },
                            function(eventInstance) {
                                if (eventInstance.listingNumberOfDays < 1) { return; }
                                if (limit !== 0 && itemsInList >= limit) { return; }

                                var listingStartDate = eventInstance.startDate.clone();
                                listingStartDate = listingStartDate.addDays(eventInstance.listingStartOffset);
                                var listingEndDate = listingStartDate.clone();
                                listingEndDate = listingEndDate.addDays(eventInstance.listingNumberOfDays - 1);
                                var dayToCheck = (day !== '') ? parseInt(day, 10) : -1;

                                var eventIsCurrent = EventItem.datePeriodIsCurrent(eventInstance.startDate, eventInstance.endDate, year, month, dayToCheck);

                                // Check if the date is either in the event period or in the listing period
                                if (!eventIsCurrent && !EventItem.datePeriodIsCurrent(listingStartDate, listingEndDate, year, month, dayToCheck)) { return; }

                                var eventClass = eventInstance.classEvent ? ' class="' + eventInstance.classEvent + '"' : '';

                                var titleClass = ' class="eventTitle';
                                titleClass += eventInstance.classTitle ? ' ' + eventInstance.classTitle : '';
                                titleClass += eventIsCurrent ? ' current' : '';
                                titleClass += '"';

                                var descriptionClass = ' class="eventDescription';
                                descriptionClass += eventInstance.classDescription ? ' ' + eventInstance.classDescription : '';
                                descriptionClass += (!$EventCalendar.settings.showDescription) ? ' hidden' : '';
                                descriptionClass += '"';

                                var eventLinkTarget = $EventCalendar.settings.openEventInNewWindow ? '_target' : "_self";

                                var eventTitle;
                                if (eventInstance.url) {
                                    eventTitle = '<a href="' + eventInstance.url + '" target="' + eventLinkTarget + '"' + titleClass + '>' + eventInstance.title + '</a>';
                                } else {
                                    eventTitle = '<span' + titleClass + '>' + eventInstance.title + '</span>';
                                }

                                events.push('<li id="' + key + '"' + eventClass + '>' + eventTitle + '<div' + descriptionClass + '>' + event.description + '</div></li>');

                                itemsInList += 1;
                            },
                            year,
                            month
                        );
                    });
                }

                // Add message if there are no events for this period
                if (!events.length) {
                    events.push('<li class="eventsCalendar-noEvents"><p>' + $EventCalendar.settings.textNoEvents + '</p></li>');
                }

                $element.find('.eventsCalendar-loading').hide();
                $element.find('.eventsCalendar-list').html(events.join(''));

                if ($EventCalendar.settings.collapsible) {
                    $element.find('.eventDescription').hide();
                }

                $element.find('.eventsCalendar-list').animate({
                    opacity: 1,
                    height: "toggle"
                }, $EventCalendar.settings.moveSpeed);
            });
            _setCalendarWidth();
        };

        var _getEvents = function(limit, year, month, day, direction) {
            var maxLimit = limit || 0;
            var specificYear = year || '';
            var specificMonth = (month !== undefined) ? month : '';
            var specificDay = day || '';

            $element.find('.eventsCalendar-loading').fadeIn();

            if ($EventCalendar.settings.jsonData) {
                // user send a json in the plugin params
                $EventCalendar.settings.cacheJson = true;

                eventsJson = $EventCalendar.settings.jsonData;
                getEventsData(eventsJson, maxLimit, specificYear, specificMonth, specificDay, direction);

            } else if (!$EventCalendar.settings.cacheJson || !direction) {
                // first load: load json and save it to future filters
                $.getJSON($EventCalendar.settings.eventsjson + "?limit=" + maxLimit + "&year=" + specificYear + "&month=" + specificMonth + "&day=" + specificDay, function(data) {
                    eventsJson = data; // save data to future filters
                    getEventsData(eventsJson, maxLimit, specificYear, specificMonth, specificDay, direction);
                }).error(function() {
                    showError("error getting json: ");
                });
            } else {
                // filter previous saved json
                getEventsData(eventsJson, maxLimit, specificYear, specificMonth, specificDay, direction);
            }

            $element.find('.current').removeClass('current');
            if (specificDay > '') {
                $element.find('#dayList_' + specificDay).addClass('current');
            }
        };

        /**
         * Changes the month on the calendar and updates the events
         * @param {string} show Calendar month to show. One of 'current' for this month, 'prev' for last month, or 'next' for next month
         * @private
         */
        var _changeCalendarMonth = function(show) {
            var dateToShow = null;
            var dayCount;

            // Calculate the date to show
            if (show === 'current') {
                dateToShow = $EventCalendar.settings.currentDate;
            } else {
                dateToShow = new Date($element.attr('data-current-year'), $element.attr('data-current-month'), 1, 0, 0, 0);
                dateToShow = (show === 'prev') ? dateToShow.addMonths(-1) : dateToShow.addMonths(1);
            }

            // Performance optimisation - store date portions in local variables (and save them in the DOM)
            var year = dateToShow.getFullYear();
            var month = dateToShow.getMonth();
            $element.attr('data-current-month', month).attr('data-current-year', year);

            // Initialise the DOM for the new month
            var $eventsCalendarSlider = $("<div class='eventsCalendar-slider'></div>");
            var $eventsCalendarMonthWrap = $("<div class='eventsCalendar-monthWrap'></div>");
            var $eventsCalendarTitle = $("<div class='eventsCalendar-currentTitle'><a href='#' class='monthTitle'></a></div>");
            var $eventsCalendarArrows = $("<a href='#' class='arrow prev'><span>" + $EventCalendar.settings.textPrevious + "</span></a><a href='#' class='arrow next'><span>" + $EventCalendar.settings.textNext + "</span></a>");
            var $eventsCalendarDaysList = $("<ul class='eventsCalendar-daysList'></ul>");

            if (!$element.find('.eventsCalendar-slider').size()) {
                $element.prepend($eventsCalendarSlider);
                $eventsCalendarSlider.append($eventsCalendarMonthWrap);
                $eventsCalendarSlider.append($eventsCalendarArrows);
            } else {
                $eventsCalendarSlider = $element.find('.eventsCalendar-slider');
                $eventsCalendarSlider.append($eventsCalendarMonthWrap);
            }

            $element.find('.eventsCalendar-monthWrap.currentMonth').removeClass('currentMonth').addClass('oldMonth');
            $eventsCalendarMonthWrap.addClass('currentMonth').append($eventsCalendarTitle, $eventsCalendarDaysList);

            // Add data for new month
            if (show !== 'current') {
                _getEvents($EventCalendar.settings.eventsLimit, year, month, false, show);
            }

            // Add calendar title
            $eventsCalendarTitle.find('.monthTitle').html(dateToShow.toString($EventCalendar.settings.textCalendarTitle));

            // Initialise multi-row display format
            var calendarCells = [];
            if ($EventCalendar.settings.showDayAsWeeks) {
                $eventsCalendarDaysList.addClass('showAsWeek');

                // Show day names in the top row of the calendar
                if ($EventCalendar.settings.showDayNameInCalendar) {
                    $eventsCalendarDaysList.addClass('showDayNames');
                    var dayOfWeek = Date.today().moveToDayOfWeek($EventCalendar.settings.startWeekOnMonday ? 1 : 0);
                    for (dayCount = 0; dayCount < 7; dayCount += 1) {
                        calendarCells.push('<li class="eventsCalendar-day-header">' + dayOfWeek.toString($EventCalendar.settings.dayNameFormat) + '</li>');
                        dayOfWeek.addDays(1);
                    }
                }

                // Add empty cells before the first day of the month
                var emptyCellsToShow = Date.today().moveToFirstDayOfMonth().getDay();
                if ($EventCalendar.settings.startWeekOnMonday) {
                    emptyCellsToShow -= 1;
                    if (emptyCellsToShow < 0) {
                        emptyCellsToShow = 6;
                    }
                }
                for (dayCount = 0; dayCount < emptyCellsToShow; dayCount += 1) {
                    calendarCells.push('<li class="eventsCalendar-day empty"></li>');
                }
            }

            // Add the day numbers
            var daysInMonth = Date.getDaysInMonth(dateToShow.getFullYear(), dateToShow.getMonth());
            for (dayCount = 1; dayCount <= daysInMonth; dayCount += 1) {
                calendarCells.push('<li id="dayList_' + dayCount + '" rel="' + dayCount + '" class="eventsCalendar-day"><a href="#">' + dayCount + '</a></li>');
            }
            $eventsCalendarDaysList.append(calendarCells.join(''));

            $eventsCalendarSlider.height($eventsCalendarMonthWrap.height() + 'px');
        };

        /**
         * Adds an event to the calendar
         * @param {EventItem} eventItem                           The event to add to the calendar
         * @param {function(EventInstance, number)=} highlighter  Callback to highlight a day in the calender [Optional]
         * @param {function(EventInstance, number)=} lister       Callback to add an instance of the event to the list [Optional]
         * @param {number=} year                                  The year to constrain the events to (All Years=-1) [Optional]
         * @param {number=} month                                 The month to constrain the events to (Jan=0, All Months=-1) [Optional]
         */
        $EventCalendar.addEventToCalendar = function(eventItem, highlighter, lister, year, month) {
            if ((!eventItem) || (!highlighter)) { return; }
            var specificYear = (year !== undefined) ? year : -1;
            var specificMonth = (month !== undefined) ? month : -1;
            var itemAdded = false;

            var eventInstance = eventItem.getFirstEventInstance();
            while (eventInstance && !EventItem.datePeriodIsInTheFuture(eventInstance, specificYear, specificMonth)) {
                var eventDate = eventInstance.startDate;
                if (EventItem.datePeriodIsCurrent($EventCalendar.settings.startDate, $EventCalendar.settings.endDate, eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())) {
                    // Add one list item for this instance
                    if (lister && (typeof lister === 'function') && (!itemAdded || !$EventCalendar.settings.groupEvents)) {
                        lister(eventInstance);
                        itemAdded = true;
                    }

                    // Highlight each event day in the calendar
                    if (highlighter && (typeof highlighter === 'function')) {
                        var dateToBeChecked = new Date(eventInstance.startDate);
                        while (dateToBeChecked.compareTo(eventInstance.endDate) <= 0) {
                            if (((specificYear === -1) || (dateToBeChecked.getFullYear() === specificYear)) &&
                                    ((specificMonth === -1) || (dateToBeChecked.getMonth() === specificMonth))) {
                                highlighter(eventInstance, dateToBeChecked.getDate());
                            }
                            dateToBeChecked.addDays(1);
                        }
                    }
                }

                eventInstance = eventItem.getNextEventInstance();
            }
        };

        $EventCalendar.settings = {};

        var _initialiseLoadingMessage = function() {
            $element.addClass('eventCalendar-wrap').append("<div class='eventsCalendar-list-wrap'><p class='eventsCalendar-subtitle'></p><span class='eventsCalendar-loading'>loading...</span><div class='eventsCalendar-list-content'><ul class='eventsCalendar-list'></ul></div></div>");
        };

        var _initialiseContentScrolling = function() {
            if ($EventCalendar.settings.eventsScrollable) {
                $element.find('.eventsCalendar-list-content').addClass('scrollable');
            }
        };

        var _changeMonth = function() {
            $element.find('.arrow').click(function(e) {
                e.preventDefault();

                var lastMonthMove;
                if ($(this).hasClass('next')) {
                    _changeCalendarMonth("next");
                    lastMonthMove = '-=' + directionLeftMove;
                } else {
                    _changeCalendarMonth("prev");
                    lastMonthMove = '+=' + directionLeftMove;
                }

                $element.find('.eventsCalendar-monthWrap.oldMonth').animate({
                    opacity : $EventCalendar.settings.moveOpacity,
                    left    : lastMonthMove
                }, $EventCalendar.settings.moveSpeed, function() {
                    $element.find('.eventsCalendar-monthWrap.oldMonth').remove();
                });
            });
        };

        var _initialise = function() {
            $EventCalendar.settings = $.extend({}, $.fn.eventCalendar.defaults, options);

            _initialiseLoadingMessage();
            _initialiseContentScrolling();
            _initialiseCalendarWidth();

            _changeCalendarMonth("current");

            var year = parseInt($element.attr('data-current-year'), 10);
            var month = parseInt($element.attr('data-current-month'), 10);
            var day = $EventCalendar.settings.currentDate.getDate();

            if ($EventCalendar.settings.initialEventList && $EventCalendar.settings.initialEventList === 'day') {
                _getEvents($EventCalendar.settings.eventsLimit, year, month, day, 'day');
            } else if ($EventCalendar.settings.initialEventList && $EventCalendar.settings.initialEventList === 'month') {
                _getEvents($EventCalendar.settings.eventsLimit, year, month, false, 'month');
            } else {
                _getEvents($EventCalendar.settings.eventsLimit, false, false, false, false);
            }

            _changeMonth();

            $element.on('click', '.eventsCalendar-day a', function (e) {
                e.preventDefault();
                var year = parseInt($element.attr('data-current-year'), 10);
                var month = parseInt($element.attr('data-current-month'), 10);
                var day = $(this).parent().attr('rel');
                _getEvents(false, year, month, day, "day");
            });

            $element.on('click', '.monthTitle', function (e) {
                e.preventDefault();
                var year = $element.attr('data-current-year');
                var month = $element.attr('data-current-month');

                _getEvents($EventCalendar.settings.eventsLimit, year, month, false, "month");
            });

            $element.find('.eventsCalendar-list').on('click', '.eventTitle', function(e) {
                if ($EventCalendar.settings.collapsible && $EventCalendar.settings.showDescription) {
                    e.preventDefault();
                    var desc = $(this).parent().find('.eventDescription');

                    if (!desc.find('a').size()) {
                        var eventUrl = $(this).attr('href');
                        var eventTarget = $(this).attr('target');

                        // create a button to go to event url
                        if (eventUrl && eventUrl.length > 0) {
                            desc.append('<a href="' + eventUrl + '" target="' + eventTarget + '" class="bt">' + $EventCalendar.settings.textGoToEventUrl + '</a>');
                        }
                    }

                    if (desc.is(':visible')) {
                        desc.slideUp();
                    } else {
                        if ($EventCalendar.settings.onlyOneDescription) {
                            $element.find('.eventDescription').slideUp();
                        }
                        desc.slideDown();
                    }
                }
            });
        };

        _initialise();
    }

    //noinspection JSUnresolvedVariable
    /**
     * Event Calendar Plugin
     * @param {object=} options  Parameter overrides - see defaults for complete list [Optional]
     * @returns {*}
     */
    $.fn.eventCalendar = function(options) {
        return this.each(function() {
            var element = $(this);

            // Return early if this element already has a plugin instance
            if (element.data('eventCalendar')) { return; }

            // pass options to plugin constructor
            var eventCalendar = new EventCalendar(this, options);

            // Store plugin object in this element's data
            element.data('eventCalendar', eventCalendar);
        });
    };

    //noinspection JSUnresolvedVariable
    /**
     * Defines the default values for the function parameters
     * @type {{eventsJson: string, jsonDateFormat: string, jsonData: string, cacheJson: boolean, sortAscending: boolean, eventsLimit: number, dayNameFormat: string, textCalendarTitle: string, textEventHeaderDayView: string, textEventHeaderMonthView: string, textNoEvents: string, textNext: string, textPrevious: string, textNextEvents: string, textGoToEventUrl: string, showDayAsWeeks: boolean, startWeekOnMonday: boolean, showDayNameInCalendar: boolean, showDescription: boolean, collapsible: boolean, onlyOneDescription: boolean, openEventInNewWindow: boolean, eventsScrollable: boolean, initialEventList: boolean|string, currentDate: Date, moveSpeed: number, moveOpacity: number}}
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
        groupEvents              : false,
        openEventInNewWindow     : false,
        eventsScrollable         : false,
        initialEventList         : false,       // false for upcoming, 'day' for today, or 'month' for this month.
        currentDate              : Date.today(),
        startDate                : new Date(1900, 0, 1, 0, 0, 0),
        endDate                  : new Date(2999, 0, 1, 0, 0, 0),
        moveSpeed                : 500,         // speed of month move when you click on a new date
        moveOpacity              : 0.15         // month and events fadeOut to this opacity
    };

    /**
     * Make internal classes available for unit testing
     */
    $.EventRecurrence = EventRecurrence;
    $.EventInstance = EventInstance;
    $.EventItem = EventItem;
    $.EventCalendar = EventCalendar;

}(jQuery));