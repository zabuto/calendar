/**
 * Zabuto Calendar jQuery Plugin
 */

(function ($, window, document, undefined) {

	"use strict";

	/**
	 * Plugin name
	 */
	var pluginName = 'zabuto_calendar';

	/**
	 * Current date
	 */
	var now = new Date();

	/**
	 * Plugin constructor
	 */
	function ZabutoCalendar(element, options) {
		this.element = element;
		this._name = pluginName;
		this._defaults = $.fn[pluginName].defaults;
		this.settings = $.extend({}, this._defaults, options);

		if (null !== this.settings.translation) {
			this.settings.language = null;
		} else {
			this.settings.language = this.settings.language.toLowerCase();
		}

		this.init();
	}

	/**
	 * Plugin wrapper
	 */
	$.fn[pluginName] = function (options) {
		var argsArray;
		if (options !== undefined) {
			var args = $.makeArray(arguments);
			argsArray = args.slice(1);
		}

		return this.each(function () {
			var instance = $.data(this, 'plugin_' + pluginName);
			if (!instance) {
				$.data(this, 'plugin_' + pluginName, new ZabutoCalendar(this, options));
			} else {
				if (typeof options === 'string' && typeof instance[options] === 'function') {
					instance[options].apply(instance, argsArray);
				}
			}
		});
	};

	/**
	 * Defaults
	 */
	$.fn[pluginName].defaults = {
		year: now.getFullYear(),
		month: (now.getMonth() + 1),
		language: 'en',
		translation: null,
		week_starts: 'monday',
		show_days: true,
		classname: null,
		header_format: '[month] [year]',
		date_format: 'y-m-d',
		navigation_prev: true,
		navigation_next: true,
		navigation_markup: {
			prev: '&#9668;',
			next: '&#9658;'
		},
		today_markup: null,
		events: null,
		ajax: null
	};

	/**
	 * Languages
	 */
	$.fn[pluginName].languages = {};

	/**
	 * Functions
	 */
	$.extend(ZabutoCalendar.prototype, {
		/**
		 * Initialize
		 */
		init: function () {
			var event = $.Event('zabuto:calendar:init');
			event.settings = this.settings;

			var element = $(this.element);
			element.trigger(event);

			this.goto(this.settings.year, this.settings.month);
		},

		/**
		 * Destroy
		 */
		destroy: function () {
			var element = $(this.element);
			element.removeData('plugin_' + pluginName);
			element.removeData('year');
			element.removeData('month');
			element.removeData('event-data');
			element.empty();
			element.trigger('zabuto:calendar:destroy');
		},

		/**
		 * Reload
		 */
		reload: function () {
			var element = $(this.element);

			var event = $.Event('zabuto:calendar:reload');
			event.year = element.data('year');
			event.month = element.data('month');
			element.trigger(event);

			this.data();
		},

		/**
		 * Go to month/year
		 */
		goto: function (year, month) {
			if (false === this._isValidDate(year, month, 1)) {
				return;
			}

			var event = $.Event('zabuto:calendar:goto');
			event.year = year;
			event.month = month;

			var element = $(this.element);
			element.data('year', year);
			element.data('month', month);
			element.trigger(event);

			this.data();
		},

		/**
		 * Get data
		 */
		data: function () {
			var self = this;
			var element = $(this.element);
			var handle = self._getEventHandle();
			if (null === handle) {
				element.data('event-data', []);
				this.render();
			} else if (handle.type === 'fixed') {
				var data = self._eventsToDays(handle.data);

				var event = $.Event('zabuto:calendar:data');
				event.type = 'fixed';
				event.eventlist = handle.data;
				event.eventdata = data;

				element.data('event-data', data);
				element.trigger(event);

				self.render();
			} else if (handle.type === 'ajax') {
				var ajaxSettings = handle.settings;
				ajaxSettings.data = {year: element.data('year'), month: element.data('month')};
				ajaxSettings.dataType = 'json';

				$.ajax(ajaxSettings)
					.done(function (response) {
						var data = self._eventsToDays(response);

						var event = $.Event('zabuto:calendar:data');
						event.type = 'ajax';
						event.eventlist = response;
						event.eventdata = data;

						element.data('event-data', data);
						element.trigger(event);

						self.render();
					})
					.fail(function (jqXHR, textStatus, errorThrown) {
						var event = $.Event('zabuto:calendar:data-fail');
						event.text = textStatus;
						event.error = errorThrown;

						element.data('event-data', []);
						element.trigger(event);

						self.render();
					});
			}
		},

		/**
		 * Render calendar
		 */
		render: function () {
			var element = $(this.element);
			var year = element.data('year');
			var month = element.data('month');

			var preEvent = $.Event('zabuto:calendar:preRender');
			preEvent.year = year;
			preEvent.month = month;
			element.trigger(preEvent);

			element.empty();
			if (this._isValidDate(year, month, 1)) {
				element.append(this._renderTable(year, month));
			}

			var postEvent = $.Event('zabuto:calendar:render');
			postEvent.year = year;
			postEvent.month = month;
			element.trigger(postEvent);
		},

		/**
		 * Render table
		 */
		_renderTable: function (year, month) {
			var table = $('<table></table>').addClass('zabuto-calendar');

			if (this.settings.classname) {
				table.addClass(this.settings.classname);
			}

			var thead = $('<thead></thead>');
			thead.append(this._renderNavigation(year, month));

			if (true === this.settings.show_days) {
				thead.append(this._renderDaysOfWeek());
			}

			var tbody = this._renderDaysInMonth(year, month);

			table.append(thead);
			table.append(tbody);

			return table;
		},

		/**
		 * Render navigation
		 */
		_renderNavigation: function (year, month) {
			var self = this;

			var label = self.settings.header_format;
			label = label.replace('[year]', year.toString());

			var translation = self._getTranslation();
			if (null !== translation && 'months' in translation) {
				var labels = translation['months'];
				label = label.replace('[month]', labels[month.toString()]);
			} else {
				label = label.replace('[month]', month.toString());
			}

			var nav = $('<tr></tr>').addClass('zabuto-calendar__navigation').attr('role', 'navigation');

			var toPrev = self._calculatePrevious(year, month);
			var toNext = self._calculateNext(year, month);

			var title = $('<span></span>').text(label).data('to', {
				year: self.settings.year,
				month: self.settings.month
			});
			title.addClass('zabuto-calendar__navigation__item--header__title');

			if (null !== toPrev || null !== toNext) {
				title.on('zabuto:calendar:navigate-init', function (event) {
					var to = $(this).data('to');
					event.year = to.year;
					event.month = to.month;
					self.goto(to.year, to.month);
				}).on('dblclick', function () {
					$(this).trigger('zabuto:calendar:navigate-init');
				});
			}

			var header = $('<td></td>');
			header.addClass('zabuto-calendar__navigation__item--header');
			header.append(title);

			if (null === toPrev && null === toNext) {
				nav.append(header.attr('colspan', 7));
			} else {
				nav.append(self._renderNavigationItem('prev', toPrev));
				nav.append(header.attr('colspan', 5));
				nav.append(self._renderNavigationItem('next', toNext));
			}

			return nav;
		},

		/**
		 * Render navigation item
		 */
		_renderNavigationItem: function (type, to) {
			var self = this;

			type = type.toString();

			var item = $('<td></td>').data('nav', type).data('to', to);
			item.addClass('zabuto-calendar__navigation__item--' + type);

			if (null !== to) {
				if (type in self.settings.navigation_markup) {
					item.html(self.settings.navigation_markup[type]);
				} else {
					item.html(type);
				}

				item.on('zabuto:calendar:navigate', function (event) {
					var to = $(this).data('to');
					event.year = to.year;
					event.month = to.month;
					self.goto(to.year, to.month);
				}).on('click', function () {
					$(this).trigger('zabuto:calendar:navigate');
				});
			}

			return item;
		},

		/**
		 * Render days of week row
		 */
		_renderDaysOfWeek: function () {
			var start = this.settings.week_starts;

			var labels = {"0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6"};
			var translation = this._getTranslation();
			if (null !== translation && 'days' in translation) {
				labels = translation['days'];
			}

			var dow = $('<tr></tr>').addClass('zabuto-calendar__days-of-week');

			if (start === 0 || start === '0' || start === 'sunday') {
				dow.append($('<th></th>').data('dow', 0).text(labels['0']).addClass('zabuto-calendar__days-of-week__item'));
			}

			dow.append($('<th></th>').data('dow', 1).text(labels['1']).addClass('zabuto-calendar__days-of-week__item'));
			dow.append($('<th></th>').data('dow', 2).text(labels['2']).addClass('zabuto-calendar__days-of-week__item'));
			dow.append($('<th></th>').data('dow', 3).text(labels['3']).addClass('zabuto-calendar__days-of-week__item'));
			dow.append($('<th></th>').data('dow', 4).text(labels['4']).addClass('zabuto-calendar__days-of-week__item'));
			dow.append($('<th></th>').data('dow', 5).text(labels['5']).addClass('zabuto-calendar__days-of-week__item'));
			dow.append($('<th></th>').data('dow', 6).text(labels['6']).addClass('zabuto-calendar__days-of-week__item'));

			if (start === 1 || start === '1' || start === 'monday') {
				dow.append($('<th></th>').data('dow', 0).text(labels['0']).addClass('zabuto-calendar__days-of-week__item'));
			}

			return dow;
		},

		/**
		 * Render days of the month
		 */
		_renderDaysInMonth: function (year, month) {
			var self = this;
			var start = self.settings.week_starts;

			var weeks = self._calculateWeeksInMonth(year, month);
			var days = self._calculateLastDayOfMonth(year, month);
			var firstDow = self._calculateDayOfWeek(year, month, 1);

			var dows = [0, 1, 2, 3, 4, 5, 6];
			var checkDow = firstDow;
			if (start === 1 || start === '1' || start === 'monday') {
				dows = [1, 2, 3, 4, 5, 6, 7];
				checkDow = (firstDow === 0) ? 7 : firstDow;
			}

			var tbody = $('<tbody></tbody>');

			var day = 1;
			for (var wk = 1; wk <= weeks; wk++) {
				var row = self._renderWeek(wk, weeks);

				$.each(dows, function (i, dow) {
					if ((wk === 1 && dow < checkDow) || day > days) {
						row.append($('<td></td>').addClass('zabuto-calendar__day--empty'));
					} else {
						var cell = self._renderDay(year, month, day, dow);
						row.append(cell);
						day++;
					}
				});

				tbody.append(row);
			}

			return tbody;
		},

		/**
		 * Render single week
		 */
		_renderWeek: function (week, weeks) {
			var row = $('<tr></tr>');

			if (week === 1) {
				row.addClass('zabuto-calendar__week--first');
			} else if (week === weeks) {
				row.addClass('zabuto-calendar__week--last');
			} else {
				row.addClass('zabuto-calendar__week');
			}

			return row;
		},

		/**
		 * Render single day
		 */
		_renderDay: function (year, month, day, dow) {
			var date = this._dateAsString(year, month, day);
			var eventdata = this._eventsForDay(date);

			var cell = $('<td></td>');
			cell.data('date', date);
			cell.data('year', year);
			cell.data('month', month);
			cell.data('day', day);
			cell.data('dow', (dow === 7 ? 0 : dow));
			cell.data('eventdata', eventdata);

			if (this._isToday(year, month, day)) {
				cell.data('today', 1);
				cell.addClass('zabuto-calendar__day--today');
				if (this.settings.today_markup) {
					var todayMarkup = this.settings.today_markup;
					todayMarkup = todayMarkup.replace('[day]', day);
					cell.html(todayMarkup);
				} else {
					cell.text(day);
				}
			} else {
				cell.data('today', 0);
				cell.addClass('zabuto-calendar__day');
				cell.text(day);
			}

			if (null !== eventdata) {
				cell.data('hasEvent', 1);
				cell.addClass('zabuto-calendar__event');
				$.each(eventdata.classnames, function (i, val) {
					cell.addClass(val);
				});
				if (null !== eventdata.markup) {
					var eventMarkup = eventdata.markup;
					eventMarkup = eventMarkup.replace('[day]', day);
					cell.html(eventMarkup);
				}
			} else {
				cell.data('hasEvent', 0);
			}

			cell.on('zabuto:calendar:day', function (event) {
				event.element = $(this);
				event.date = new Date($(this).data('year'), ($(this).data('month') - 1), $(this).data('day'));
				event.value = $(this).data('date');
				event.today = !!($(this).data('today'));
				event.hasEvent = !!($(this).data('hasEvent'));
				event.eventdata = eventdata;
			}).on('click', function () {
				$(this).trigger('zabuto:calendar:day');
			});

			return cell;
		},

		/**
		 * Get translation
		 */
		_getTranslation: function () {
			var translation = this.settings.translation;
			if (null !== translation && typeof translation === 'object' && 'months' in translation && 'days' in translation) {
				return translation;
			}

			var locale = this.settings.language;
			var languages = $.fn[pluginName].languages;

			if (locale in languages) {
				return languages[locale];
			}

			return null;
		},

		/**
		 * Calculate number of weeks in the month
		 */
		_calculateWeeksInMonth: function (year, month) {
			var start = this.settings.week_starts;

			var daysInMonth = this._calculateLastDayOfMonth(year, month);
			var firstDow = this._calculateDayOfWeek(year, month, 1);
			var lastDow = this._calculateDayOfWeek(year, month, daysInMonth);

			var first = firstDow;
			var last = lastDow;
			if (start === 1 || start === '1' || start === 'monday') {
				first = (firstDow === 0) ? 7 : firstDow;
				last = (lastDow === 0) ? 7 : lastDow;
			}

			var offset = first - last;
			var days = daysInMonth + offset;

			return Math.ceil(days / 7);
		},

		/**
		 * Calculate the last day of the month
		 */
		_calculateLastDayOfMonth: function (year, month) {
			var jsMonth = month - 1;
			var date = new Date(year, jsMonth + 1, 0);

			return date.getDate();
		},

		/**
		 * Calculate day of the week (from 0 to 6)
		 */
		_calculateDayOfWeek: function (year, month, day) {
			var jsMonth = month - 1;
			var date = new Date(year, jsMonth, day);

			return date.getDay();
		},

		/**
		 * Calculate previous month/year
		 */
		_calculatePrevious: function (year, month) {
			if (false === this.settings.navigation_prev) {
				return null;
			}

			var prevYear = year;
			var prevMonth = (month - 1);
			if (prevMonth === 0) {
				prevYear = (year - 1);
				prevMonth = 12;
			}

			return {year: prevYear, month: prevMonth};
		},

		/**
		 * Calculate next month/year
		 */
		_calculateNext: function (year, month) {
			if (false === this.settings.navigation_next) {
				return null;
			}

			var nextYear = year;
			var nextMonth = (month + 1);
			if (nextMonth === 13) {
				nextYear = (year + 1);
				nextMonth = 1;
			}

			return {year: nextYear, month: nextMonth};
		},

		/**
		 * Check if date is valid
		 */
		_isValidDate: function (year, month, day) {
			if (month < 1 || month > 12) {
				return false;
			}

			var jsMonth = month - 1;
			var date = new Date(year, jsMonth, day);

			return date.getFullYear() === year && (date.getMonth()) === jsMonth && date.getDate() === Number(day);
		},

		/**
		 * Check if date is today
		 */
		_isToday: function (year, month, day) {
			var jsMonth = month - 1;

			var today = new Date();
			var date = new Date(year, jsMonth, day);

			return (date.toDateString() === today.toDateString());
		},

		/**
		 * Parse date string
		 */
		_dateAsString: function (year, month, day) {
			var string = this.settings.date_format;

			day = (day < 10) ? '0' + day : day;
			month = (month < 10) ? '0' + month : month;

			string = string.replace('y', year);
			string = string.replace('m', month);
			string = string.replace('d', day);

			return string;
		},

		/**
		 * Get event data handling
		 */
		_getEventHandle: function () {
			var events = this.settings.events;
			if (null !== events && typeof events === 'object') {
				return {type: 'fixed', data: events};
			}

			var ajaxSettings = this.settings.ajax;
			if (null !== ajaxSettings) {
				if (typeof ajaxSettings === 'string') {
					ajaxSettings = {
						type: 'GET',
						url: ajaxSettings,
						cache: false
					};
				}

				return {type: 'ajax', settings: ajaxSettings};
			}

			return null;
		},

		/**
		 * Convert events array to day-with-events object
		 */
		_eventsToDays: function (events) {
			var data = [];
			$.each(events, function (idx, event) {
				if (typeof event === 'object' && 'date' in event) {
					var date = event.date;
					var day = {count: 0, classnames: [], markup: null, events: []};
					if (date in data) {
						day = data[date];
					}

					day.count = day.count + 1;
					day.events.push(event);
					if ('classname' in event && event.classname !== null) {
						day.classnames.push(event.classname);
					}
					if ('markup' in event && event.markup !== null) {
						day.markup = event.markup;
					}

					data[date] = day;
				}
			});

			return data;
		},

		/**
		 * Get day-with-events object for specific day
		 */
		_eventsForDay: function (date) {
			var element = $(this.element);
			var eventData = element.data('event-data');

			if (!(date in eventData)) {
				return null;
			}

			var dayData = eventData[date];

			var event = $.Event('zabuto:calendar:day-event');
			event.value = date;
			event.eventdata = dayData;
			element.trigger(event);

			return dayData;
		}
	});

})(jQuery, window, document, undefined);
