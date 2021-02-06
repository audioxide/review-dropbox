<script>
    import api from '../api';

    function fakeLogin() {
        api.setToken('TEST');
    }
</script>

<main class="flex items-center h-screen">
    <div class="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex flex-col items-center space-x-4">
        <div class="flex-shrink-0">
        <img class="h-12 w-12" src="/github-logo.svg" alt="ChitChat Logo">
        </div>
        <div>
            <p class="text-center"><a class="text-xl font-medium" href="#" on:click={fakeLogin}>Login with GitHub</a></p>
        </div>
    </div>
</main>