Zabuto Calendar
=======

This library is a jQuery plugin for Bootstrap that lets you add a month calendar to your web page.

You can customize the display of the calendar and view it in several languages.
You are also able to show calendar events by using an AJAX request with JSON data and add a legend.

You can add a function to the calendar to execute when the onclick event is triggered on a specific day.

![Calendar example](http://zabuto.com/dev/calendar/examples/example.jpg)

For the calendar to function properly you need to include [jQuery](http://jquery.com/), and [Twitter Bootstrap](http://getbootstrap.com).
View the manifest *zabuto_calendar.jquery.json* for more information on the supported versions.

Include the script *zabuto_calendar.min.js* and the stylesheet *zabuto_calendar.min.css* in your page.

    <script src="{YOUR_PATH}/zabuto_calendar.min.js"></script>
    <link rel="stylesheet" type="text/css" href="{YOUR_PATH}/zabuto_calendar.min.css">

Use this code to initialize the calendar:

    <div id="my-calendar"></div>

    <script type="application/javascript">
        $(document).ready(function () {
            $("#my-calendar").zabuto_calendar({language: "en"});
        });
    </script>

## Settings
You can customize the calendar with several settings:

* language      (string)            Set the desired language of the calendar (de, en, es, fr, it, nl).
* year 	        (integer) 	        Initialize the calendar in a different year than the current year.
* month 	    (integer)	        Initialize the calendar in a different month than the current month (January=1, December=12).
* show_previous (boolean|integer) 	Disable the navigation to previous months completely or only allow a maximum number of months.
* show_next 	(boolean|integer) 	Disable the navigation to next months completely or only allow a maximum number of months.
* cell_border 	(boolean) 	        Set a cell-border around the calendar itself, the days-of-week header and the individual days. Otherwise only a line is displayed.
* today 	    (boolean) 	        Display today with a special badge.
* show_days 	(boolean) 	        Show the days-of-week header.
* weekstartson 	(integer) 	        Start the week on Sunday (0) or Monday (1).
* nav_icon 	    (object)  	        Override 'prev' and/or 'next' icon html

## Date Events
You are able to add date events by using an AJAX request with JSON data.

```$("#my-calendar").zabuto_calendar( { ajax: { url: "{YOUR_URL}" } } );```

The JSON data has to be an array of events in a specified format.

```{date: yyyy-mm-dd, badge: boolean, title: string, body: string: footer: string, classname: string}```

### Modal Event Window
You can use the *title*, *body* and *footer* elements of the element data in a Bootstrap.js modal window.
The information will be shown with a click on the day of the event.

```$("#my-calendar").zabuto_calendar( { ajax: { url: "{YOUR_URL}", modal: true } } );```

### Legend
You can add a legend to clarify the styling of the date events shown on the calendar.
The legend consists of an array of objects in a specified format.

```{type: string, label: string, badge: string, list: array}```

Allowed values for type are 'text', 'block', 'list' and 'spacer'.
The label is required for display type 'text' and optional for 'block'. It is not used for 'list' or 'spacer'.
The badge can be used as an extra setting for display type 'text' to show badge information.
You can use a classname as an extra setting for display type 'text' or 'block' to add a css class to the legend item.
The list contains an array of css classnames for the list of blocks for type 'list'.

## Action onclick

You can add functions to the calendar to execute when onclick events are triggered.

### Date
You can add a function to the calendar to execute when the onclick event is triggered on a specific day.

```$("#my-calendar").zabuto_calendar( { action: function() { myDateFunction(this.id); } } );```

To retrieve the date you need to access the element information using the calendar day ID. You can also check if an event is available for this date.

    function myDateFunction(id) {
        var date = $("#" + id).data("date");
        var hasEvent = $("#" + id).data("hasEvent");
    }

### Navigation
You are also able to add a function to the onclick event of the navigation to the previous or next month.

```$("#my-calendar").zabuto_calendar( { action_nav: function() { myNavFunction(this.id); } } );```

To retrieve information on the navigation action you need to access the element information using the calendar navigation ID. To can access the navigation info itself (prev/next) and information on the previous or next year and month.

    function myNavFunction(id) {
        var nav = $("#" + id).data("navigation");
        var to = $("#" + id).data("to");
    }


##Examples
Examples for the use of the calendar are includes in the sources.
You can also check them out in the demo: [http://zabuto.com/dev/calendar/examples/](http://zabuto.com/dev/calendar/examples/)


##License
Copyright (c) 2013 Anke Heijnen <anke@zabuto.com>

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
