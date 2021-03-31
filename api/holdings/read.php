<?php
	header("Access-Control-Allow-Origin: *");
	header("Access-Control-Allow-Methods: GET");
	header("Content-Type: application/json");
	
	if($_SERVER["REQUEST_METHOD"] == "GET") {
		$utils = require_once("../utils.php");
		$helper = new Utils();

		$token = !empty($_GET["token"]) ? $_GET["token"] : die();
		if($helper->verifySession($token) || $helper->verifyPIN($token)) {
			echo file_get_contents($helper->holdingsFile);
		} else {
			echo json_encode(array("error" => "You need to be logged in to do that."));
		}
	} else {
		echo json_encode(array("error" => "Wrong request method. Please use GET."));
	}
?>