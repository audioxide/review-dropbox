import { writable } from 'svelte/store';

class ApiProvider {
    accessToken = writable('');
    isAuthenticated = false;

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
        const reviews = writable([]);
        setTimeout(() => reviews.set([
            { name: 'Shame // Drunk Tank Pink', slug: 'shame-drunk-tank-pink', created: new Date() },
            { name: 'Goan Dog // Call Your Mum', slug: 'goan-dog-call-your-mum', created: new Date() },
        ]), 500);
        return reviews;
    }

    getReview(slug: string) {
        const reviewObj = { name: 'Shame // Drunk Tank Pink', slug: 'shame-drunk-tank-pink', created: new Date() };
        const review = writable(reviewObj);
        setTimeout(() => review.set({
            ...reviewObj,

        }), 500);
        return review;
    }
}

export default new ApiProvider();