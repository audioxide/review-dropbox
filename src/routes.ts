import api from './api';
import LoginView from './views/LoginView.svelte';
import ReviewListing from './views/ReviewListing.svelte';
import ReviewEditor from './views/ReviewEditor.svelte';

const userIsAuthenticated = () => api.isAuthenticated;
const userIsUnauthenticated = () => !api.isAuthenticated;

const routes = [
  {
    name: '/',
    component: LoginView,
    onlyIf: { guard: userIsUnauthenticated, redirect: '/reviews' },
  },
  {
      name: 'reviews',
      component: ReviewListing,
      onlyIf: { guard: userIsAuthenticated, redirect: '/' },
  },
  {
    name: 'review/:id',
    component: ReviewEditor,
    onlyIf: { guard: userIsAuthenticated, redirect: '/' },
  },
]

export { routes }