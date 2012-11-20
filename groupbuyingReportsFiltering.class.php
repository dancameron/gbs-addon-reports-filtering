<?php

class Group_Buying_Fancy_Reporting extends Group_Buying_Controller {

	public static function init() {
		parent::init();
		add_action( 'gb_reports_show_records', array( get_class(), 'reports_show_records' ), 100, 1 );

		add_action( 'group_buying_template_reports/view.php', array( get_class(), 'new_view' ), 100, 1 );
		
		add_action( 'init', array( get_class(), 'queue_resources' ) );

		add_action( 'gb_report_view_table_start', array( get_class(), 'add_navigation' ), 100, 1 );
		add_action( 'gb_report_view', array( get_class(), 'progress_bar' ), 100, 1 );
		add_action( 'wp_footer', array( get_class(), 'javascript' ) );
		add_action( 'gb_reports_date_format', array( get_class(), 'reports_date_format' ) );
	}

	public function reports_date_format() {
		return 'M j, o g:i A';
	}

	public function javascript() {
		if ( isset( $_GET['report'] ) && !isset( $_GET['ajax'] ) ) {
			global $gb_report_pages;
			if ( $gb_report_pages > 1 ) {
				$report = Group_Buying_Reports::get_instance( $_GET['report'] );
				$report_url = $report->get_url();
				?>
				<script type="text/javascript">
				/* <![CDATA[ */
					jQuery(document).ready(function($){
						var $report_pages = <?php echo $gb_report_pages ?>;
						$("#report_rows tr").removeClass('odd');

						var $start_progress = (1/$report_pages)*100;
						$("#progress_bar").progressbar({ value: $start_progress });

						function load_records(i) {
							if ( i < $report_pages ) {
								var $url = '<?php echo add_query_arg( array( 'report' => $_GET['report'], 'id' => $_GET['id'], 'ajax' => TRUE ), $report_url ) ?>&showpage=';

								$( "<span>" )
									.load( $url + i + " #report_rows *", {} , 
										function( response, status, xhr ) {
											if (status == "error") {
												var msg = "<?php gb_e('Sorry but there was an error, this report is not complete: ') ?>";
												$("#load_errors").html(msg + xhr.status + " " + xhr.statusText);
											}
											$("#report_rows").append( $(this).html() );
											var $progress = ((i+1)/$report_pages)*100;
											$("#progress_bar").progressbar({ value: $progress });
											load_records(i+1);
										});
							}
							else {
								$("#progressbar").progressbar({ value: 100 });
								records_loaded();
							}
						}
						load_records(1);

						function records_loaded() {
							$("#report_page #progress_bar").fadeOut( 'slow' );
							$("#report_page .report").fadeIn();
							$(".report table")
								.tablesorter({debug: true, widgets: ['zebra'], sortList: [[0,0]]})
								.tablesorterFilter({
									filterContainer: "#filter-box",
									filterClearContainer: "#filter-clear-button",
									filterColumns: [0,1,5,6,7,8,9],
									// filterCaseSensitive: true
								});
							$(".page_title .report_button").click(function(event) {
								event.preventDefault();
								$('.report table').TableCSVExport();
							});
						}

					});

				/* ]]> */
				</script>
				<?php
			}
			// Not paged
			else {
				?>
					<script type="text/javascript">
						jQuery(document).ready(function($){
							$(".report table")
								.tablesorter({debug: true, widgets: ['zebra'], sortList: [[0,0]]})
								.tablesorterFilter({
									filterContainer: "#filter-box",
									filterClearContainer: "#filter-clear-button",
									filterColumns: [0,1,2,3,4,5,6,7,8,9,10],
									// filterCaseSensitive: true
								});
							
						});
					</script>
				<?php
			}
			?>
			<style type="text/css">
				/* tables */
				.report table {
					text-align: left;
				}
				.report table thead tr th, table.tablesorter tfoot tr th {
					padding: 4px;
				}
				.report table thead tr .header {
					background-image: url( <?php echo GB_FR_URLRESOURCES ?>/img/bg.gif);
					background-repeat: no-repeat;
					background-position: center right;
					cursor: pointer;
				}
				.report table tbody td {
					padding: 4px;
					vertical-align: top;
				}
				.report table thead tr .headerSortUp {
					background-image: url( <?php echo GB_FR_URLRESOURCES ?>/img/asc.gif );
				}
				.report table thead tr .headerSortDown {
					background-image: url( <?php echo GB_FR_URLRESOURCES ?>/img/desc.gif );
				}
			</style>
			<?php
		}
	}

	public static function queue_resources() {
		if ( isset( $_GET['report'] ) && !isset( $_GET['ajax'] ) ) {	
			wp_enqueue_script( 'table-sorter-and-filter', GB_FR_URLRESOURCES . '/table-sorter-and-filter.jquery.js', array( 'jquery', 'jquery-ui-progressbar' ), Group_Buying::GB_VERSION );
			wp_enqueue_style('jquery-ui-smoothness', 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/smoothness/jquery-ui.css', false );
		}
	}

	public function reports_show_records() {
		return 35;
	}

	public function new_view( $view ) {
		// return $view;
		return GB_FR_PATH . '/views/report-template.php';
	}

	public function add_navigation( $view ) {
		include 'views/navigation.php';
	}

	public function progress_bar(){
		global $gb_report_pages;
		if ( $gb_report_pages > 1 ) {	
			echo '<div id="progress_bar"></div>';
		}
	}

}


// Initiate the add-on
class Group_Buying_Fancy_Reporting_Addon extends Group_Buying_Controller {

	public static function init() {
		// Hook this plugin into the GBS add-ons controller
		add_filter( 'gb_addons', array( get_class(), 'gb_add_on' ), 10, 1 );
	}

	public static function gb_add_on( $addons ) {
		$addons['fancy_reporting'] = array(
			'label' => self::__( 'Fancy Reports: Search, Filter, Sorting and more.' ),
			'description' => self::__( 'Loads up the full report with some fancy AJAX and then uses some more fancy js to allow for sorting and filtering of the full report. Allows for CSV download of entire report and filtered and/or sorted report.' ),
			'files' => array(
				__FILE__
			),
			'callbacks' => array(
				array( 'Group_Buying_Fancy_Reporting', 'init' ),
			),
		);
		return $addons;
	}

}
