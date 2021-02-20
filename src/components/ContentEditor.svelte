<script>
    import {
        onMount,
        onDestroy,
    } from 'svelte';
    import Quill from 'quill';
    import 'quill/dist/quill.snow.css';
import type { Writable } from 'svelte/store';

    export let content: Writable<{ ops: {}[] }>;

    let container: HTMLElement;
    let editor: Quill;

    onMount(() => {
        editor = new Quill(container, {
            modules: {
                toolbar: [
                    ['bold', 'italic', 'link'],
                ]
            },
            placeholder: 'Compose an epic...',
            theme: 'snow'
        });
        editor.on('text-change', () => {
            content.set(editor.getContents());
        });
        content.subscribe((newContent) => {
            editor.setContents(newContent.ops);
        });
    });

    onDestroy(() => {
        const toolbar = container.previousElementSibling;
        editor.enable(false);
        editor = null;
        if (toolbar === null || !toolbar.classList.contains('ql-toolbar')) return;
        toolbar.remove();
    })
</script>

<style>
    .content-editor {
        height: calc(100% - 43px);
    }
</style>

<div bind:this={container} class="content-editor"></div>