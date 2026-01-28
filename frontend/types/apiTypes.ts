export interface Prediction {
    model: string;
    predicted: number;
    actual?: number;
    error?: number;
}