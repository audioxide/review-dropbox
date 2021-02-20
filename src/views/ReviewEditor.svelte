<script>
    import { editingPost } from '../stores';
    import api from '../api';
    import ContentEditor from '../components/ContentEditor.svelte';

    export let currentRoute;

    const { tracks, score, content } = editingPost;
    const id = currentRoute.namedParams.id;
    const reviewInfo = api.getReviewInfo(Number(id));
    let editingTrack: string;

    let uploadPromise = Promise.resolve(false);

    api.getReview(reviewInfo.branch).then(review => {
        content.set({ ops: review.review });
        tracks.set(review.tracks);
        score.set(review.score.score);
    });

    function addTrack() {
        tracks.update(arr => {
            arr.push(editingTrack)
            return arr;
        });
        editingTrack = '';
    }

    const spliceTrack = (trackToRemove: string) => () => {
        tracks.update(arr => arr.filter(track => track !== trackToRemove));
    }

    function upload() {
        // TODO: Deal with async stuff
        uploadPromise = api.uploadReview(reviewInfo.branch, $content, $tracks, $score);
    }
</script>

<style>
    @keyframes success-highlight {
        from {
            background-color: #10B981;
        }
        to {
            background-color: #3B82F6;
        }
    }

    .success-highlight {
        animation: 1s ease-in-out success-highlight forwards;
    }
</style>

<main class="h-screen flex flex-col justify-center">
    <section class="container mx-auto p-8 rounded-xl shadow-md bg-white h-4/5 flex flex-col">
        <h1 class="text-3xl">{reviewInfo.name}</h1>
        <div class="relative flex-grow">
            <ContentEditor {content} />
        </div>
        <label>
            <span class="text-gray-700 block pt-5 pb-2">Score</span>
            <input class="border w-10" bind:value={$score} type="number" min="0" max="10" step="1" /><span class="text-gray-700 pl-2">out of 10</span>
        </label>
        <p class="text-gray-700 block pt-5 pb-2">Favourite tracks</p>
        <ul>
            {#each $tracks as track}
            <li class="py-1 inline-block mr-3 bg-gray-100 hover:bg-red-600 hover:text-white focus:bg-red-600 focus:text-white rounded-full px-3">“{track}” <button class="align-text-bottom cursor-pointer" on:click={spliceTrack(track)}>&times;</button></li>
            {/each}
        </ul>
        <span class="my-5 lg:w-1/5 md:w-1/2 w-full flex">
            {#if $tracks.length < 3}
            <input class="border p-1 flex-grow" placeholder="Track name" type="text" bind:value={editingTrack} on:keypress={e => e.code === 'Enter' ? addTrack() : null } /><button class="p-1 bg-blue-500 text-white px-2 rounded-r-md" on:click={addTrack}>+</button>
            {/if}
        </span>
        {#await uploadPromise}
        <button class="p-3 bg-gray-300 text-black rounded-md inline-block lg:w-32 md:w-1/4 w-auto">Uploading...</button>
        {:then showSuccess}
        <button class={`p-3 bg-blue-500 hover:bg-blue-700 text-white rounded-md inline-block lg:w-20 md:w-1/4 w-auto ${showSuccess ? 'success-highlight' : ''}`} on:click={upload}>Upload</button>
        {:catch error}
        <p class="text-red-700">{error.message}</p>
        <button class="p-3 bg-blue-500 hover:bg-blue-700 text-white rounded-md inline-block lg:w-32 md:w-1/4 w-auto" on:click={upload}>Retry upload</button>
        {/await}
    </section>
</main>