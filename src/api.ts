import { writable, get } from 'svelte/store';

class ApiProvider {
    accessToken = writable('');
    isAuthenticated = false;
    reviews = writable([]);

    constructor() {
        this.accessToken.subscribe((value) => {
            if (typeof value === 'string' && value.length > 0) {
                this.isAuthenticated = true;
                return;
            }
            this.isAuthenticated = false;
        });
    }

    setToken(token: string) {
        this.accessToken.set(token);
    }

    getReviews() {
        fetch('/api/reviews').then(r => r.json()).then(this.reviews.set);
        return this.reviews;
    }

    getReview(id: number) {
        const reviewArr = get(this.reviews);
        return reviewArr.find(item => item.id === id);
    }

    async uploadReview(contentDeltas, tracks, score) {
        const result = await fetch('/api/upload', {
            method: 'POST',
            body: JSON.stringify({
                token: this.accessToken,
                content: contentDeltas,
                tracks,
                score,
            })
        });
        if (result.status !== 200) throw Error('An error occurred during upload.');
        return true;
    }

}

export default new ApiProvider();