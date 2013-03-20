<?php
/*
Plugin Name: Group Buying Addon - Fancy Reports: Search, Filter, Sorting and more.
Version: 0.01
Plugin URI: http://groupbuyingsite.com/marketplace
Description: Loads up the full report with some fancy AJAX and then uses some more fancy js to allow for sorting and filtering of the full report.
Author: Sprout Venture
Author URI: http://sproutventure.com/wordpress
Plugin Author: Dan Cameron
Contributors: Dan Cameron 
Text Domain: group-buying
Domain Path: /lang

*/

define ('GB_FR_PATH', WP_PLUGIN_DIR . '/' . basename( dirname( __FILE__ ) ) );
define( 'GB_FR_URLRESOURCES', plugins_url( 'resources', __FILE__ ) );

add_action('plugins_loaded', 'gb_load_fancy_reports');
function gb_load_fancy_reports() {
	if (class_exists('Group_Buying_Controller')) {
		require_once('groupbuyingReportsFiltering.class.php');
		Group_Buying_Fancy_Reporting_Addon::init();
	}
}