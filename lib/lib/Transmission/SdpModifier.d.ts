export declare class SdpModifier {
    labels: Map<string, Array<string>>;
    addLabels(bundleId: string, labels: Array<string>): void;
    removeLabels(bundleId: string): void;
}
