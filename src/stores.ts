import { Writable } from 'stream';
import { writable } from 'svelte/store';

const editingPost = {
    content: writable({} as { ops: {}[] }),
    score: writable(0),
    tracks: writable([] as string[])
};

export {
    editingPost,
};