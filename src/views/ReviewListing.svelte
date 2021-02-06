<script>
    import api from '../api';

    const reviews = api.getReviews();
</script>

<main class="h-screen flex flex-col justify-center">
    <section class="container mx-auto p-8 rounded-xl shadow-md bg-white">
        <h1 class="text-3xl">Reviews</h1>
        <ul class="mt-8 divide-y divide-gray-100">
            {#each $reviews as review, i}
            <li class="hover:bg-gray-100 py-5 rounded-sm px-3">
                <h3 class="text-xl"><a href={`review/${review.slug}`}>{review.name}</a></h3>
                <p>{review.created.toString()}</p>
            </li>
            {/each}
        </ul>
    </section>
</main>