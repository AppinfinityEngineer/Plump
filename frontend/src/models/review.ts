export interface ReviewState {
  score: number;
  lastRequestedAt?: string;
  lifetimeRequests: number;
  events: string[];
}

export const INITIAL_REVIEW_STATE: ReviewState = {
  score: 0,
  lifetimeRequests: 0,
  events: [],
};
