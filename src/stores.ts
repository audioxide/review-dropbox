import { Writable } from 'stream';
import { writable } from 'svelte/store';

const editingPost = {
    content: writable({}),
    score: writable(0),
    tracks: writable([] as string[])
};

export {
    editingPost,
};