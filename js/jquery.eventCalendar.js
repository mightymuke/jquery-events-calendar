/*
	jquery.eventCalendar.js
	version: 0.54
	date: 18-04-2013
	author:
		Jaime Fernandez (@vissit)
	company:
		Paradigma Tecnologico (@paradigmate)

	JSON data format:
		date        : event date either in timestamp format or 'YYYY-MM-DD HH:MM:SS'
		startDate   : event start date - used if event spans a number of days (defaults to date)
		endDate     : event end date - used if event spans a number of days (defaults to date)
		type        : event type - used to generate a class for styling
		type        : (obsolete) event class - used to generate a class for styling
		class       : event class - used to generate a class for styling
		title       : event name - becomes the header line
		description : event description - becomes the detail (optionally hidden)
		url         : url of page containing event details
*/

;(function($) {

	// Event Calendar Plugin
	$.eventCalendar = function(element, options) {
		var $element = $(element);
		var plugin = this;

		var directionLeftMove = "300";
		var eventsJson = {};

		plugin.settings = {};

		/* ========================================== */
		/* The following still needs to be refactored */
		/* ========================================== */

		var dateSlider = function(show, year, month) {
			var $eventsCalendarSlider = $("<div class='eventsCalendar-slider'></div>")
			var $eventsCalendarMonthWrap = $("<div class='eventsCalendar-monthWrap'></div>")
			var $eventsCalendarTitle = $("<div class='eventsCalendar-currentTitle'><a href='#' class='monthTitle'></a></div>")
			var $eventsCalendarArrows = $("<a href='#' class='arrow prev'><span>" + plugin.settings.txt_prev + "</span></a><a href='#' class='arrow next'><span>" + plugin.settings.txt_next + "</span></a>");
			var $eventsCalendarDaysList = $("<ul class='eventsCalendar-daysList'></ul>")
			var date = new Date();
			var day;

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
				date = new Date($element.attr('data-current-year'),$element.attr('data-current-month'),1,0,0,0); // current visible month
				day = 0; // not show current day in days list

				var moveOfMonth = 1;
				if (show === "prev") {
					moveOfMonth = -1;
				}
				date.setMonth( date.getMonth() + moveOfMonth );

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
				getEvents(plugin.settings.eventsLimit, year, month,false, show);
			}

			$element
				.attr('data-current-month',month)
				.attr('data-current-year',year);

			// add current date info
			$eventsCalendarTitle.find('.monthTitle').html(plugin.settings.monthNames[month] + " " + year);

			// print all month days
			var daysOnTheMonth = 32 - new Date(year, month, 32).getDate();
			var daysList = [];
			if (plugin.settings.showDayAsWeeks) {
				$eventsCalendarDaysList.addClass('showAsWeek');

				// show day name in top of calendar
				if (plugin.settings.showDayNameInCalendar) {
					$eventsCalendarDaysList.addClass('showDayNames');

					var i = 0;
					// if week start on monday
					if (plugin.settings.startWeekOnMonday) {
						i = 1;
					}

					for (; i < 7; i++) {
						daysList.push('<li class="eventsCalendar-day-header">'+plugin.settings.dayNamesShort[i]+'</li>');

						if (i === 6 && plugin.settings.startWeekOnMonday) {
							// print sunday header
							daysList.push('<li class="eventsCalendar-day-header">'+plugin.settings.dayNamesShort[0]+'</li>');
						}

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

				eventsJson = fillMissingDateInformation(plugin.settings.jsonData);
				getEventsData(eventsJson, limit, year, month, day, direction);

			} else if (!plugin.settings.cacheJson || !direction) {
				// first load: load json and save it to future filters
				$.getJSON(plugin.settings.eventsjson + "?limit="+limit+"&year="+year+"&month="+month+"&day="+day, function(data) {
					eventsJson = fillMissingDateInformation(data); // save data to future filters
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
		}

		var getEventsData = function(data, limit, year, month, day, direction){
			var directionLeftMove = "-=" + plugin.directionLeftMove;
			var eventContentHeight = "auto";

			var subtitle = $element.find('.eventsCalendar-list-wrap .eventsCalendar-subtitle')
			if (!direction) {
				// first load
				subtitle.html(plugin.settings.txt_NextEvents);
				eventContentHeight = "auto";
				directionLeftMove = "-=0";
			} else {
				if (day != '') {
					subtitle.html(plugin.settings.txt_SpecificEvents_prev + plugin.settings.monthNames[month] + " " + num_abbrev_str(day) + " " + plugin.settings.txt_SpecificEvents_after);
				} else {
					subtitle.html(plugin.settings.txt_SpecificEvents_prev + plugin.settings.monthNames[month] + " " + plugin.settings.txt_SpecificEvents_after);
				}

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
									var eventClass = event.class;
									if (!eventClass || eventClass.length < 1) {
										eventClass = event.type;
									}
									events.push('<li id="' + key + '" class="' + eventClass + '"><time datetime="' + event.eventDate + '"><em>' + eventStringDate + '</em><small>' + event.eventHour + ":" + event.eventMinute + '</small></time>' + eventTitle + '<div class="eventDesc ' + eventDescClass + '">' + event.description + '</div></li>');
									i++;
								}
							}
						}

						// add mark in the dayList to the days with events
						if (event.eventYear == $element.attr('data-current-year') && event.eventMonth == $element.attr('data-current-month')) {
							$element.find('.currentMonth .eventsCalendar-daysList #dayList_' + parseInt(event.eventDay)).addClass('dayWithEvents');
						}

					});
				}

				// there is no events on this period
				if (!events.length) {
					events.push('<li class="eventsCalendar-noEvents"><p>' + plugin.settings.txt_noEvents + '</p></li>');
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
		}

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
		}

		var sortJson = function(a, b){
			if (plugin.settings.sortAscending) {
				return a.date.toLowerCase() > b.date.toLowerCase() ? 1 : -1;
			} else {
				return a.date.toLowerCase() < b.date.toLowerCase() ? 1 : -1;
			}
		}

		var num_abbrev_str = function(num) {
			var len = num.length;
			var last_char = num.charAt(len - 1);
			var abbrev;

			if (len === 2 && num.charAt(0) === '1') {
				abbrev = 'th';
			} else {
				if (last_char === '1') {
					abbrev = 'st';
				} else if (last_char === '2') {
					abbrev = 'nd';
				} else if (last_char === '3') {
					abbrev = 'rd';
				} else {
					abbrev = 'th';
				}
			}

			return num + abbrev;
		}

		var showError = function(msg) {
			$element.find('.eventsCalendar-list-wrap')
				.html("<span class='eventsCalendar-loading error'>" +
					msg +
					" " +
					plugin.settings.eventsjson +
					"</span>");
		}

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
				dateToCheck += parseInt(year) * 10000;
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
				dateToCheck += parseInt(day);
			}

			return ((dateToCheck >= start) && (dateToCheck <= end));
		}

		plugin.eventIsToday = function (event, year, month, day) {
			var date = new Date(parseInt(event.date));
			return eventIsWithinDateRange(date, date, year, month, day);
		};

		plugin.eventIsCurrent = function (event, year, month, day) {
			var startDate = (event.startDate) ? new Date(parseInt(event.startDate)) : new Date(parseInt(event.date));
			var endDate = (event.endDate) ? new Date(parseInt(event.endDate)) : new Date(parseInt(event.date));
			return eventIsWithinDateRange(startDate, endDate, year, month, day);
		};

		var fillMissingDateInformation = function(data) {
			if (data.length) {
				$.each(data, function(key, event) {
					if (plugin.settings.jsonDateFormat == 'human') {
						var eventDateTime = event.date.split(" ");
						var eventDate = eventDateTime[0].split("-");
						var eventTime = eventDateTime[1].split(":");
						event.eventYear = eventDate[0];
						event.eventMonth = parseInt(eventDate[1]) - 1;
						event.eventDay = parseInt(eventDate[2]);
						event.eventMonthToShow = parseInt(event.eventMonth) + 1;
						event.eventHour = eventTime[0];
						event.eventMinute = eventTime[1];
						event.eventSeconds = eventTime[2];
						event.eventDate = new Date(event.eventYear, event.eventMonth, event.eventDay, event.eventHour, event.eventMinute, event.eventSeconds);
					} else {
						var eventDate = new Date(parseInt(event.date));
						event.eventDate = eventDate;
						event.eventYear = eventDate.getFullYear();
						event.eventMonth = eventDate.getMonth();
						event.eventDay = eventDate.getDate();
						event.eventMonthToShow = event.eventMonth + 1;
						event.eventHour = eventDate.getHours();
						event.eventMinute = eventDate.getMinutes();
						event.eventSeconts = eventDate.getSeconds();
					}
					if (parseInt(event.eventMinute) <= 9) {
						event.eventMinute = "0" + parseInt(event.eventMinute);
					}
				});
			}

			return data;
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
							desc.append('<a href="' + eventUrl + '" target="'+eventTarget+'" class="bt">'+plugin.settings.txt_GoToEventUrl+'</a>')
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

	$.fn.eventCalendar = function(options) {
		return this.each(function()
		{
			var element = $(this);

			// Return early if this element already has a plugin instance
			if (element.data('eventCalendar')) return;

			// pass options to plugin constructor
			var eventCalendar = new $.eventCalendar(this, options);

			// Store plugin object in this element's data
			element.data('eventCalendar', eventCalendar);
		});
	};

	// Define the parameters with the default values of the function
	$.fn.eventCalendar.defaults = {
		eventsjson               : "js/events.json",
		jsonDateFormat           : "timestamp", // you can use also "human" which is the format 'YYYY-MM-DD HH:MM:SS'
		jsonData                 : "",          // to load and inline json (not ajax calls)
		cacheJson                : true,        // if true plugin get a json only first time and after plugin filter events
		                                        // if false plugin get a new json on each date change
		sortAscending            : true,        // false to sort descending
		eventsLimit              : 4,
		monthNames               : [ "January", "February", "March", "April", "May", "June",
		                             "July", "August", "September", "October", "November", "December" ],
		dayNames                 : [ "Sunday", "Monday", "Tuesday", "Wednesday",
		                             "Thursday", "Friday", "Saturday" ],
		dayNamesShort            : [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ],
		txt_noEvents             : "There are no events in this period",
		txt_SpecificEvents_prev  : "",
		txt_SpecificEvents_after : "events:",
		txt_next                 : "next",
		txt_prev                 : "prev",
		txt_NextEvents           : "Next events:",
		txt_GoToEventUrl         : "See the event",
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

}(jQuery));