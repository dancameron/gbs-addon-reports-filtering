<?php
if ( empty( $columns ) || empty( $records ) ) {
	do_action( 'gb_report_view' );
	gb_e( 'No Data' );
} else {
	global $gb_report_pages;
?>
<?php do_action( 'gb_report_view' ) ?>

<div class="report <?php if ( $gb_report_pages > 1 ) echo " cloak"; ?>">
	<?php do_action( 'gb_report_view_table_start' ) ?>
	<table>
		<thead>
			<tr>
			<?php foreach ( $columns as $key => $label ): ?>
				<th class="cart-<?php esc_attr_e( $key ); ?>" scope="col"><?php esc_html_e( $label ); ?></th>
			<?php endforeach; ?>
			</tr>
		</thead>
		<tbody id="report_rows">

			<?php foreach ( $records as $record ): ?>
				<tr>
					<?php foreach ( $columns as $key => $label ): ?>
						<td class="cart-<?php esc_attr_e( $key ); ?>">
							<?php if ( isset( $record[$key] ) ) { echo $record[$key]; } ?>
						</td>
					<?php endforeach; ?>
				</tr>
			<?php endforeach; ?>
		</tbody>
	</table>
</div>
<?php do_action( 'gb_report_view_nav' ) ?>

<?php do_action( 'gb_report_view_post_nav' ) ?>
<?php
}
?>
