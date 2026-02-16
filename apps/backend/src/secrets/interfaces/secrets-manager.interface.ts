export interface ISecretsManager {
    /**
     * Retrieve a secret value by key.
     * @param key The key of the secret to retrieve.
     * @returns The secret value or undefined if not found.
     */
    getSecret(key: string): Promise<string | undefined>;

    /**
     * Retrieve a secret value by key, or throw an error if not found.
     * @param key The key of the secret to retrieve.
     * @returns The secret value.
     * @throws Error if the secret is not found.
     */
    getSecretOrThrow(key: string): Promise<string>;
}
