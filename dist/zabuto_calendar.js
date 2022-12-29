/*! Zabuto Calendar - v2.1.0 - 2022-12-29
* https://github.com/zabuto/calendar
* Copyright (c) 2022 Anke Heijnen; Licensed MIT */

;(function ($) {

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

$.fn['zabuto_calendar'].languages = $.fn['zabuto_calendar'].languages || {};
$.fn['zabuto_calendar'].languages["ar"] = {"months":{"1":"يناير","2":"فبراير","3":"مارس","4":"أبريل","5":"مايو","6":"يونيو","7":"يوليو","8":"أغسطس","9":"سبتمبر","10":"أكتوبر","11":"نوفمبر","12":"ديسمبر"},"days":{"0":"أحد","1":"أثنين","2":"ثلاثاء","3":"اربعاء","4":"خميس","5":"جمعه","6":"سبت"}};
$.fn['zabuto_calendar'].languages["az"] = {"months":{"1":"Yanvar","2":"Fevral","3":"Mart","4":"Aprel","5":"May","6":"İyun","7":"İyul","8":"Avqust","9":"Sentyabr","10":"Oktyabr","11":"Noyabr","12":"Dekabr"},"days":{"0":"Baz","1":"B.e","2":"Ç.A","3":"Çərş","4":"C.A","5":"Cümə","6":"Şən"}};
$.fn['zabuto_calendar'].languages["ca"] = {"months":{"1":"Gener","2":"Febrer","3":"Març","4":"Abril","5":"Maig","6":"Juny","7":"Juliol","8":"Agost","9":"Setembre","10":"Octubre","11":"Novembre","12":"Desembre"},"days":{"0":"Dg","1":"Dl","2":"Dt","3":"Dc","4":"Dj","5":"Dv","6":"Ds"}};
$.fn['zabuto_calendar'].languages["cn"] = {"months":{"1":"一月","2":"二月","3":"三月","4":"四月","5":"五月","6":"六月","7":"七月","8":"八月","9":"九月","10":"十月","11":"十一月","12":"十二月"},"days":{"0":"星期日","1":"星期一","2":"星期二","3":"星期三","4":"星期四","5":"星期五","6":"星期六"}};
$.fn['zabuto_calendar'].languages["cs"] = {"months":{"1":"Leden","2":"Únor","3":"Březen","4":"Duben","5":"Květen","6":"Červen","7":"Červenec","8":"Srpen","9":"Září","10":"Říjen","11":"Listopad","12":"Prosinec"},"days":{"0":"Ne","1":"Po","2":"Út","3":"St","4":"Čt","5":"Pá","6":"So"}};
$.fn['zabuto_calendar'].languages["de"] = {"months":{"1":"Januar","2":"Februar","3":"März","4":"April","5":"Mai","6":"Juni","7":"Juli","8":"August","9":"September","10":"Oktober","11":"November","12":"Dezember"},"days":{"0":"So","1":"Mo","2":"Di","3":"Mi","4":"Do","5":"Fr","6":"Sa"}};
$.fn['zabuto_calendar'].languages["en"] = {"months":{"1":"January","2":"February","3":"March","4":"April","5":"May","6":"June","7":"July","8":"August","9":"September","10":"October","11":"November","12":"December"},"days":{"0":"Sun","1":"Mon","2":"Tue","3":"Wed","4":"Thu","5":"Fri","6":"Sat"}};
$.fn['zabuto_calendar'].languages["es"] = {"months":{"1":"Enero","2":"Febrero","3":"Marzo","4":"Abril","5":"Mayo","6":"Junio","7":"Julio","8":"Agosto","9":"Septiembre","10":"Octubre","11":"Noviembre","12":"Diciembre"},"days":{"0":"Do","1":"Lu","2":"Ma","3":"Mi","4":"Ju","5":"Vi","6":"Sá"}};
$.fn['zabuto_calendar'].languages["fi"] = {"months":{"1":"Tammikuu","2":"Helmikuu","3":"Maaliskuu","4":"Huhtikuu","5":"Toukokuu","6":"Kesäkuu","7":"Heinäkuu","8":"Elokuu","9":"Syyskuu","10":"Lokakuu","11":"Marraskuu","12":"Joulukuu"},"days":{"0":"Su","1":"Ma","2":"Ti","3":"Ke","4":"To","5":"Pe","6":"La"}};
$.fn['zabuto_calendar'].languages["fr"] = {"months":{"1":"Janvier","2":"Février","3":"Mars","4":"Avril","5":"Mai","6":"Juin","7":"Juillet","8":"Août","9":"Septembre","10":"Octobre","11":"Novembre","12":"Décembre"},"days":{"0":"Dim","1":"Lun","2":"Mar","3":"Mer","4":"Jeu","5":"Ven","6":"Sam"}};
$.fn['zabuto_calendar'].languages["he"] = {"months":{"1":"ינואר","2":"פברואר","3":"מרץ","4":"אפריל","5":"מאי","6":"יוני","7":"יולי","8":"אוגוסט","9":"ספטמבר","10":"אוקטובר","11":"נובמבר","12":"דצמבר"},"days":{"0":"א","1":"ב","2":"ג","3":"ד","4":"ה","5":"ו","6":"ש"}};
$.fn['zabuto_calendar'].languages["hu"] = {"months":{"1":"Január","2":"Február","3":"Március","4":"Április","5":"Május","6":"Június","7":"Július","8":"Augusztus","9":"Szeptember","10":"Október","11":"November","12":"December"},"days":{"0":"Va","1":"Hé","2":"Ke","3":"Sze","4":"Cs","5":"Pé","6":"Szo"}};
$.fn['zabuto_calendar'].languages["id"] = {"months":{"1":"Januari","2":"Februari","3":"Maret","4":"April","5":"Mei","6":"Juni","7":"Juli","8":"Agustus","9":"September","10":"Oktober","11":"November","12":"Desember"},"days":{"0":"Minggu","1":"Senin","2":"Selasa","3":"Rabu","4":"Kamis","5":"Jum'at","6":"Sabtu"}};
$.fn['zabuto_calendar'].languages["it"] = {"months":{"1":"Gennaio","2":"Febbraio","3":"Marzo","4":"Aprile","5":"Maggio","6":"Giugno","7":"Luglio","8":"Agosto","9":"Settembre","10":"Ottobre","11":"Novembre","12":"Dicembre"},"days":{"0":"Dom","1":"Lun","2":"Mar","3":"Mer","4":"Gio","5":"Ven","6":"Sab"}};
$.fn['zabuto_calendar'].languages["jp"] = {"months":{"1":"1月","2":"2月","3":"3月","4":"4月","5":"5月","6":"6月","7":"7月","8":"8月","9":"9月","10":"10月","11":"11月","12":"12月"},"days":{"0":"日","1":"月","2":"火","3":"水","4":"木","5":"金","6":"土"}};
$.fn['zabuto_calendar'].languages["kr"] = {"months":{"1":"1월","2":"2월","3":"3월","4":"4월","5":"5월","6":"6월","7":"7월","8":"8월","9":"9월","10":"10월","11":"11월","12":"12월"},"days":{"0":"일","1":"월","2":"화","3":"수","4":"목","5":"금","6":"토"}};
$.fn['zabuto_calendar'].languages["nl"] = {"months":{"1":"Januari","2":"Februari","3":"Maart","4":"April","5":"Mei","6":"Juni","7":"Juli","8":"Augustus","9":"September","10":"Oktober","11":"November","12":"December"},"days":{"0":"Zo","1":"Ma","2":"Di","3":"Wo","4":"Do","5":"Vr","6":"Za"}};
$.fn['zabuto_calendar'].languages["no"] = {"months":{"1":"Januar","2":"Februar","3":"Mars","4":"April","5":"Mai","6":"Juni","7":"Juli","8":"August","9":"September","10":"Oktober","11":"November","12":"Desember"},"days":{"0":"Sø","1":"Ma","2":"Ti","3":"On","4":"To","5":"Fr","6":"Lø"}};
$.fn['zabuto_calendar'].languages["pl"] = {"months":{"1":"Styczeń","2":"Luty","3":"Marzec","4":"Kwiecień","5":"Maj","6":"Czerwiec","7":"Lipiec","8":"Sierpień","9":"Wrzesień","10":"Październik","11":"Listopad","12":"Grudzień"},"days":{"0":"niedz.","1":"pon.","2":"wt.","3":"śr.","4":"czw.","5":"pt.","6":"sob."}};
$.fn['zabuto_calendar'].languages["pt"] = {"months":{"1":"Janeiro","2":"Fevereiro","3":"Marco","4":"Abril","5":"Maio","6":"Junho","7":"Julho","8":"Agosto","9":"Setembro","10":"Outubro","11":"Novembro","12":"Dezembro"},"days":{"0":"D","1":"S","2":"T","3":"Q","4":"Q","5":"S","6":"S"}};
$.fn['zabuto_calendar'].languages["ru"] = {"months":{"1":"Январь","2":"Февраль","3":"Март","4":"Апрель","5":"Май","6":"Июнь","7":"Июль","8":"Август","9":"Сентябрь","10":"Октябрь","11":"Ноябрь","12":"Декабрь"},"days":{"0":"Вск","1":"Пн","2":"Вт","3":"Ср","4":"Чт","5":"Пт","6":"Сб"}};
$.fn['zabuto_calendar'].languages["se"] = {"months":{"1":"Januari","2":"Februari","3":"Mars","4":"April","5":"Maj","6":"Juni","7":"Juli","8":"Augusti","9":"September","10":"Oktober","11":"November","12":"December"},"days":{"0":"Sön","1":"Mån","2":"Tis","3":"Ons","4":"Tor","5":"Fre","6":"Lör"}};
$.fn['zabuto_calendar'].languages["sk"] = {"months":{"1":"Január","2":"Február","3":"Marec","4":"Apríl","5":"Máj","6":"Jún","7":"Júl","8":"August","9":"September","10":"Október","11":"November","12":"December"},"days":{"0":"Ne","1":"Po","2":"Ut","3":"St","4":"Št","5":"Pi","6":"So"}};
$.fn['zabuto_calendar'].languages["sr"] = {"months":{"1":"Јануар","2":"Фебруар","3":"Март","4":"Април","5":"Мај","6":"Јун","7":"Јул","8":"Август","9":"Септембар","10":"Октобар","11":"Новембар","12":"Децембар"},"days":{"0":"Нед","1":"Пон","2":"Уто","3":"Сре","4":"Чет","5":"Пет","6":"Суб"}};
$.fn['zabuto_calendar'].languages["tr"] = {"months":{"1":"Ocak","2":"Şubat","3":"Mart","4":"Nisan","5":"Mayıs","6":"Haziran","7":"Temmuz","8":"Ağustos","9":"Eylül","10":"Ekim","11":"Kasım","12":"Aralık"},"days":{"0":"Paz","1":"Pts","2":"Salı","3":"Çar","4":"Per","5":"Cuma","6":"Cts"}};
$.fn['zabuto_calendar'].languages["ua"] = {"months":{"1":"Січень","2":"Лютий","3":"Березень","4":"Квітень","5":"Травень","6":"Червень","7":"Липень","8":"Серпень","9":"Вересень","10":"Жовтень","11":"Листопад","12":"Грудень"},"days":{"0":"Нд","1":"Пн","2":"Вт","3":"Ср","4":"Чт","5":"Пт","6":"Сб"}};

})(jQuery);