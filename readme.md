jQuery Event Calendar
=====================

Minor bug fixes and enhancements to the excellent [jQuery Event Calendar Plugin](http://www.vissit.com/jquery-event-calendar-plugin-english-version) currently hosted at [Google Code](https://code.google.com/p/jquery-events-calendar/).

Thanks to [jaime8111](https://github.com/jaime8111) for an awesome plugin.

# Changes #

* Quite a few bugs have been fixed (and a lot more introduced)
* Added support for multi-day events
* Added support for recurring events (wip)
* Added support to limit events to a date range
* Added date parsing support for titles (etc)
* Added internationalisation support
* Added unit test support (still very much a work in progress)

# Usage #

## Calendar Parameters ##

| Parameter                  | Default                                | Description                |
| -------------------------- | -------------------------------------- | -------------------------- |
| `eventsJson`               | `js/events.json`                       |                            |
| `jsonDateFormat`           | `"timestamp"`                          | Either *'timestamp'* or a date parser formatted string |
| `jsonData`                 | `""`                                   | Used to load and inline json (not ajax calls) |
| `cacheJson`                | `true`                                 | If *true* then the JSON data will only be retrieved on the initial load and cached. If *false* the JSON data will be fetched on each date change |
| `sortAscending`            | `true`                                 | *true* to sort ascending and *false* to sort descending |
| `eventsLimit`              | `4`                                    | Limits the number of events displayed in the calendar |
| `dayNameFormat`            | `"ddd"`                                | Date parser enabled format for the name of the day in the header row |
| `textCalendarTitle`        | `"MMMM yyyy"`                          | Date parser enabled format for the calendar title |
| `textEventHeaderDayView`   | `"MMMM ddS even\\t\\s:"`               | Date parser enabled format for the event list header (day mode) |
| `textEventHeaderMonthView` | `"MMMM even\\t\\s:"`                   | Date parser enabled format for the event list header (month mode) |
| `textNoEvents`             | `"There are no events in this period"` | Message to display when there are no events for the current period |
| `textNext`                 | `"next"`                               | |
| `textPrevious`             | `"prev"`                               | |
| `textNextEvents`           | `"Next events:"`                       | |
| `textGoToEventUrl`         | `"See the event"`                      | |
| `showDayAsWeeks`           | `true`                                 | |
| `startWeekOnMonday`        | `true`                                 | Determines if the calendar week starts on Sunday or Monday |
| `showDayNameInCalendar`    | `true`                                 | |
| `showDescription`          | `false`                                | Allows event descriptions to be shown |
| `collapsible`              | `false`                                | *true* if descriptions are collapsed, and opened when clicked |
| `onlyOneDescription`       | `true`                                 | *true* if only one description is to be displayed at any one time |
| `groupEvents`              | `false`                                | Show only a single event in the event list for recurring events |
| `openEventInNewWindow`     | `false`                                | *true* if event URL's are to open in a new window |
| `eventsScrollable`         | `false`                                | *true* for fixed height with scrollbar, *false* for dynamically changing height |
| `initialEventList`         | `false`                                | *false* for upcoming, *'day'* for today, or *'month'* for this month. |
| `currentDate`              | `new Date()`                           | Initial date for calender (this is mainly used for testing) |
| `startDate`                | `new Date(1900, 0, 1, 0, 0, 0)`        | Date of earliest event to show on the calendar |
| `endDate`                  | `new Date(2999, 0, 1, 0, 0, 0)`        | Date of latest event to show on the calendar |
| `allowPartialEvents`       | `false`                                | If a multi-day event falls across the start or end date, we either show a partial event (*true*) or the entire event (*false*) |
| `moveSpeed`                | `500`                                  | Speed of month move when you click on a new date |
| `moveOpacity`              | `0.15`                                 | Month and events fadeOut to this opacity |

**Notes**

* Date parser format strings can be found at https://code.google.com/p/datejs/wiki/FormatSpecifiers

