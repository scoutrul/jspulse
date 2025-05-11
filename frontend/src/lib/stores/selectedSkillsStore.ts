import { writable } from 'svelte/store';

export const selectedSkillsStore = writable<string[]>([]); 