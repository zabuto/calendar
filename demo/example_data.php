<?php

/**
 * Dynamically retrieve data example
 */

if (!empty($_REQUEST['year']) && !empty($_REQUEST['month'])) {
	$year = (int)($_REQUEST['year']);
	$month = (int)($_REQUEST['month']);
	$lastday = (int)(strftime('%d', mktime(0, 0, 0, ($month === 12 ? 1 : $month + 1), 0, ($month === 12 ? $year + 1 : $year))));
	$classes = ['badge bg-dark', 'badge bg-secondary'];

	$data = [];
	for ($i = 0; $i <= (random_int(7, 14)); $i++) {
		$date = $year . '-' . str_pad($month, 2, '0', STR_PAD_LEFT) . '-' . str_pad((string)random_int(1, $lastday), 2, '0', STR_PAD_LEFT);
		$data[] = [
			'id' => uniqid(str_pad(($i + 1), 2, '0', STR_PAD_LEFT), true),
			'date' => $date,
			'classname' => 'grade-' . random_int(1, 4),
			'markup' => ($i & 1) ? '<span class="' . $classes[random_int(0, 1)] . '">[day]</span>' : null,
		];
	}

	header('Content-Type: application/json');
	echo json_encode($data);
} else {
	header('HTTP/1.1 400 Bad Request');
}
