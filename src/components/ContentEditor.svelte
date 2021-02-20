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
        var contentObj: { ops: {}[] };
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
            contentObj = editor.getContents();
            content.set(contentObj);
        });
        content.subscribe((newContent) => {
            if (newContent === contentObj) return;
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