interface ICoverageSession {
  /**
   * Function to stop coverage
   *
   */
  stop(): void;
}

export { ICoverageSession as CoverageSession };
