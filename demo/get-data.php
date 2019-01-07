<?php
/**
 * Dynamically retrieve data example
 */

if (!empty($_REQUEST['year']) && !empty($_REQUEST['month'])) {
	$year = intval($_REQUEST['year']);
	$month = intval($_REQUEST['month']);
	$lastday = intval(strftime('%d', mktime(0, 0, 0, ($month == 12 ? 1 : $month + 1), 0, ($month == 12 ? $year + 1 : $year))));
	$badges = ['light', 'dark'];

	$data = [];
	for ($i = 0; $i <= (rand(7, 14)); $i++) {
		$date = $year . '-' . str_pad($month, 2, '0', STR_PAD_LEFT) . '-' . str_pad(rand(1, $lastday), 2, '0', STR_PAD_LEFT);
		$data[] = [
			'id'        => uniqid(str_pad(($i + 1), 2, '0', STR_PAD_LEFT)),
			'date'      => $date,
			'classname' => 'grade-' . rand(1, 4),
			'markup'    => ($i & 1) ? '<span class="badge badge-' . $badges[rand(0, 1)] . '">[day]</span>' : null,
		];
	}

	header('Content-Type: application/json');
	echo json_encode($data);
} else {
	header('HTTP/1.1 400 Bad Request');
}
