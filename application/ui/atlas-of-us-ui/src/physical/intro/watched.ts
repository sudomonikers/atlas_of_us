import { watchedFlag } from '../../shared_components/story/watched';

//whether someone logged out has watched the story that opens Physical Traits this visit
export const { useWatched, noteWatched } = watchedFlag('physical');
