import { writable, get } from 'svelte/store';

type Review = {
    name: string,
    id: number,
    created: string,
    branch: string,
};

const cookieName = '__Host-github-token';
const storageName = 'gitHubToken';
const cookies: { [key: string]: string } = {};
document.cookie.split(';').forEach(cookie => {
    const [key, val] = cookie.trim().split('=');
    cookies[key] = val;
});

let accessToken: string?;
if (cookieName in cookies) {
    accessToken = cookies[cookieName];
    window.sessionStorage.setItem(storageName, cookies[cookieName]);
} else if (storageName in window.sessionStorage) {
    accessToken = window.sessionStorage.getItem(storageName);
}

class ApiProvider {
    accessToken = accessToken;
    isAuthenticated = accessToken && accessToken.length > 0;
    reviews = writable([] as Review[]);

    constructor() {
        /* this.accessToken.subscribe((value) => {
            if (typeof value === 'string' && value.length > 0) {
                this.isAuthenticated = true;
                return;
            }
            this.isAuthenticated = false;
        }); */

    }

    getReviews() {
        fetch('/api/reviews').then(r => r.json()).then(this.reviews.set);
        return this.reviews;
    }

    getReview(id: number) {
        const reviewArr = get(this.reviews);
        return reviewArr.find(item => item.id === id);
    }

    async uploadReview(branch: string, contentDeltas: object, tracks: string[], score: number) {
        const result = await fetch('/api/upload', {
            method: 'POST',
            body: JSON.stringify({
                token: this.accessToken,
                branch,
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