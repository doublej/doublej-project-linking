<script lang="ts">
	import type { WidgetLink } from './config.js';
	import LinkItem from './LinkItem.svelte';

	let { links, color }: { links: WidgetLink[]; color: string } = $props();

	let hovered = $state(false);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="widget"
	style:--accent={color}
	onmouseenter={() => (hovered = true)}
	onmouseleave={() => (hovered = false)}
>
	<div class="triangle"></div>
	<div class="drawer" class:open={hovered}>
		{#each links as link}
			<LinkItem {...link} {color} />
		{/each}
	</div>
</div>

<style>
	.widget {
		position: fixed;
		bottom: 0;
		right: 0;
		z-index: 2147483647;
		font-family: system-ui, -apple-system, sans-serif;
		color: white;
	}

	.triangle {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 60px;
		height: 60px;
		background: var(--accent);
		clip-path: polygon(100% 0, 100% 100%, 0 100%);
		cursor: pointer;
	}

	.drawer {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 240px;
		padding: 8px;
		background: color-mix(in srgb, var(--accent) 85%, black);
		backdrop-filter: blur(8px);
		border-radius: 8px 0 0 0;
		transform: translateX(100%);
		opacity: 0;
		transition:
			transform 200ms ease-out,
			opacity 200ms ease-out;
		pointer-events: none;
	}

	.drawer.open {
		transform: translateX(0);
		opacity: 1;
		pointer-events: auto;
	}
</style>
