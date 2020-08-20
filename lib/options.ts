interface ICoverageOptions {
    /**
     * Function to determine which modules should be included in the coverage information.
     *
     * @param module The module information
     * @returns True if the module is to be included in the coverage output, false otherwise.
     */
    moduleFilter(module: Module): boolean;

    /**
     * Callback which periodically receives raw DynamoRio DRCOV format coverage data. This data can be written directly
     * to file (or otherwise sent elsewhere for egress) and then loaded directly into IDA lighthouse or Ghidra
     * Dragondance.
     *
     * @param coverageData The raw coverage data
     */
    onCoverage(coverageData: ArrayBuffer): void;

    /**
     * Function to determine which threads should be included in the coverage information.
     *
     * @param module The thread information
     * @returns True if the thread is to be included in the coverage output, false otherwise.
     */
    threadFilter(thread: ThreadDetails): boolean;
}

export { ICoverageOptions as CoverageOptions };
