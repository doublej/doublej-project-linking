<script lang="ts">
	let { label, url, icon, color }: { label: string; url: string; icon: string; color: string } =
		$props();
</script>

<a href={url} target="_blank" rel="noopener noreferrer" style:--accent={color}>
	<span class="icon">{@html icon}</span>
	<span class="label">{label}</span>
</a>

<style>
	a {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		margin-left: 16px;
		color: white;
		text-decoration: none;
		border-radius: 4px;
		transition: background 150ms ease;
		font-size: 13px;
		line-height: 1;
	}

	a:hover {
		background: rgba(255, 255, 255, 0.12);
	}

	.icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		opacity: 0.85;
	}

	.label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
