<script>
	import './TailwindStyles.svelte';
	import { Router } from 'svelte-router-spa';
	import { routes } from './routes';

	const message = 'Learn Svelte';
</script>

<div class="bg-gray-50">
	<Router {routes} />
</div>
