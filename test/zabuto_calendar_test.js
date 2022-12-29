/**
 * Zabuto Calendar Test Suite
 */
(function ($) {
	QUnit.start();
	QUnit.module('zabuto_calendar');

	QUnit.test('registration', function (assert) {
		assert.ok($.fn.zabuto_calendar(), 'registered as a jQuery plugin');
	});

	QUnit.test('chainability', function (assert) {
		var $div = $('<div></div>');
		assert.ok($div.zabuto_calendar().addClass('testing'), 'can be chained');
		assert.ok($div.hasClass('testing'), 'successfully chained');
	});

	QUnit.test('default settings', function (assert) {
		var $div = $('<div></div>');
		var defaults = $.fn.zabuto_calendar.defaults;
		var newDefaults = $.extend({}, $.fn.zabuto_calendar.defaults, {foo: 'bar', baz: true});

		$.fn.zabuto_calendar.defaults = newDefaults;
		$div.zabuto_calendar();

		assert.propEqual($div.data('plugin_zabuto_calendar').settings, newDefaults, 'set new default settings');

		$.fn.zabuto_calendar.defaults = defaults;
	});

	QUnit.test('render', function (assert) {
		var $div = $('<div></div>');
		$div.zabuto_calendar();

		assert.ok($div.children('table').length === 1, 'table created');
		assert.ok($($div.children('table')[0]).children('thead').length === 1, 'table thead created');
		assert.ok($($div.children('table')[0]).children('tbody').length === 1, 'table tbody created');
	});

	QUnit.test('cleanup', function (assert) {
		var $div = $('<div></div>');
		$div.zabuto_calendar();
		$div.zabuto_calendar('destroy');

		assert.notOk($div.data('plugin_zabuto_calendar'), 'destroyed');
	});

	QUnit.test('year and month available', function (assert) {
		var $div = $('<div></div>');
		$div.zabuto_calendar();

		assert.ok(typeof $div.data('year') !== 'undefined', 'added data ”year” to element');
		assert.ok(typeof $div.data('month') !== 'undefined', 'added data ”month” to element');
	});

	QUnit.test('specific year and month', function (assert) {
		var $div = $('<div></div>');
		$div.zabuto_calendar({year: 2017, month: 2});
		assert.equal($div.data('year'), '2017', 'year set on init');
		assert.equal($div.data('month'), '2', 'month set on init');

		$div.zabuto_calendar('goto', 2018, 10);
		assert.equal($div.data('year'), '2018', 'year changed with goto');
		assert.equal($div.data('month'), '10', 'month changed with goto');
	});

	QUnit.test('invalid year and month', function (assert) {
		var $div = $('<div></div>');
		$div.zabuto_calendar({year: 9999, month: 99});

		assert.ok($div.children('table').length === 0, 'table not created for invalid year/month');
	});

	QUnit.test('table classnames', function (assert) {
		var $div = $('<div></div>');
		$div.zabuto_calendar({classname: 'my-test-class'});

		assert.ok($($div.children('table')[0]).hasClass('my-test-class'), 'custom table class set');
		assert.ok($($div.children('table')[0]).hasClass('zabuto-calendar'), 'global table class still available');
	});

	QUnit.test('navigation disabled', function (assert) {
		var $div = $('<div></div>').addClass('testing-no-nav');
		$div.zabuto_calendar({
			navigation_prev: false,
			navigation_next: false
		});

		var $table = $($div.children('table')[0]);
		var $thead = $($table.children('thead')[0]);
		var $row = $($thead.children('tr')[0]);

		assert.ok($row.children('td').length === 1, 'navigation row only contains 1 cell');
	});

	QUnit.test('translation', function (assert) {
		var translation = {
			months: {"1": "M1"},
			days: {"0": "D0", "1": "D1", "2": "D2", "3": "D3", "4": "D4", "5": "D5", "6": "D6"}
		};

		var $div = $('<div></div>');
		$div.zabuto_calendar({year: 2017, month: 1, translation: translation});

		var $table = $($div.children('table')[0]);
		var $thead = $($table.children('thead')[0]);

		var setMonthYear = null;
		var setDays = {};

		$thead.children('tr').each(function () {
			var $row = $(this);

			$row.children('td').each(function () {
				var $cell = $(this);
				if ($cell.hasClass('zabuto-calendar__navigation__item--header')) {
					var $span = $cell.children('span');
					setMonthYear = $span.text();
				}
			});

			$row.children('th').each(function () {
				var $cell = $(this);
				if ($cell.hasClass('zabuto-calendar__days-of-week__item')) {
					var dow = $cell.data('dow');
					setDays[dow] = $cell.text();
				}
			});
		});

		assert.propEqual('M1 2017', setMonthYear, 'month translation set');
		assert.propEqual(translation.days, setDays, 'day-of-week translation set');
	});

	QUnit.test('custom events', function (assert) {
		assert.expect(8);

		var $div = $('<div></div>');
		$div.data('test-passes', 0);

		$div.on('zabuto:calendar:init', function () {
			assert.ok(true, "zabuto:calendar:init event was triggered");
		});

		$div.on('zabuto:calendar:goto', function () {
			$div.data('test-passes', ($div.data('test-passes') + 1));
			assert.ok(true, "zabuto:calendar:goto event was triggered (#" + $div.data('test-passes') + ")");
		});

		$div.on('zabuto:calendar:reload', function () {
			$div.data('test-passes', ($div.data('test-passes') + 1));
			assert.ok(true, "zabuto:calendar:reload event was triggered (#" + $div.data('test-passes') + ")");
		});

		$div.on('zabuto:calendar:render', function () {
			$div.data('test-passes', ($div.data('test-passes') + 1));
			assert.ok(true, "zabuto:calendar:render event was triggered (#" + $div.data('test-passes') + ")");
		});

		$div.on('zabuto:calendar:destroy', function () {
			$div.data('test-passes', ($div.data('test-passes') + 1));
			assert.ok(true, "zabuto:calendar:destroy event was triggered");
		});

		$div.zabuto_calendar();
		$div.zabuto_calendar('goto', 2016, 12);
		$div.zabuto_calendar('reload');
		$div.zabuto_calendar('destroy');
	});

	QUnit.test('day click event', function (assert) {
		assert.expect(4);

		var $div = $('<div></div>');
		$div.zabuto_calendar();

		var $table = $($div.children('table')[0]);
		var $tbody = $($table.children('tbody')[0]);
		var $row = $($tbody.children('tr')[0]);
		var $cell = $($row.children('td')[($row.children('td').length - 1)]);

		$cell.on("click", function () {
			assert.ok(true, "click event was triggered");
		});

		$cell.on('zabuto:calendar:day', function () {
			assert.ok(true, "zabuto:calendar:day event was triggered");
		});

		var events = $._data($cell.get(0), "events");
		$.each(events, function (e) {
			if (e === 'click') {
				assert.ok(true, "click event is available");
			} else if (e === 'zabuto:calendar:day') {
				assert.ok(true, "zabuto:calendar:day event is available");
			}
		});

		$cell.trigger('click');
	});
}(jQuery));
