export interface Clock {
    delay(ms: number): Promise<void>;
    now(): number;
}

export const RealClock: Clock = {
    delay: (ms) => new Promise((res) => setTimeout(res, ms)),
    now: () => Date.now(),
};

export const InstantClock: Clock = {
    delay: async () => { }, // sofort
    now: () => 0,
};